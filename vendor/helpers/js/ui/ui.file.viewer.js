import { createModal } from "./ui.modal.js";
import { createDataInspector } from "./ui.data.inspector.js";
import { createMarkdownView } from "./ui.markdown.js";
import { createGrid } from "./ui.grid.js";
import { checkText, parseViewerJson, parseViewerCsv, viewerLimits, viewerSourceUrl, readViewerResponse } from "./ui.file.viewer.data.js";

export const createJsonViewer = options => createFileViewer("json", options);
export const createMarkdownViewer = options => createFileViewer("markdown", options);
export const createCsvViewer = options => createFileViewer("csv", options);

function createFileViewer(format, supplied = {}) {
  let options = normalize({ title: `${format === "markdown" ? "Markdown" : format.toUpperCase()} Viewer`, fullscreen: false, headers: true, ...supplied });
  let renderer = null, controller = null, revision = 0, destroyed = false;
  let status = "idle", error = "", rowCount = null, opener = null;
  const root = document.createElement("section");
  root.className = `ui-file-viewer ui-file-viewer-${format}`;
  const notice = document.createElement("p");
  notice.className = "ui-file-viewer-status";
  notice.setAttribute("role", "status");
  notice.setAttribute("aria-live", "polite");
  const retryButton = document.createElement("button");
  retryButton.type = "button"; retryButton.className = "ui-button"; retryButton.textContent = "Retry";
  const host = document.createElement("div");
  host.className = "ui-file-viewer-content";
  root.append(notice, retryButton, host);
  const toolbar = document.createElement("div");
  toolbar.className = "ui-file-viewer-tools";
  const external = document.createElement("a");
  external.textContent = "Open source"; external.target = "_blank"; external.rel = "noopener noreferrer";
  const download = document.createElement("a");
  download.textContent = "Download"; download.setAttribute("download", "");
  download.target = "_blank"; download.rel = "noopener noreferrer";
  const fullscreen = document.createElement("button");
  fullscreen.type = "button"; fullscreen.className = "ui-button ui-button-borderless";
  toolbar.append(external, download, fullscreen);
  const modal = createModal({
    title: options.title, ariaLabel: options.title, content: root, headerActions: toolbar,
    className: "ui-file-viewer-modal", size: options.fullscreen ? "full" : "xl",
    closeWhileBusy: true, escapeCloseWhileBusy: true, backdropCloseWhileBusy: true,
    onBeforeClose() { invalidate(); return true; },
    onClose(meta) { if (!modal.getState().open) { clearContent(); options.onClose?.(meta); } },
  });
  retryButton.addEventListener("click", reload);
  fullscreen.addEventListener("click", () => update({ fullscreen: !options.fullscreen }));
  const api = { open, close: meta => modal.close(meta), update, reload, destroy, getState,
    refs: { ...modal.refs, content: host, status: notice, retry: retryButton, external, download, fullscreen } };
  syncChrome();
  if (options.open) open();
  return api;

  function normalize(next) {
    if (typeof next.headers !== "boolean") throw new TypeError("headers must be a boolean.");
    if (next.content != null && typeof next.content !== "string") throw new TypeError("content must be a text string or null.");
    if (next.content != null && next.url) throw new TypeError("Choose content or url, not both. Use sourceUrl for content download links.");
    return { ...next, title: String(next.title || "File Viewer"),
      limits: viewerLimits(format, next.limits),
      url: viewerSourceUrl(next.url, document.baseURI),
      sourceUrl: viewerSourceUrl(next.sourceUrl, document.baseURI) };
  }
  function getState() { return { format, open: !destroyed && modal.getState().open, destroyed, status, error, rowCount, fullscreen: Boolean(options.fullscreen) }; }
  function invalidate() { revision++; controller?.abort(); controller = null; }
  function clearContent() { renderer?.destroy(); renderer = null; host.replaceChildren(); rowCount = null; }
  function syncChrome() {
    const focused = document.activeElement;
    const source = options.url || options.sourceUrl;
    for (const link of [external, download]) {
      link.hidden = !source;
      if (source) link.href = source; else link.removeAttribute("href");
    }
    fullscreen.textContent = options.fullscreen ? "Exit fullscreen" : "Fullscreen";
    fullscreen.setAttribute("aria-pressed", String(Boolean(options.fullscreen)));
    modal.update({ title: options.title, ariaLabel: options.title, size: options.fullscreen ? "full" : "xl" });
    if (modal.getState().open && modal.refs.panel.contains(focused) && !focused.disabled) {
      focused.focus({ preventScroll: true });
    }
  }
  function setStatus(next, message = "") {
    status = next; error = next.endsWith("error") ? message : "";
    root.dataset.status = next;
    notice.textContent = message;
    notice.hidden = !message;
    retryButton.hidden = !(options.url && next.endsWith("error"));
    modal.setBusy(next === "loading", { message: "Loading file…", cancelBusy: false });
    // Slot updates can detach a focused control. Keep focus in the active dialog.
    if (modal.getState().open && !modal.refs.panel.contains(document.activeElement)) {
      modal.refs.closeButton.focus({ preventScroll: true });
    }
  }
  function open(next) {
    if (destroyed) return false;
    if (next) update(next);
    if (modal.getState().open) return true;
    opener = document.activeElement;
    modal.open(); // Show and focus the canonical dialog before any asynchronous read.
    void reload();
    return true;
  }
  function update(patch = {}) {
    if (destroyed) return false;
    const merged = { ...options, ...patch };
    if (Object.hasOwn(patch, "url") && !Object.hasOwn(patch, "content")) merged.content = null;
    if (Object.hasOwn(patch, "content") && !Object.hasOwn(patch, "url")) merged.url = "";
    const next = normalize(merged); // Invalid options leave the current viewer intact.
    const reloadNeeded = ["url", "content", "headers", "limits", "sourceUrl"].some(key => Object.hasOwn(patch, key));
    options = next;
    syncChrome();
    if (reloadNeeded) { invalidate(); if (modal.getState().open) void reload(); }
    return true;
  }
  async function reload() {
    if (destroyed || !modal.getState().open) return;
    invalidate(); clearContent(); setStatus("loading", "Loading file…");
    const token = revision, snapshot = options;
    controller = new AbortController();
    const signal = controller.signal;
    const current = () => !destroyed && token === revision && modal.getState().open;
    let phase = "fetch-error";
    try {
      let text = snapshot.content ?? "";
      if (snapshot.url) {
        const response = await fetch(snapshot.url, { signal, credentials: "same-origin" });
        if (!current()) { await response.body?.cancel(); return; }
        text = await readViewerResponse(response, snapshot.limits.maxBytes, signal);
      }
      if (!current()) return;
      phase = "parse-error";
      text = checkText(text, snapshot.limits.maxBytes);
      if (!text.length || (format !== "csv" && !text.trim())) { setStatus("empty", "This file is empty."); return; }
      if (format === "json") {
        const data = parseViewerJson(text, snapshot.limits);
        // Inspector interprets null as absent data. Preserve valid JSON null explicitly.
        if (data === null) { const scalar = document.createElement("pre"); scalar.textContent = "null"; host.append(scalar); }
        else renderer = createDataInspector(host, data, { chrome: false, expandDepth: 1 });
      } else if (format === "markdown") {
        renderer = createMarkdownView(host, { markdown: text, profile: "full", linkTarget: "_blank" });
      } else {
        const parsed = parseViewerCsv(text, { ...snapshot.limits, headers: snapshot.headers });
        rowCount = parsed.rows.length;
        renderer = createGrid(host, parsed.rows, { columns: parsed.columns, enableSort: true, enableSearch: true,
          enableColumnResize: true, enablePagination: true, pageSize: 50, pageSizeOptions: [25, 50, 100], chrome: false });
        if (!rowCount) { setStatus("empty", "No data rows in this file."); return; }
      }
      setStatus("ready");
    } catch (cause) {
      if (!current() || signal.aborted) return;
      clearContent();
      setStatus(phase, cause instanceof RangeError ? cause.message : `${phase === "parse-error" ? "Unable to parse file" : "Unable to load file"}. ${cause.message || "Check the source and retry."}`);
    }
  }
  function destroy() {
    if (destroyed) return;
    invalidate(); clearContent(); destroyed = true; status = "destroyed";
    const returnFocus = modal.getState().open;
    // Destroy is synchronous; avoid leaving an asynchronous close finalizer behind.
    modal.destroy();
    if (returnFocus && opener?.isConnected) opener.focus({ preventScroll: true });
    retryButton.removeEventListener("click", reload);
  }
}
