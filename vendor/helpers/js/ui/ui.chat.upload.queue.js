import { createElement, clearNode } from "./ui.dom.js";
import { createMediaStrip } from "./ui.media.strip.js";
import { createProgress } from "./ui.progress.js";
import { createIcon } from "./ui.icons.js";
import { createAudioPlayer } from "./ui.audio.player.js?v=0.21.271";

const REMOVE_ICON = () => createIcon("actions.close", { className: "ui-chat-upload-queue-remove-icon" });

const DEFAULT_OPTIONS = {
  className: "",
  emptyHidden: true,
  maxMediaThumbs: 8,
  mediaStripOptions: {},
  onRemove: null,
  onOpen: null,
};

export function createChatUploadQueue(container, data = {}, options = {}) {
  let currentItems = normalizeItems(data?.items || []);
  let currentOptions = { ...DEFAULT_OPTIONS, ...(options || {}) };
  let mediaStripApis = [];
  const audioCleanups = [];
  const progressNodes = [];
  function registerProgress(item, media = false) {
    const node = createProgressNode(item, media);
    progressNodes.push({node, id:item.id});
    return node;
  }
  function clearProgress() { progressNodes.splice(0).forEach(({node}) => node.destroyProgress()); }
  function applyItems(items) {
    const next = normalizeItems(items);
    const ignored = new Set(["status", "progress", "progressLabel"]);
    const same = next.length === currentItems.length && next.every((item,i) => {
      const old = currentItems[i];
      return item.id != null && Object.keys({...old,...item}).every(key => ignored.has(key) || old[key] === item[key]);
    });
    currentItems = next;
    if (same) progressNodes.forEach(({node,id}) => node.updateProgress(currentItems.find(item => item.id === id)));
    else render();
  }

  function render() {
    if (!container || container.nodeType !== 1) {
      return;
    }

    clearProgress();
    releaseAudioPlayers();
    clearNode(container);
    destroyMediaStrips(mediaStripApis);

    const root = createElement("div", {
      className: `ui-chat-upload-queue ${currentOptions.className || ""}`.trim(),
    });
    root.__chatUploadQueueRemove = (item) => currentOptions.onRemove?.(currentItems.find(candidate => candidate.id === item.id) || item);

    if (!currentItems.length) {
      root.hidden = Boolean(currentOptions.emptyHidden);
      container.appendChild(root);
      return;
    }

    const mediaItems = currentItems
      .filter((item) => item.kind === "image" || item.kind === "video")
      .slice(0, currentOptions.maxMediaThumbs);
    const fileItems = currentItems.filter((item) => item.kind !== "image" && item.kind !== "video");

    if (mediaItems.length) {
      const mediaSection = createElement("div", { className: "ui-chat-upload-queue-media" });
      const mediaHost = createElement("div", { className: "ui-chat-upload-queue-media-host" });
      mediaSection.appendChild(mediaHost);
      const stripApi = createMediaStrip(mediaHost, mediaItems.map((item) => ({
        id: item.id,
        type: item.kind === "video" ? "video" : "image",
        src: item.previewUrl || "",
        thumb: item.thumbUrl || item.posterUrl || (item.kind === "image" ? item.previewUrl : "") || "",
        poster: item.posterUrl || item.thumbUrl || "",
        title: item.name || "",
        alt: item.name || `${item.kind} attachment`,
      })), {
        layout: "wrap",
        ...((currentOptions.mediaStripOptions && typeof currentOptions.mediaStripOptions === "object")
          ? currentOptions.mediaStripOptions
          : {}),
        onOpen(openedItem, index) {
          const selected = mediaItems[index] || mediaItems.find((candidate) => candidate.id === openedItem?.id);
          const item = currentItems.find(candidate => candidate.id === selected?.id) || null;
          if (item) {
            currentOptions.onOpen?.(item);
          }
          currentOptions.mediaStripOptions?.onOpen?.(openedItem, index);
        },
      });
      mediaStripApis.push(stripApi);
      attachMediaThumbChrome(mediaHost, mediaItems, registerProgress);
      const mediaErrors = createMediaErrorList(mediaItems);
      if (mediaErrors) {
        mediaSection.appendChild(mediaErrors);
      }
      root.appendChild(mediaSection);
    }

    if (fileItems.length) {
      const files = createElement("div", { className: "ui-chat-upload-queue-files" });
      fileItems.forEach((item) => {
        const row = createElement("div", { className: "ui-chat-upload-queue-file" });
        const main = createElement("div", { className: "ui-chat-upload-queue-file-main" });
        const details = item.kind === "file"
          ? createElement("div", { className: "ui-chat-upload-queue-file-details" }) : main;
        if (details !== main) main.appendChild(details);
        if (item.kind === "audio" && item.previewUrl) {
          createAudioPreview(main, item);
        } else {
          details.appendChild(createElement("div", {
          className: "ui-chat-upload-queue-file-name",
          text: item.name || "Attachment",
          }));
        }
        if (item.sizeLabel && item.kind !== "audio") {
          details.appendChild(createElement("div", {
            className: "ui-chat-upload-queue-file-meta",
            text: item.sizeLabel,
          }));
        }
        const progressNode = registerProgress(item);
        if (progressNode) {
          main.appendChild(progressNode);
        }
        if (item.errorText) {
          main.appendChild(createElement("div", {
            className: "ui-chat-upload-queue-file-error",
            text: item.errorText,
          }));
        }
        row.appendChild(main);
        row.appendChild(createRemoveButton(item, "is-inline"));
        files.appendChild(row);
      });
      root.appendChild(files);
    }

    container.appendChild(root);
  }

  function createRemoveButton(item, className = "") {
    const button = createElement("button", {
      className: ["ui-chat-upload-queue-remove", className].filter(Boolean).join(" "),
      attrs: {
        type: "button",
        title: "Remove attachment",
        "aria-label": `Remove ${item.name || "attachment"}`,
      },
    });
    const icon = REMOVE_ICON();
    if (icon) {
      button.appendChild(icon);
    } else {
      button.textContent = "Remove";
    }
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      currentOptions.onRemove?.(currentItems.find(candidate => candidate.id === item.id) || item);
    });
    return button;
  }

  function update(nextData = {}, nextOptions = {}) {
    if (!Object.keys(nextOptions || {}).length) { applyItems(nextData.items ?? currentItems); return; }
    if (Object.prototype.hasOwnProperty.call(nextData || {}, "items")) {
      currentItems = normalizeItems(nextData.items || []);
    }
    currentOptions = { ...currentOptions, ...(nextOptions || {}) };
    render();
  }

  function destroy() {
    clearProgress();
    releaseAudioPlayers();
    destroyMediaStrips(mediaStripApis);
    clearNode(container);
  }

  function releaseAudioPlayers() {
    audioCleanups.splice(0).forEach((cleanup) => cleanup());
  }

  function createAudioPreview(main, item) {
    const host = createElement("div", { className: "ui-chat-upload-queue-audio" });
    const audio = document.createElement("audio");
    audio.hidden = true;
    audio.preload = "metadata";
    const error = createElement("div", { className: "ui-chat-upload-queue-file-error", attrs: { role: "status" } });
    error.hidden = true;
    main.append(host, audio, error);
    let disposed = false;
    const fail = () => {
      if (disposed) return;
      error.textContent = "Unable to play this audio. Try attaching a supported audio file.";
      error.hidden = false;
      sync();
    };
    const player = createAudioPlayer(host, {}, {
      ariaLabel: `Preview ${item.name || "audio attachment"}`,
      compact: true,
      onTogglePlay(playing) {
        if (playing) { error.hidden = true; audio.play().catch(fail); }
        else audio.pause();
      },
      onSeek(ms) {
        if (audio.readyState > 0) audio.currentTime = ms / 1000;
      },
    });
    function sync() {
      if (disposed) return;
      let duration = audio.duration;
      if (!Number.isFinite(duration) && audio.seekable.length) duration = audio.seekable.end(audio.seekable.length - 1);
      player.update({
        isPlaying: !audio.paused && !audio.ended,
        currentMs: audio.currentTime * 1000,
        durationMs: Number.isFinite(duration) ? duration * 1000 : 0,
      });
    }
    const events = ["loadedmetadata", "durationchange", "timeupdate", "play", "pause", "ended", "progress"];
    events.forEach((name) => audio.addEventListener(name, sync));
    audio.addEventListener("error", fail);
    audio.src = item.previewUrl;
    audioCleanups.push(() => {
      disposed = true;
      events.forEach((name) => audio.removeEventListener(name, sync));
      audio.removeEventListener("error", fail);
      audio.pause(); audio.removeAttribute("src"); audio.load();
      player.destroy();
    });
  }

  function setItems(items = []) {
    applyItems(items);
  }

  function getItems() {
    return currentItems.map((item) => ({ ...item }));
  }

  function getState() {
    return {
      items: getItems(),
      options: { ...currentOptions },
    };
  }

  render();
  return { update, destroy, setItems, getItems, getState };
}

function attachMediaThumbChrome(mediaHost, mediaItems, registerProgress) {
  const thumbs = Array.from(mediaHost.querySelectorAll(".ui-media-thumb"));
  thumbs.forEach((thumb, index) => {
    const item = mediaItems[index];
    if (!item) {
      return;
    }
    thumb.classList.add("ui-chat-upload-queue-media-thumb");
    const button = createElement("button", {
      className: "ui-chat-upload-queue-remove is-overlay",
      attrs: {
        type: "button",
        title: "Remove attachment",
        "aria-label": `Remove ${item.name || "attachment"}`,
      },
    });
    const icon = REMOVE_ICON();
    if (icon) {
      button.appendChild(icon);
    } else {
      button.textContent = "Remove";
    }
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      thumb.blur?.();
      const root = mediaHost.closest(".ui-chat-upload-queue");
      if (root && typeof root.__chatUploadQueueRemove === "function") {
        root.__chatUploadQueueRemove(item);
      }
    });
    thumb.appendChild(button);

    const stateNode = registerProgress(item, true);
    if (stateNode) {
      thumb.appendChild(stateNode);
    }
  });
}

function normalizeItems(items) {
  return Array.isArray(items)
    ? items.map((item) => ({
        ...item,
        kind: normalizeKind(item?.kind),
        status: normalizeStatus(item?.status),
        progress: normalizeProgress(item?.progress),
      }))
    : [];
}

function normalizeKind(kind) {
  const value = String(kind || "file").toLowerCase();
  if (value === "image" || value === "video" || value === "audio") {
    return value;
  }
  return "file";
}

function normalizeStatus(status) {
  const value = String(status || "queued").toLowerCase();
  if (value === "uploading" || value === "uploaded" || value === "failed") {
    return value;
  }
  return "queued";
}

function normalizeProgress(progress) {
  if (progress == null || progress === "") return null;
  const next = Number(progress);
  if (!Number.isFinite(next)) {
    return null;
  }
  return Math.max(0, Math.min(100, next));
}

function createMediaErrorList(items) {
  const failedItems = items.filter((item) => item.errorText);
  if (!failedItems.length) {
    return null;
  }
  const list = createElement("div", { className: "ui-chat-upload-queue-media-errors" });
  failedItems.forEach((item) => {
    list.appendChild(createElement("div", {
      className: "ui-chat-upload-queue-media-status-error",
      text: item.errorText,
    }));
  });
  return list;
}

function createProgressNode(item, media = false) {
  const wrap = createElement("div");
  const host = createElement("div");
  const label = createElement("div", {className: media ? "ui-chat-upload-queue-media-progress-label" : "ui-chat-upload-queue-progress-label"});
  wrap.append(host, label);
  const api = createProgress(host, {value: item.progress ?? 0}, {size:"sm",showLabel:false,showPercent:false,ariaLabel:`Upload ${item.name || "attachment"}`});
  wrap.updateProgress = next => {
    wrap.className = `${media ? "ui-chat-upload-queue-media-state" : "ui-chat-upload-queue-progress"} is-${next.status}`;
    wrap.hidden = next.status === "queued" && next.progress == null;
    host.hidden = next.progress == null && next.status !== "uploading";
    label.textContent = next.progressLabel || formatStatusLabel(next);
    label.hidden = media && next.status === "uploaded";
    api.update({value:next.progress ?? 0}, {indeterminate:next.status === "uploading" && next.progress == null, color:next.status === "failed" ? "#ff8d7a" : "#8fb0ff"});
  };
  wrap.destroyProgress = () => api.destroy();
  wrap.updateProgress(item);
  return wrap;
}

function formatStatusLabel(item) {
  if (item.status === "uploading") {
    return item.progress != null ? `${item.progress}%` : "Uploading";
  }
  if (item.status === "uploaded") {
    return "Uploaded";
  }
  if (item.status === "failed") {
    return "Failed";
  }
  return "Queued";
}

function destroyMediaStrips(list) {
  list.forEach((api) => api?.destroy?.());
  list.length = 0;
}
