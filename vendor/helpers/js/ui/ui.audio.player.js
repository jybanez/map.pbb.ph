import { createElement, clearNode } from "./ui.dom.js";
import { createEventBag } from "./ui.events.js";
import { createIcon } from "./ui.icons.js?v=0.21.240";

const DEFAULT_DATA = {
  isPlaying: false,
  currentMs: 0,
  durationMs: 0,
};

const DEFAULT_OPTIONS = {
  className: "",
  ariaLabel: "Audio player",
  seekLabel: "Seek audio",
  playLabel: "Play",
  pauseLabel: "Pause",
  onTogglePlay: null,
  onSeek: null,
  actions: [],
  compact: false,
};

export function createAudioPlayer(container, data = {}, options = {}) {
  const events = createEventBag();
  const actionEvents = createEventBag();
  let actionsHost = null;
  let currentData = normalizeData(data);
  let currentOptions = normalizeOptions(options);

  let root = null;
  let playButton = null;
  let timeLabel = null;
  let seekInput = null;
  let animationFrame = null;
  let displayedMs = currentData.currentMs;
  let seeking = false;
  let renderedIcon = null;
  let buttonLabel = null;

  function stopAnimation() {
    if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }

  function updateProgress() {
    stopAnimation();
    if (seeking) return;
    const target = currentData.currentMs;
    const from = displayedMs;
    const smooth = currentData.isPlaying && target > from && target - from < 1000
      && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!smooth) {
      displayedMs = target;
      seekInput.value = String(target);
      return;
    }
    const start = performance.now();
    const tick = (now) => {
      const fraction = Math.min(1, (now - start) / 150);
      displayedMs = from + (target - from) * fraction;
      seekInput.value = String(displayedMs);
      animationFrame = fraction < 1 ? requestAnimationFrame(tick) : null;
    };
    animationFrame = requestAnimationFrame(tick);
  }

  function render() {
    if (!container || container.nodeType !== 1) {
      return;
    }
    events.clear();
    clearNode(container);

    root = createElement("div", {
      className: `ui-audio-player ${currentOptions.className}`.trim(),
      attrs: {
        role: "region",
        "aria-label": currentOptions.ariaLabel,
      },
    });

    const topRow = createElement("div", { className: "ui-audio-player-row" });
    const bottomRow = createElement("div", { className: "ui-audio-player-row" });

    playButton = createElement("button", {
      className: "ui-button ui-action-borderless ui-audio-player-toggle",
      attrs: { type: "button" },
    });
    buttonLabel = createElement("span", { className: "ui-audio-player-button-label" });
    playButton.appendChild(buttonLabel);
    timeLabel = createElement("span", { className: "ui-audio-player-time" });
    seekInput = createElement("input", {
      className: "ui-audio-player-seek",
      attrs: {
        type: "range",
        min: "0",
        max: String(currentData.durationMs || 0),
        step: "10",
        value: String(currentData.currentMs || 0),
      },
    });

    const buttons = createElement("div", { className: "ui-audio-player-buttons" });
    actionsHost = createElement("div", { className: "ui-audio-player-actions" });
    buttons.append(playButton, actionsHost);
    topRow.append(buttons, timeLabel);
    renderActions();
    bottomRow.appendChild(seekInput);
    root.append(topRow, bottomRow);
    container.appendChild(root);

    events.on(playButton, "click", () => {
      currentOptions.onTogglePlay?.(!currentData.isPlaying, getState());
    });

    const handleSeek = (eventName) => {
      stopAnimation();
      const nextMs = clampMs(Number(seekInput.value), currentData.durationMs);
      displayedMs = nextMs;
      currentOptions.onSeek?.(nextMs, { eventName, state: getState() });
    };
    events.on(seekInput, "pointerdown", () => { seeking = true; stopAnimation(); });
    events.on(window, "pointerup", () => { seeking = false; });
    events.on(seekInput, "pointercancel", () => { seeking = false; applyState(); });
    events.on(seekInput, "input", () => handleSeek("input"));
    events.on(seekInput, "change", () => handleSeek("change"));

    applyState();
  }

  function applyState() {
    if (!playButton || !timeLabel || !seekInput) {
      return;
    }
    root.classList.toggle("is-compact", Boolean(currentOptions.compact));
    const iconName = currentData.isPlaying ? "media.pause" : "media.play";
    if (renderedIcon !== iconName) {
      playButton.querySelector(".ui-audio-player-icon")?.remove();
      playButton.prepend(createIcon(iconName, { className: "ui-audio-player-icon" }));
      renderedIcon = iconName;
    }
    buttonLabel.textContent = currentData.isPlaying ? currentOptions.pauseLabel : currentOptions.playLabel;
    playButton.setAttribute("aria-label", currentData.isPlaying ? currentOptions.pauseLabel : currentOptions.playLabel);
    playButton.title = currentData.isPlaying ? currentOptions.pauseLabel : currentOptions.playLabel;
    playButton.setAttribute("aria-pressed", currentData.isPlaying ? "true" : "false");
    timeLabel.textContent = `${formatClock(currentData.currentMs)} / ${formatClock(currentData.durationMs)}`;
    seekInput.max = String(currentData.durationMs || 0);
    updateProgress();
    seekInput.setAttribute("aria-label", currentOptions.seekLabel);
    seekInput.setAttribute("aria-valuetext", `${formatClock(currentData.currentMs)} of ${formatClock(currentData.durationMs)}`);
  }

  function update(nextData = {}, nextOptions = {}) {
    currentData = normalizeData({ ...currentData, ...nextData });
    currentOptions = normalizeOptions({ ...currentOptions, ...nextOptions });
    if (Object.prototype.hasOwnProperty.call(nextOptions, "actions")) renderActions();
    applyState();
  }

  function renderActions() {
    actionEvents.clear();
    clearNode(actionsHost);
    const actions = Array.isArray(currentOptions.actions) ? currentOptions.actions : [];
    actions.filter(action => action && !action.hidden).forEach(action => {
      const button = createElement("button", {
        className: "ui-button ui-action-borderless ui-audio-player-action",
        attrs: { type: "button", "aria-label": action.label || "Audio action", title: action.label || "Audio action" },
      });
      button.disabled = Boolean(action.disabled);
      if (action.icon) {
        const icon = createIcon(action.icon, { className: "ui-audio-player-icon" });
        if (icon) button.append(icon);
      }
      button.append(createElement("span", { className: "ui-audio-player-button-label", text: action.label || "Audio action" }));
      actionEvents.on(button, "click", () => action.onClick?.(getState(), action));
      actionsHost.append(button);
    });
  }

  function setPlaying(isPlaying) {
    update({ isPlaying: Boolean(isPlaying) });
  }

  function setCurrent(currentMs) {
    update({ currentMs });
  }

  function setDuration(durationMs) {
    update({ durationMs });
  }

  function destroy() {
    actionEvents.clear();
    stopAnimation();
    events.clear();
    clearNode(container);
    root = null;
    playButton = null;
    timeLabel = null;
    seekInput = null;
  }

  function getState() {
    return { ...currentData };
  }

  render();

  return {
    destroy,
    update,
    setPlaying,
    setCurrent,
    setDuration,
    getState,
  };
}

function normalizeData(data) {
  return {
    isPlaying: Boolean(data?.isPlaying),
    currentMs: clampMs(Number(data?.currentMs) || 0, Number(data?.durationMs) || 0),
    durationMs: Math.max(0, Number(data?.durationMs) || 0),
  };
}

function normalizeOptions(options) {
  return {
    ...DEFAULT_OPTIONS,
    ...(options || {}),
  };
}

function clampMs(value, max) {
  const safeMax = Math.max(0, Number(max) || 0);
  const safeValue = Math.max(0, Number(value) || 0);
  return Math.min(safeValue, safeMax);
}

function formatClock(ms) {
  const safeMs = Math.max(0, Number(ms) || 0);
  const totalSeconds = Math.floor(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
