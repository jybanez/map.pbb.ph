import { createElement, clearNode } from "./ui.dom.js";
import { createEventBag } from "./ui.events.js";

const DEFAULT_OPTIONS = {
  className: "",
  panePadding: null,
  chrome: true,
  disabled: false,
  orientation: "horizontal", // horizontal = left/right, vertical = top/bottom
  initialRatio: 0.5,
  minRatio: 0.2,
  maxRatio: 0.8,
  paneA: null,
  paneB: null,
  onResize: null,
};

export function createSplitter(container, options = {}) {
  const events = createEventBag();
  let currentOptions = normalizeOptions(options);
  let ratio = clamp(currentOptions.initialRatio, currentOptions.minRatio, currentOptions.maxRatio);
  let root = null;
  let divider = null;
  let paneA = null;
  let paneB = null;
  let cancelDrag = null;

  function isInteractive() {
    return !currentOptions.disabled && currentOptions.minRatio < currentOptions.maxRatio;
  }

  function render() {
    if (!container || container.nodeType !== 1) {
      return;
    }
    cancelDrag?.();
    events.clear();
    clearNode(container);

    root = createElement("section", {
      className: [
        "ui-splitter",
        `ui-splitter--${currentOptions.orientation}`,
        currentOptions.chrome ? "" : "ui-splitter--chromeless",
        currentOptions.className || "",
      ].filter(Boolean).join(" "),
    });
    paneA = createElement("div", { className: "ui-splitter-pane is-a" });
    paneB = createElement("div", { className: "ui-splitter-pane is-b" });
    for (const pane of [paneA, paneB]) {
      if (currentOptions.panePadding !== null) pane.style.padding = `${currentOptions.panePadding}px`;
    }
    divider = createElement("button", {
      className: "ui-splitter-divider",
      attrs: { type: "button", "aria-label": "Resize panes" },
    });
    divider.disabled = !isInteractive();
    divider.title = "Drag or use arrow keys to resize; double-click to reset";

    setSlot(paneA, currentOptions.paneA, "Pane A");
    setSlot(paneB, currentOptions.paneB, "Pane B");

    root.append(paneA, divider, paneB);
    container.appendChild(root);
    applyRatio();

    events.on(divider, "pointerdown", startDrag);
    events.on(divider, "mousedown", startDragMouse);
    events.on(divider, "touchstart", startDragTouch, { passive: false });
    events.on(divider, "keydown", onDividerKeyDown);
    events.on(divider, "dblclick", () => {
      if (!isInteractive()) return;
      cancelDrag?.();
      setRatio(currentOptions.initialRatio, { emit: true });
    });
  }

  function startDrag(event) {
    if (!isInteractive() || event.button !== 0 || event.isPrimary === false || cancelDrag) return;
    event.preventDefault();
    try {
      if (typeof divider?.setPointerCapture === "function" && event.pointerId != null) {
        divider.setPointerCapture(event.pointerId);
      }
    } catch (_) {
      // ignore unsupported pointer capture
    }
    beginDrag(() => ({ x: event.clientX, y: event.clientY }), {
      moveEvent: "pointermove",
      endEvents: ["pointerup", "pointercancel"],
      extract: (moveEvent) => ({ x: moveEvent.clientX, y: moveEvent.clientY }),
      pointerId: event.pointerId,
    });
  }

  function startDragMouse(event) {
    if (typeof window.PointerEvent !== "undefined" || !isInteractive() || event.button !== 0 || cancelDrag) {
      return;
    }
    event.preventDefault();
    beginDrag(() => ({ x: event.clientX, y: event.clientY }), {
      moveEvent: "mousemove",
      endEvents: ["mouseup"],
      extract: (moveEvent) => ({ x: moveEvent.clientX, y: moveEvent.clientY }),
    });
  }

  function startDragTouch(event) {
    if (typeof window.PointerEvent !== "undefined" || !isInteractive() || cancelDrag || !event.touches || !event.touches[0]) {
      return;
    }
    event.preventDefault();
    beginDrag(() => ({ x: event.touches[0].clientX, y: event.touches[0].clientY }), {
      moveEvent: "touchmove",
      endEvents: ["touchend", "touchcancel"],
      extract: (moveEvent) => {
        const touch = moveEvent.touches?.[0] ?? moveEvent.changedTouches?.[0];
        return { x: touch?.clientX ?? 0, y: touch?.clientY ?? 0 };
      },
      moveOptions: { passive: false },
    });
  }

  function beginDrag(getStartPoint, config) {
    const dragRoot = root;
    const dragDivider = divider;
    const vertical = currentOptions.orientation === "vertical";
    const size = vertical ? root.clientHeight - divider.offsetHeight : root.clientWidth - divider.offsetWidth;
    const startRatio = ratio;
    const start = getStartPoint();
    const docEl = document.documentElement;
    const body = document.body;
    const previousStyles = [docEl, body].filter(Boolean).map(el => ({ el, userSelect: el.style.userSelect, cursor: el.style.cursor }));
    root.classList.add("is-dragging");
    if (docEl) {
      docEl.style.userSelect = "none";
      docEl.style.cursor = currentOptions.orientation === "vertical" ? "row-resize" : "col-resize";
    }
    if (body) {
      body.style.userSelect = "none";
      body.style.cursor = currentOptions.orientation === "vertical" ? "row-resize" : "col-resize";
    }
    const onMove = (moveEvent) => {
      if (config.pointerId !== undefined && moveEvent.pointerId !== config.pointerId) return;
      if (typeof moveEvent.preventDefault === "function") {
        moveEvent.preventDefault();
      }
      const point = config.extract(moveEvent);
      const delta = vertical ? point.y - start.y : point.x - start.x;
      const nextRatio = clamp(startRatio + delta / Math.max(1, size), currentOptions.minRatio, currentOptions.maxRatio);
      if (nextRatio !== ratio) setRatio(nextRatio, { emit: true });
    };
    const onUp = (event) => {
      if (event?.pointerId !== undefined && config.pointerId !== undefined && event.pointerId !== config.pointerId) return;
      window.removeEventListener(config.moveEvent, onMove, config.moveOptions);
      window.removeEventListener("blur", onUp);
      dragDivider.removeEventListener("lostpointercapture", onUp);
      for (const eventName of config.endEvents) {
        window.removeEventListener(eventName, onUp);
      }
      dragRoot.classList.remove("is-dragging");
      cancelDrag = null;
      for (const { el, userSelect, cursor } of previousStyles) {
        el.style.userSelect = userSelect;
        el.style.cursor = cursor;
      }
      try {
        if (config.pointerId !== undefined && dragDivider.hasPointerCapture?.(config.pointerId)) dragDivider.releasePointerCapture(config.pointerId);
      } catch (_) { /* Detached dividers may already have lost capture. */ }
    };
    cancelDrag = onUp;
    window.addEventListener("blur", onUp);
    dragDivider.addEventListener("lostpointercapture", onUp);
    window.addEventListener(config.moveEvent, onMove, config.moveOptions);
    for (const eventName of config.endEvents) {
      window.addEventListener(eventName, onUp);
    }
  }

  function onDividerKeyDown(event) {
    if (!isInteractive()) return;
    const step = 0.02;
    let handled = true;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      setRatio(ratio - step, { emit: true });
    } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      setRatio(ratio + step, { emit: true });
    } else if (event.key === "Home") {
      setRatio(currentOptions.minRatio, { emit: true });
    } else if (event.key === "End") {
      setRatio(currentOptions.maxRatio, { emit: true });
    } else {
      handled = false;
    }
    if (handled) {
      event.preventDefault();
    }
  }

  function applyRatio() {
    if (!root) {
      return;
    }
    const ratioA = `${Math.max(0.0001, ratio)}fr`;
    const ratioB = `${Math.max(0.0001, 1 - ratio)}fr`;
    root.style.setProperty("--ui-splitter-ratio-a", String(ratio));
    root.style.setProperty("--ui-splitter-ratio-b", String(1 - ratio));
    if (currentOptions.orientation === "vertical") {
      root.style.gridTemplateRows = `${ratioA} 24px ${ratioB}`;
      root.style.gridTemplateColumns = "";
    } else {
      root.style.gridTemplateColumns = `${ratioA} 24px ${ratioB}`;
      root.style.gridTemplateRows = "";
    }
  }

  function setRatio(nextRatio, config = {}) {
    ratio = clamp(Number(nextRatio) || 0.5, currentOptions.minRatio, currentOptions.maxRatio);
    applyRatio();
    if (config.emit) {
      currentOptions.onResize?.(ratio, getState());
    }
  }

  function update(nextOptions = {}) {
    cancelDrag?.();
    currentOptions = normalizeOptions({ ...currentOptions, ...(nextOptions || {}) });
    if (Object.prototype.hasOwnProperty.call(nextOptions, "initialRatio")) {
      ratio = clamp(currentOptions.initialRatio, currentOptions.minRatio, currentOptions.maxRatio);
    } else {
      ratio = clamp(ratio, currentOptions.minRatio, currentOptions.maxRatio);
    }
    render();
  }

  function getState() {
    return {
      ratio,
      options: { ...currentOptions },
    };
  }

  function destroy() {
    cancelDrag?.();
    events.clear();
    clearNode(container);
    root = null;
    divider = null;
    paneA = null;
    paneB = null;
  }

  render();
  return {
    update,
    setRatio,
    getState,
    destroy,
  };
}

function setSlot(target, value, fallback) {
  clearNode(target);
  if (value == null) {
    target.appendChild(createElement("p", { className: "ui-splitter-empty", text: fallback }));
    return;
  }
  if (typeof value === "function") {
    setSlot(target, value(), fallback);
    return;
  }
  if (value instanceof HTMLElement) {
    target.appendChild(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => setSlot(target, entry, fallback));
    return;
  }
  target.appendChild(document.createTextNode(String(value)));
}

function normalizeOptions(options) {
  const next = { ...DEFAULT_OPTIONS, ...(options || {}) };
  next.panePadding = typeof next.panePadding === "number" && Number.isFinite(next.panePadding) && next.panePadding >= 0
    ? next.panePadding : DEFAULT_OPTIONS.panePadding;
  next.chrome = next.chrome !== false;
  next.disabled = next.disabled === true;
  next.orientation = String(next.orientation || "horizontal").toLowerCase() === "vertical"
    ? "vertical"
    : "horizontal";
  next.initialRatio = clamp(Number(next.initialRatio) || 0.5, 0.05, 0.95);
  next.minRatio = clamp(Number(next.minRatio) || 0.2, 0.05, 0.95);
  next.maxRatio = clamp(Number(next.maxRatio) || 0.8, 0.05, 0.95);
  if (next.minRatio > next.maxRatio) {
    const temp = next.minRatio;
    next.minRatio = next.maxRatio;
    next.maxRatio = temp;
  }
  return next;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
