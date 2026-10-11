import { createElement, clearNode } from "./ui.dom.js";
import { createEventBag } from "./ui.events.js";

const DEFAULT_OPTIONS = {
  url: "",
  title: "PDF Viewer",
  initialPage: null,
  open: false,
  fullscreen: true,
  className: "",
  ariaLabel: "PDF viewer",
  loadingMessage: "Loading PDF...",
  readyMessage: "",
  readyDelayMs: 800,
  emptyMessage: "No PDF selected.",
  unsupportedMessage: "This browser cannot display the PDF inline.",
  errorMessage: "The PDF could not be loaded.",
  closeOnEscape: true,
  closeOnBackdrop: true,
  showHeader: true,
  showCloseButton: true,
  trapFocus: true,
  onOpen: null,
  onClose: null,
  onError: null,
  onLoad: null,
};

const tabbableSelector = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

export function createPdfViewer(containerOrOptions = null, maybeOptions = {}) {
  const hasContainer = containerOrOptions && containerOrOptions.nodeType === 1;
  const container = hasContainer ? containerOrOptions : document.body;
  const ownsContainer = !hasContainer;
  let options = normalizeOptions(hasContainer ? maybeOptions : containerOrOptions || {});
  let isOpen = Boolean(options.open);
  let status = options.url ? "loading" : "empty";
  let focusReturnEl = null;
  let shell = null;
  let dialog = null;
  let titleEl = null;
  let stateEl = null;
  let closeBtn = null;
  let frameEl = null;
  let readyTimer = null;
  let pendingFrameSrc = "";
  const events = createEventBag();

  const api = {
    open,
    close,
    update,
    destroy,
    getState,
    get root() {
      return ownsContainer ? shell : container;
    },
  };

  render();
  if (isOpen) {
    open();
  }

  function render() {
    events.clear();
    if (!container || container.nodeType !== 1) {
      return;
    }

    if (ownsContainer && !shell) {
      shell = createElement("div", { className: "ui-pdf-viewer-shell" });
      container.appendChild(shell);
    }

    const host = ownsContainer ? shell : container;
    clearNode(host);

    const backdrop = createElement("div", { className: "ui-pdf-viewer-backdrop", attrs: { "aria-hidden": "true" } });
    dialog = createElement("section", {
      className: [
        "ui-pdf-viewer",
        options.fullscreen ? "is-fullscreen" : "is-windowed",
        options.className,
      ].filter(Boolean).join(" "),
      attrs: {
        role: "dialog",
        "aria-modal": "true",
        "aria-label": options.ariaLabel || options.title || "PDF viewer",
        tabindex: "-1",
      },
    });

    if (options.showHeader) {
      const header = createElement("div", { className: "ui-pdf-viewer-header" });
      const heading = createElement("div", { className: "ui-pdf-viewer-heading" });
      titleEl = createElement("h2", { className: "ui-pdf-viewer-title", text: options.title });
      stateEl = createElement("p", { className: "ui-pdf-viewer-state", attrs: { "aria-live": "polite" } });
      heading.append(titleEl, stateEl);
      header.appendChild(heading);

      if (options.showCloseButton) {
        closeBtn = createElement("button", {
          className: "ui-button ui-button-ghost ui-button-icon ui-pdf-viewer-close",
          html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
          attrs: { type: "button", "aria-label": "Close PDF viewer", title: "Close PDF viewer" },
        });
        events.on(closeBtn, "click", () => close({ reason: "close-button" }));
        header.appendChild(closeBtn);
      }
      dialog.appendChild(header);
    } else {
      stateEl = createElement("p", { className: "ui-pdf-viewer-state ui-pdf-viewer-state--sr", attrs: { "aria-live": "polite" } });
      dialog.appendChild(stateEl);
    }

    const body = createElement("div", { className: "ui-pdf-viewer-body" });
    frameEl = createElement("iframe", {
      className: "ui-pdf-viewer-frame",
      attrs: {
        title: options.title || "PDF document",
      },
    });
    body.appendChild(frameEl);
    dialog.appendChild(body);

    host.classList.add("ui-pdf-viewer-shell");
    host.classList.toggle("is-open", isOpen);
    host.append(backdrop, dialog);

    events.on(backdrop, "click", () => {
      if (options.closeOnBackdrop) {
        close({ reason: "backdrop" });
      }
    });
    events.on(dialog, "keydown", onDialogKeydown);
    events.on(frameEl, "load", () => markReady(frameEl?.getAttribute("src") || ""));
    events.on(frameEl, "error", () => {
      clearReadyTimer();
      setStatus("error");
      invoke(options.onError, getState());
    });
    refresh();
  }

  function refresh() {
    if (!frameEl) {
      return;
    }
    if (titleEl) {
      titleEl.textContent = options.title || "PDF Viewer";
    }
    if (!options.url) {
      clearReadyTimer();
      pendingFrameSrc = "";
      frameEl.removeAttribute("src");
      setStatus("empty");
      return;
    }
    clearReadyTimer();
    setStatus("loading");
    frameEl.setAttribute("title", options.title || "PDF document");
    pendingFrameSrc = buildPdfUrl(options.url, options.initialPage);
    frameEl.setAttribute("src", pendingFrameSrc);
    readyTimer = window.setTimeout(() => markReady(pendingFrameSrc), options.readyDelayMs);
  }

  function open(nextOptions = null) {
    if (nextOptions && typeof nextOptions === "object") {
      options = normalizeOptions({ ...options, ...nextOptions });
    }
    if (!shell && ownsContainer) {
      render();
    }
    focusReturnEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    isOpen = true;
    const host = ownsContainer ? shell : container;
    host?.classList.add("is-open");
    refresh();
    window.setTimeout(() => dialog?.focus?.({ preventScroll: true }), 0);
    invoke(options.onOpen, getState());
    return api;
  }

  function close(meta = {}) {
    if (!isOpen) {
      return api;
    }
    isOpen = false;
    const host = ownsContainer ? shell : container;
    host?.classList.remove("is-open");
    focusReturnEl?.focus?.({ preventScroll: true });
    invoke(options.onClose, { ...getState(), ...meta });
    return api;
  }

  function update(nextOptions = {}) {
    const wasOpen = isOpen;
    options = normalizeOptions({ ...options, ...nextOptions });
    render();
    if (wasOpen) {
      window.setTimeout(() => dialog?.focus?.({ preventScroll: true }), 0);
    }
    return api;
  }

  function destroy() {
    clearReadyTimer();
    events.clear();
    const host = ownsContainer ? shell : container;
    clearNode(host);
    if (ownsContainer && shell?.parentNode) {
      shell.parentNode.removeChild(shell);
    } else {
      host?.classList.remove("ui-pdf-viewer-shell", "is-open");
    }
    shell = null;
    dialog = null;
    frameEl = null;
  }

  function setStatus(nextStatus) {
    const previousStatus = status;
    status = nextStatus;
    if (!stateEl) {
      return;
    }
    const messages = {
      loading: options.loadingMessage,
      ready: options.readyMessage,
      empty: options.emptyMessage,
      error: options.errorMessage,
    };
    stateEl.textContent = messages[status] || "";
    if (status === "ready" && previousStatus !== "ready") {
      invoke(options.onLoad, getState());
    }
  }

  function markReady(frameSrc) {
    if (status !== "loading" || frameSrc !== pendingFrameSrc) {
      return;
    }
    clearReadyTimer();
    setStatus("ready");
  }

  function clearReadyTimer() {
    if (readyTimer) {
      window.clearTimeout(readyTimer);
      readyTimer = null;
    }
  }

  function onDialogKeydown(event) {
    if (event.key === "Escape" && options.closeOnEscape) {
      event.preventDefault();
      close({ reason: "escape" });
      return;
    }
    if (event.key !== "Tab" || !options.trapFocus) {
      return;
    }
    const tabbables = Array.from(dialog.querySelectorAll(tabbableSelector)).filter((node) => node.offsetParent !== null);
    if (!tabbables.length) {
      event.preventDefault();
      dialog.focus();
      return;
    }
    const first = tabbables[0];
    const last = tabbables[tabbables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function getState() {
    return {
      open: isOpen,
      status,
      url: options.url,
      title: options.title,
      initialPage: options.initialPage,
    };
  }

  return api;
}

function normalizeOptions(options = {}) {
  const next = { ...DEFAULT_OPTIONS, ...(options || {}) };
  next.url = typeof next.url === "string" ? next.url.trim() : "";
  next.title = String(next.title || DEFAULT_OPTIONS.title);
  next.initialPage = normalizePage(next.initialPage);
  next.fullscreen = next.fullscreen !== false;
  next.closeOnEscape = next.closeOnEscape !== false;
  next.closeOnBackdrop = next.closeOnBackdrop !== false;
  next.showHeader = next.showHeader !== false;
  next.showCloseButton = next.showCloseButton !== false;
  next.trapFocus = next.trapFocus !== false;
  next.readyDelayMs = normalizeDelay(next.readyDelayMs);
  return next;
}

function normalizePage(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return null;
  }
  return Math.max(1, Math.floor(number));
}

function buildPdfUrl(url, initialPage) {
  if (!initialPage) {
    return url;
  }
  const [base, hash = ""] = String(url).split("#", 2);
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  params.set("page", String(initialPage));
  return `${base}#${params.toString()}`;
}

function normalizeDelay(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    return DEFAULT_OPTIONS.readyDelayMs;
  }
  return Math.floor(number);
}

function invoke(callback, payload) {
  if (typeof callback === "function") {
    callback(payload);
  }
}

export default createPdfViewer;
