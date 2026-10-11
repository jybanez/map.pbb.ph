import { createElement, clearNode } from "./ui.dom.js";
import { createEventBag } from "./ui.events.js";
import { createCalendar } from "./ui.calendar.js?v=0.21.191";

import { parseCivil, formatCivil, civilMonth, civilTime, civilAtTime } from "./ui.datepicker.civil.js?v=0.21.191";

const DEFAULT_OPTIONS = {
  className: "",
  ariaLabel: "Date picker",
  locale: "en-US",
  placeholder: "Select date",
  mode: "single", // single | range
  value: null, // single: Date|string|null, range: {start,end}|[start,end]
  closeOnSelect: true,
  weekStartsOn: 0, // 0=Sun
  showTime: false,
  timePrecision: "auto", // minute changes editing/display, never stored-value hydration
  valueMode: "instant", // wall-clock uses civil strings, never browser-zone conversion
  disabled: false,
  readonly: false,
  min: null,
  max: null,
  disabledDates: null, // (date:Date) => boolean
  yearRangePast: 80,
  yearRangeFuture: 20,
  panelParent: "auto", // auto | self | body | HTMLElement
  onChange: null,
};

export function createDatepicker(container, options = {}) {
  const events = createEventBag();
  const globalEvents = createEventBag();
  const portalEvents = createEventBag();
  let currentOptions = normalizeOptions(options);
  let open = false;
  let destroyed = false;
  const wallClock = currentOptions.valueMode === "wall-clock";
  let viewDate = monthStart(new Date());
  let start = null;
  let end = null;
  let startTime = "00:00";
  let endTime = "00:00";
  let root = null;
  let trigger = null;
  let panel = null;
  let calendar = null;
  let lastFocusedElement = null;
  const panelId = `ui-datepicker-panel-${Math.random().toString(36).slice(2, 10)}`;

  hydrateValue(currentOptions.value);

  function render() {
    if (destroyed || !container || container.nodeType !== 1) {
      return;
    }
    events.clear();
    globalEvents.clear();
    portalEvents.clear();
    calendar?.destroy();
    calendar = null;
    panel?.remove?.();
    clearNode(container);

    root = createElement("div", {
      className: `ui-datepicker ${currentOptions.className || ""}`.trim(),
    });
    trigger = createElement("button", {
      className: "ui-datepicker-trigger",
      attrs: {
        type: "button",
        disabled: currentOptions.disabled || currentOptions.readonly ? "disabled" : null,
        "aria-haspopup": "dialog",
        "aria-expanded": open ? "true" : "false",
        "aria-label": currentOptions.ariaLabel,
        "aria-controls": open ? panelId : null,
      },
    });
    trigger.appendChild(createElement("span", {
      className: "ui-datepicker-value",
      text: getDisplayValue(),
    }));
    trigger.appendChild(createElement("span", {
      className: "ui-datepicker-caret",
      html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    }));
    events.on(trigger, "click", () => {
      if (currentOptions.disabled || currentOptions.readonly) return;
      if (!open) {
        lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      }
      open = !open;
      render();
    });
    root.appendChild(trigger);
    container.appendChild(root);

    if (open) {
      panel = createElement("div", { className: "ui-datepicker-panel", attrs: { role: "dialog", id: panelId, "aria-label": currentOptions.ariaLabel } });
      const ownerPopover = root.closest?.("[data-ui-popover-id]");
      if (ownerPopover?.dataset?.uiPopoverId) {
        panel.dataset.uiPopoverPortalOwner = ownerPopover.dataset.uiPopoverId;
      }
      const calendarHost = createElement("div", { className: "ui-datepicker-calendar-host" });
      panel.appendChild(calendarHost);
      calendar = createCalendar(calendarHost, {
        ariaLabel: `${currentOptions.ariaLabel} calendar`,
        locale: currentOptions.locale,
        dateBasis: wallClock ? "utc" : "local",
        value: start,
        viewDate,
        mode: currentOptions.mode,
        rangeStart: start,
        rangeEnd: end,
        weekStartsOn: currentOptions.weekStartsOn,
        min: wallClock ? readDate(currentOptions.min) : currentOptions.min,
        max: wallClock ? readDate(currentOptions.max) : currentOptions.max,
        disabledDates: wallClock && currentOptions.disabledDates ? date => currentOptions.disabledDates(formatCivil(date, false)) : currentOptions.disabledDates,
        yearRangePast: currentOptions.yearRangePast,
        yearRangeFuture: currentOptions.yearRangeFuture,
        onSelect(date) {
          selectDate(date);
        },
        onViewChange(date) {
          viewDate = monthStart(date);
        },
      });
      if (currentOptions.showTime) {
        renderTimeSection(panel);
      }
      mountPanel();
      requestAnimationFrame(() => {
        positionPanel();
        panel?.querySelector?.(".ui-calendar-day:not(.is-disabled), .ui-calendar-nav, .ui-calendar-select, .ui-input")?.focus?.();
      });
    }

    bindGlobal();
  }

  function mountPanel() {
    const parent = resolvePanelParent();
    const portaled = parent !== root;
    const ownerModal = root.closest?.("[data-ui-modal-id]");
    panel.classList.toggle("is-portaled", portaled);
    panel.dataset.placement = portaled ? "bottom" : "";
    if (portaled && ownerModal?.dataset?.uiModalId) {
      panel.dataset.uiModalPortalOwner = ownerModal.dataset.uiModalId;
    } else {
      delete panel.dataset.uiModalPortalOwner;
    }
    parent.appendChild(panel);
    if (portaled) {
      positionPanel();
      portalEvents.on(window, "resize", positionPanel);
      portalEvents.on(window, "scroll", positionPanel, true);
      if (window.visualViewport) {
        portalEvents.on(window.visualViewport, "resize", positionPanel);
        portalEvents.on(window.visualViewport, "scroll", positionPanel);
      }
    }
  }

  function resolvePanelParent() {
    const configured = currentOptions.panelParent ?? currentOptions.appendTo ?? "auto";
    if (configured === "self" || configured === false) {
      return root;
    }
    if (configured === "body" || configured === true) {
      return document.body || root;
    }
    if (configured && configured.nodeType === 1) {
      return configured;
    }
    if (typeof configured === "string" && configured !== "auto") {
      return document.querySelector(configured) || root;
    }
    return shouldPortalPanel() ? (document.body || root) : root;
  }

  function shouldPortalPanel() {
    let node = root?.parentElement;
    while (node && node !== document.body && node !== document.documentElement) {
      if (node.classList?.contains("ui-modal") || node.classList?.contains("ui-modal-body") || node.classList?.contains("ui-drawer")) {
        return true;
      }
      const style = window.getComputedStyle?.(node);
      const overflow = `${style?.overflow || ""} ${style?.overflowX || ""} ${style?.overflowY || ""}`;
      if (/\b(auto|scroll|hidden|clip)\b/.test(overflow)) {
        return true;
      }
      node = node.parentElement;
    }
    return false;
  }

  function positionPanel() {
    if (!open || !panel || !trigger || !panel.classList.contains("is-portaled")) {
      return;
    }
    const rect = trigger.getBoundingClientRect();
    const viewport = window.visualViewport;
    const viewportWidth = viewport?.width || document.documentElement.clientWidth || window.innerWidth;
    const viewportHeight = viewport?.height || document.documentElement.clientHeight || window.innerHeight;
    const offsetLeft = viewport?.offsetLeft || 0;
    const offsetTop = viewport?.offsetTop || 0;
    const margin = 8;
    const gap = 6;
    const width = Math.min(Math.max(rect.width, 300), Math.max(180, viewportWidth - margin * 2));

    panel.style.width = `${Math.round(width)}px`;
    panel.style.maxHeight = "";
    panel.style.left = "0px";
    panel.style.top = "0px";

    const measured = panel.getBoundingClientRect();
    const spaceBelow = viewportHeight - rect.bottom - gap - margin;
    const spaceAbove = rect.top - gap - margin;
    const placeAbove = measured.height > spaceBelow && spaceAbove > spaceBelow;
    const availableHeight = Math.max(160, placeAbove ? spaceAbove : spaceBelow);
    const maxHeight = Math.min(Math.max(measured.height, 160), availableHeight);
    const minLeft = offsetLeft + margin;
    const maxLeft = offsetLeft + viewportWidth - width - margin;
    const left = Math.min(Math.max(rect.left + offsetLeft, minLeft), Math.max(minLeft, maxLeft));
    const rawTop = placeAbove ? rect.top + offsetTop - maxHeight - gap : rect.bottom + offsetTop + gap;
    const minTop = offsetTop + margin;
    const maxTop = offsetTop + viewportHeight - maxHeight - margin;
    const top = Math.min(Math.max(rawTop, minTop), Math.max(minTop, maxTop));

    panel.dataset.placement = placeAbove ? "top" : "bottom";
    panel.style.left = `${Math.round(left)}px`;
    panel.style.top = `${Math.round(top)}px`;
    panel.style.maxHeight = `${Math.round(maxHeight)}px`;
  }

  function renderTimeSection(host) {
    const wrap = createElement("div", { className: "ui-datepicker-time" });
    if (currentOptions.mode === "single") {
      wrap.appendChild(createElement("label", { className: "ui-datepicker-time-label", text: "Time" }));
      const input = createElement("input", {
        className: "ui-input",
        attrs: { type: "time", step: currentOptions.timePrecision === "minute" ? "60" : wallClock ? "0.001" : "60", "aria-label": "Time" },
      });
      input.value = shownTime(startTime);
      events.on(input, "input", () => {
        if (!input.value || !input.validity.valid) return;
        startTime = editedTime(input.value);
        if (start) {
          start = combineTime(start, startTime);
        }
        emitChange();
        updateTriggerValue();
      });
      wrap.appendChild(input);
    } else {
      const startLabel = createElement("label", { className: "ui-datepicker-time-label", text: "Start Time" });
      const startInput = createElement("input", { className: "ui-input", attrs: { type: "time", step: currentOptions.timePrecision === "minute" ? "60" : wallClock ? "0.001" : "60", "aria-label": "Time" } });
      startInput.value = shownTime(startTime);
      events.on(startInput, "input", () => {
        if (!startInput.value || !startInput.validity.valid) return;
        startTime = editedTime(startInput.value);
        if (start) {
          start = combineTime(start, startTime);
        }
        emitChange();
        updateTriggerValue();
      });

      const endLabel = createElement("label", { className: "ui-datepicker-time-label", text: "End Time" });
      const endInput = createElement("input", { className: "ui-input", attrs: { type: "time", step: currentOptions.timePrecision === "minute" ? "60" : wallClock ? "0.001" : "60", "aria-label": "Time" } });
      endInput.value = shownTime(endTime);
      events.on(endInput, "input", () => {
        if (!endInput.value || !endInput.validity.valid) return;
        endTime = editedTime(endInput.value);
        if (end) {
          end = combineTime(end, endTime);
        }
        emitChange();
        updateTriggerValue();
      });

      wrap.append(startLabel, startInput, endLabel, endInput);
    }
    host.appendChild(wrap);
  }

  function selectDate(date) {
    if (currentOptions.mode === "single") {
      start = combineTime(date, startTime);
      end = null;
      emitChange();
      if (currentOptions.closeOnSelect) {
        open = false;
      }
      render();
      return;
    }

    if (!start || (start && end)) {
      start = combineTime(date, startTime);
      end = null;
      emitChange();
      render();
      return;
    }

    const next = combineTime(date, endTime);
    if ((wallClock ? formatCivil(next, false).localeCompare(formatCivil(start, false)) : compareDay(next, start)) < 0) {
      end = start;
      start = combineTime(next, startTime);
    } else {
      end = next;
    }
    emitChange();
    if (currentOptions.closeOnSelect) {
      open = false;
    }
    render();
  }

  function getDisplayValue() {
    if (currentOptions.mode === "single") {
      if (!start) {
        return currentOptions.placeholder;
      }
      return displayValue(start, currentOptions.locale, currentOptions.showTime);
    }
    if (!start && !end) {
      return currentOptions.placeholder;
    }
    const s = start ? displayValue(start, currentOptions.locale, currentOptions.showTime) : "";
    const e = end ? displayValue(end, currentOptions.locale, currentOptions.showTime) : "";
    return e ? `${s} - ${e}` : `${s} -`;
  }

  function updateTriggerValue() {
    const valueNode = trigger?.querySelector?.(".ui-datepicker-value");
    if (valueNode) {
      valueNode.textContent = getDisplayValue();
    }
  }

  function readDate(value) { return wallClock ? parseCivil(value) : parseAnyDate(value); }
  function monthStart(date) { return wallClock ? civilMonth(date) : startOfMonth(date); }
  function shownTime(time) { return currentOptions.timePrecision === "minute" ? time.slice(0, 5) : time; }
  function editedTime(time) { return currentOptions.timePrecision === "minute" ? time.slice(0, 5) : wallClock ? time : normalizeTime(time); }
  function timeOf(date) {
    if (wallClock) return civilTime(date);
    if (currentOptions.timePrecision !== "minute") return formatTime(date);
    return `${formatTime(date)}:${String(date.getSeconds()).padStart(2, "0")}.${String(date.getMilliseconds()).padStart(3, "0")}`;
  }
  function combineTime(date, time) {
    if (wallClock) return civilAtTime(date, time);
    if (currentOptions.timePrecision !== "minute") return atTime(date, time);
    const next = new Date(date.getTime());
    const [h, m, seconds = "0"] = time.split(":");
    const [sec, ms = "0"] = seconds.split(".");
    next.setHours(Number(h), Number(m), Number(sec), Number(ms.padEnd(3, "0")));
    return next;
  }
  function serialize(date) { return wallClock ? formatCivil(date, currentOptions.showTime) : (date ? date.toISOString() : null); }
  function displayValue(date, locale, withTime) {
    if (!wallClock) return formatValue(date, locale, withTime);
    const text = formatCivil(date, withTime).replace("T", " ");
    return withTime && currentOptions.timePrecision === "minute" ? text.slice(0, 16) : text;
  }

  function hydrateValue(value) {
    if (currentOptions.mode === "single") {
      const date = readDate(value);
      start = date;
      end = null;
      if (date) {
        startTime = timeOf(date);
        viewDate = monthStart(date);
      } else if (currentOptions.timePrecision === "minute") {
        startTime = shownTime(startTime);
      }
      return;
    }

    const pair = wallClock ? { start: readDate(Array.isArray(value) ? value[0] : value?.start), end: readDate(Array.isArray(value) ? value[1] : value?.end) } : parseRange(value);
    start = pair.start;
    end = pair.end;
    if (start) {
      startTime = timeOf(start);
      viewDate = monthStart(start);
    }
    if (end) {
      endTime = timeOf(end);
    }
    if (currentOptions.timePrecision === "minute") {
      if (!start) startTime = shownTime(startTime);
      if (!end) endTime = shownTime(endTime);
    }
  }

  function emitChange() {
    if (typeof currentOptions.onChange !== "function") {
      return;
    }
    currentOptions.value = getValue();
    currentOptions.onChange(getValue(), getState());
  }

  function bindGlobal() {
    globalEvents.clear();
    if (!open) {
      return;
    }
    globalEvents.on(document, "mousedown", (event) => {
      const foreground = [...container.ownerDocument.querySelectorAll('[data-ui-modal-id][aria-hidden="false"]')].at(-1);
      if (foreground && foreground !== root?.closest("[data-ui-modal-id]")) return;
      const target = event.target;
      if (target && !isInsideDatepicker(target)) {
        open = false;
        render();
        restoreFocus();
      }
    });
    // A modal listens on document capture. Its active child picker must handle
    // Escape earlier, including when a day-selection render detached focus.
    const doc = container.ownerDocument;
    globalEvents.on(doc.defaultView || doc, "keydown", (event) => {
      if (event.key !== "Escape" || event.defaultPrevented || !open) return;
      const ownerModal = root?.closest("[data-ui-modal-id]");
      const openModals = [...doc.querySelectorAll('[data-ui-modal-id][aria-hidden="false"]')];
      if (openModals.length && openModals.at(-1) !== ownerModal) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      open = false;
      render();
      restoreFocus();
    }, true);
  }

  function isInsideDatepicker(target) {
    return Boolean((root && root.contains(target)) || (panel && panel.contains(target)));
  }

  function restoreFocus() {
    const focusTarget = trigger?.isConnected ? trigger : lastFocusedElement?.isConnected ? lastFocusedElement : null;
    if (focusTarget && typeof focusTarget.focus === "function") {
      try {
        focusTarget.focus();
      } catch (_error) {
        // Ignore focus restore failures.
      }
    }
    lastFocusedElement = null;
  }

  function update(nextOptions = {}) {
    if (nextOptions.valueMode && nextOptions.valueMode !== currentOptions.valueMode) throw new TypeError("Recreate the picker to change valueMode.");
    currentOptions = normalizeOptions({ ...currentOptions, value: getValue(), ...(nextOptions || {}) });
    if (currentOptions.disabled || currentOptions.readonly) open = false;
    hydrateValue(currentOptions.value);
    render();
  }

  function setValue(nextValue, emit = true) {
    hydrateValue(nextValue);
    currentOptions.value = getValue();
    if (emit) emitChange();
    render();
  }

  function getValue() {
    if (currentOptions.mode === "single") {
      return serialize(start);
    }
    return {
      start: serialize(start),
      end: serialize(end),
    };
  }

  function getState() {
    return {
      open,
      mode: currentOptions.mode,
      viewDate: wallClock ? formatCivil(viewDate, false) : viewDate.toISOString(),
      start: serialize(start),
      end: serialize(end),
      startTime,
      endTime,
      options: { ...currentOptions },
    };
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    open = false;
    globalEvents.clear();
    portalEvents.clear();
    events.clear();
    calendar?.destroy();
    panel?.remove?.();
    clearNode(container);
    root = null;
    trigger = null;
    panel = null;
    calendar = null;
  }

  render();

  return {
    update,
    setDisabled(disabled) {
      currentOptions.disabled = Boolean(disabled);
      if (disabled) open = false;
      render();
    },
    setValue,
    getValue,
    getState,
    destroy,
  };
}

function normalizeOptions(options) {
  const next = { ...DEFAULT_OPTIONS, ...(options || {}) };
  if (!["auto", "minute"].includes(next.timePrecision)) throw new TypeError("Unknown datepicker timePrecision.");
  if (!["instant", "wall-clock"].includes(next.valueMode)) throw new TypeError("Unknown datepicker valueMode.");
  if (options && Object.prototype.hasOwnProperty.call(options, "appendTo") && !Object.prototype.hasOwnProperty.call(options, "panelParent")) {
    next.panelParent = options.appendTo;
  }
  next.ariaLabel = String(next.ariaLabel || "Date picker");
  next.mode = next.mode === "range" ? "range" : "single";
  const week = Number(next.weekStartsOn);
  next.weekStartsOn = Number.isFinite(week) ? ((week % 7) + 7) % 7 : 0;
  const past = Number(next.yearRangePast);
  const future = Number(next.yearRangeFuture);
  next.yearRangePast = Number.isFinite(past) && past >= 0 ? Math.floor(past) : DEFAULT_OPTIONS.yearRangePast;
  next.yearRangeFuture = Number.isFinite(future) && future >= 0 ? Math.floor(future) : DEFAULT_OPTIONS.yearRangeFuture;
  return next;
}

function parseAnyDate(value) {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseRange(value) {
  if (Array.isArray(value)) {
    return {
      start: parseAnyDate(value[0]),
      end: parseAnyDate(value[1]),
    };
  }
  if (value && typeof value === "object") {
    return {
      start: parseAnyDate(value.start),
      end: parseAnyDate(value.end),
    };
  }
  return { start: null, end: null };
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function compareDay(a, b) {
  const x = startOfDay(a).getTime();
  const y = startOfDay(b).getTime();
  if (x === y) {
    return 0;
  }
  return x < y ? -1 : 1;
}

function formatValue(date, locale, withTime) {
  if (!withTime) {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(date);
  }
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function normalizeTime(value) {
  const text = String(value || "").trim();
  if (!/^\d{2}:\d{2}$/.test(text)) {
    return "00:00";
  }
  const [h, m] = text.split(":").map((part) => Number(part));
  if (!Number.isFinite(h) || !Number.isFinite(m)) {
    return "00:00";
  }
  const clampedH = Math.max(0, Math.min(23, h));
  const clampedM = Math.max(0, Math.min(59, m));
  return `${String(clampedH).padStart(2, "0")}:${String(clampedM).padStart(2, "0")}`;
}

function atTime(date, time) {
  const next = new Date(date.getTime());
  const normalized = normalizeTime(time);
  const [h, m] = normalized.split(":").map((part) => Number(part));
  next.setHours(h, m, 0, 0);
  return next;
}
