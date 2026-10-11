import { createElement, clearNode } from "./ui.dom.js";

const DEFAULT_OPTIONS = {
  label: "Signal",
  level: 0,
  tone: "neutral",
  text: "",
  title: "",
  ariaLabel: "",
  ariaLive: "off",
  showText: true,
  size: "compact",
  className: "",
  onStateChange: null,
};

const STATE_KEYS = Object.keys(DEFAULT_OPTIONS).filter(key => key !== "onStateChange");

export function createSignalStrength(container, options = {}) {
  let currentOptions = normalizeOptions(options);
  let root = null;
  let barsNode = null;
  let textNode = null;
  let destroyed = false;
  let notifying = false;
  const notifications = [];

  function renderShell() {
    if (!container || container.nodeType !== 1 || destroyed) {
      return;
    }
    clearNode(container);
    root = createElement("span", {
      className: buildClassName(currentOptions),
      attrs: {
        role: "status",
        "aria-live": currentOptions.ariaLive,
        "aria-label": buildAriaLabel(currentOptions),
        title: currentOptions.title || buildAriaLabel(currentOptions),
      },
      dataset: {
        level: String(currentOptions.level),
        tone: currentOptions.tone,
        showText: currentOptions.showText ? "true" : "false",
      },
    });

    barsNode = createElement("span", {
      className: "ui-signal-strength-bars",
      attrs: { "aria-hidden": "true" },
    });
    for (let index = 1; index <= 4; index += 1) {
      barsNode.appendChild(createElement("span", {
        className: "ui-signal-strength-bar",
        dataset: { bar: String(index) },
      }));
    }
    root.appendChild(barsNode);

    if (currentOptions.showText) {
      textNode = createElement("span", {
        className: "ui-signal-strength-text",
        text: currentOptions.text,
      });
      root.appendChild(textNode);
    } else {
      textNode = null;
    }

    container.appendChild(root);
    sync();
  }

  function sync() {
    if (!root || destroyed) {
      return;
    }
    root.className = buildClassName(currentOptions);
    root.dataset.level = String(currentOptions.level);
    root.dataset.tone = currentOptions.tone;
    root.dataset.showText = currentOptions.showText ? "true" : "false";
    root.setAttribute("aria-label", buildAriaLabel(currentOptions));
    root.setAttribute("aria-live", currentOptions.ariaLive);
    root.setAttribute("title", currentOptions.title || buildAriaLabel(currentOptions));
    barsNode?.querySelectorAll(".ui-signal-strength-bar").forEach((bar, index) => {
      bar.classList.toggle("is-active", index < currentOptions.level);
    });
    if (textNode) {
      textNode.textContent = currentOptions.text;
    }
  }

  function update(nextOptions = {}) {
    if (destroyed) return;
    const previous = snapshot(currentOptions);
    const next = normalizeOptions({ ...currentOptions, ...(nextOptions || {}) });
    const current = snapshot(next);
    const needsShell = next.showText !== currentOptions.showText;
    currentOptions = next;
    if (needsShell) {
      renderShell();
    } else {
      sync();
    }
    if (STATE_KEYS.some(key => previous[key] !== current[key]) && next.onStateChange) {
      notifications.push({ callback: next.onStateChange, previous, current });
      notify();
    }
  }

  // Reentrant updates commit immediately but deliver events in FIFO order,
  // without recursively calling observers. Report the first observer error
  // after queued transitions finish; observer failures never roll back state.
  function notify() {
    if (notifying) return;
    notifying = true;
    let failed = false;
    let firstError;
    try {
      while (notifications.length && !destroyed) {
        const { callback, previous, current } = notifications.shift();
        try { callback({ previous, current }); }
        catch (error) { if (!failed) { failed = true; firstError = error; } }
      }
    } finally { notifying = false; }
    if (failed) throw firstError;
  }

  function getState() {
    return { ...currentOptions };
  }

  function destroy() {
    destroyed = true;
    notifications.length = 0;
    clearNode(container);
    root = null;
    barsNode = null;
    textNode = null;
  }

  renderShell();

  return {
    destroy,
    getState,
    update,
  };
}

function normalizeOptions(input = {}) {
  const next = {
    ...DEFAULT_OPTIONS,
    ...(input || {}),
  };
  return {
    ...next,
    label: String(next.label || ""),
    level: normalizeLevel(next.level),
    tone: normalizeTone(next.tone),
    text: String(next.text || ""),
    title: String(next.title || ""),
    ariaLabel: String(next.ariaLabel || ""),
    ariaLive: normalizeAriaLive(next.ariaLive),
    showText: next.showText !== false,
    size: normalizeSize(next.size),
    className: String(next.className || ""),
    onStateChange: typeof next.onStateChange === "function" ? next.onStateChange : null,
  };
}

function snapshot(options) {
  return Object.freeze(Object.fromEntries(STATE_KEYS.map(key => [key, options[key]])));
}

function normalizeLevel(value) {
  const parsed = Math.round(Number(value));
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.max(0, Math.min(4, parsed));
}

function normalizeTone(value) {
  const next = String(value || "neutral").toLowerCase();
  return ["ok", "warn", "danger", "offline", "neutral"].includes(next) ? next : "neutral";
}

function normalizeSize(value) {
  const next = String(value || "compact").toLowerCase();
  return next === "regular" ? "regular" : "compact";
}

function normalizeAriaLive(value) {
  const next = String(value || "off").toLowerCase();
  return ["off", "polite", "assertive"].includes(next) ? next : "off";
}

function buildAriaLabel(options) {
  if (options.ariaLabel) {
    return options.ariaLabel;
  }
  const label = options.label || "Signal";
  const text = options.text || toneText(options.tone);
  return `${label}: ${text}, ${options.level} of 4 bars`;
}

function toneText(tone) {
  if (tone === "ok") {
    return "Connected";
  }
  if (tone === "warn") {
    return "Degraded";
  }
  if (tone === "danger") {
    return "Weak";
  }
  if (tone === "offline") {
    return "Offline";
  }
  return "Unknown";
}

function buildClassName(options) {
  return [
    "ui-signal-strength",
    `ui-signal-strength--${options.size}`,
    `ui-signal-strength--${options.tone}`,
    options.showText ? "" : "is-bars-only",
    options.className,
  ].filter(Boolean).join(" ");
}
