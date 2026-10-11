import { createElement, clearNode } from "./ui.dom.js";
import { createEventBag } from "./ui.events.js";

const DEFAULT_OPTIONS = {
  className: "",
  dateBasis: "local", // utc is a civil-calendar carrier; default remains browser local
  ariaLabel: "Calendar",
  locale: "en-US",
  value: null,
  viewDate: null,
  mode: "single",
  rangeStart: null,
  rangeEnd: null,
  weekStartsOn: 0,
  min: null,
  max: null,
  disabledDates: null,
  yearRangePast: 80,
  yearRangeFuture: 20,
  showHeader: true,
  showJump: true,
  onSelect: null,
  onViewChange: null,
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function createCalendar(container, options = {}) {
  const { parseAnyDate, buildCalendarDays, rotateWeekdays, getMonthOptions, getYearRange, addMonths, addDays, startOfMonth, startOfDay, isSameDay, formatMonthYear, formatDayLabel, getYear, getMonth, getDate, makeDate } = createCalendarDateOps(options.dateBasis === "utc");
  const events = createEventBag();
  let currentOptions = normalizeOptions(options);
  let viewDate = startOfMonth(parseAnyDate(currentOptions.viewDate) || parseAnyDate(currentOptions.value) || new Date());
  let selectedDate = parseAnyDate(currentOptions.value);
  let rangeStart = parseAnyDate(currentOptions.rangeStart);
  let rangeEnd = parseAnyDate(currentOptions.rangeEnd);
  let root = null;
  let destroyed = false;

  function render() {
    if (destroyed || !container || container.nodeType !== 1) {
      return;
    }
    events.clear();
    clearNode(container);

    root = createElement("div", {
      className: `ui-calendar ${currentOptions.className || ""}`.trim(),
      attrs: { role: "group", "aria-label": currentOptions.ariaLabel },
    });

    if (currentOptions.showHeader) {
      renderHeader(root);
    }
    renderWeekdayRow(root);
    renderGrid(root);
    container.appendChild(root);
  }

  function renderHeader(host) {
    const header = createElement("div", { className: "ui-calendar-header" });
    const prevBtn = createElement("button", {
      className: "ui-button ui-calendar-nav",
      attrs: { type: "button", "aria-label": "Previous month" },
      html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
    });
    const nextBtn = createElement("button", {
      className: "ui-button ui-calendar-nav",
      attrs: { type: "button", "aria-label": "Next month" },
      html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
    });
    const title = createElement("p", {
      className: "ui-calendar-title",
      text: formatMonthYear(viewDate, currentOptions.locale),
    });
    events.on(prevBtn, "click", () => setViewDate(addMonths(viewDate, -1), { source: "previous" }));
    events.on(nextBtn, "click", () => setViewDate(addMonths(viewDate, 1), { source: "next" }));
    header.append(prevBtn, title, nextBtn);
    host.appendChild(header);

    if (!currentOptions.showJump) {
      return;
    }

    const jump = createElement("div", { className: "ui-calendar-jump" });
    const monthSelect = createElement("select", {
      className: "ui-input ui-calendar-select",
      attrs: { "aria-label": "Select month" },
    });
    getMonthOptions(currentOptions.locale).forEach((month, index) => {
      monthSelect.appendChild(createElement("option", { text: month, attrs: { value: String(index) } }));
    });
    monthSelect.value = String(getMonth(viewDate));

    const yearSelect = createElement("select", {
      className: "ui-input ui-calendar-select",
      attrs: { "aria-label": "Select year" },
    });
    getYearRange(getYear(viewDate), currentOptions.yearRangePast, currentOptions.yearRangeFuture).forEach((year) => {
      yearSelect.appendChild(createElement("option", { text: String(year), attrs: { value: String(year) } }));
    });
    yearSelect.value = String(getYear(viewDate));

    events.on(monthSelect, "change", () => {
      const month = Number(monthSelect.value);
      if (Number.isFinite(month)) {
        setViewDate(makeDate(getYear(viewDate), month, 1), { source: "month-select" });
      }
    });
    events.on(yearSelect, "change", () => {
      const year = Number(yearSelect.value);
      if (Number.isFinite(year)) {
        setViewDate(makeDate(year, getMonth(viewDate), 1), { source: "year-select" });
      }
    });

    jump.append(monthSelect, yearSelect);
    host.appendChild(jump);
  }

  function renderWeekdayRow(host) {
    const row = createElement("div", { className: "ui-calendar-weekdays" });
    rotateWeekdays(DAY_NAMES, currentOptions.weekStartsOn).forEach((day) => {
      row.appendChild(createElement("span", { className: "ui-calendar-weekday", text: day }));
    });
    host.appendChild(row);
  }

  function renderGrid(host) {
    const grid = createElement("div", { className: "ui-calendar-grid" });
    buildCalendarDays(viewDate, currentOptions.weekStartsOn).forEach((item) => {
      const disabled = isDisabledDate(item.date);
      const classes = ["ui-calendar-day"];
      if (item.outsideMonth) {
        classes.push("is-outside");
      }
      if (isSameDay(item.date, new Date())) {
        classes.push("is-today");
      }
      if (isSelected(item.date)) {
        classes.push("is-selected");
      }
      if (isInRange(item.date)) {
        classes.push("is-in-range");
      }
      if (currentOptions.mode === "range" && rangeStart && isSameDay(item.date, rangeStart)) {
        classes.push("is-range-start");
      }
      if (currentOptions.mode === "range" && rangeEnd && isSameDay(item.date, rangeEnd)) {
        classes.push("is-range-end");
      }
      if (disabled) {
        classes.push("is-disabled");
      }
      const cell = createElement("button", {
        className: classes.join(" "),
        text: String(getDate(item.date)),
        attrs: {
          type: "button",
          disabled: disabled ? "disabled" : null,
          "aria-label": formatDayLabel(item.date, currentOptions.locale),
        },
      });
      if (!disabled) {
        events.on(cell, "click", () => selectDate(item.date));
      }
      grid.appendChild(cell);
    });
    host.appendChild(grid);
  }

  function selectDate(date) {
    selectedDate = startOfDay(date);
    currentOptions.onSelect?.(new Date(selectedDate), getState());
    render();
  }

  function setViewDate(date, meta = {}) {
    viewDate = startOfMonth(parseAnyDate(date) || new Date());
    currentOptions.onViewChange?.(new Date(viewDate), { ...getState(), source: meta.source || "setViewDate" });
    render();
  }

  function setValue(value) {
    selectedDate = parseAnyDate(value);
    if (selectedDate) {
      viewDate = startOfMonth(selectedDate);
    }
    render();
  }

  function update(nextOptions = {}) {
    currentOptions = normalizeOptions({ ...currentOptions, ...(nextOptions || {}) });
    selectedDate = parseAnyDate(currentOptions.value);
    rangeStart = parseAnyDate(currentOptions.rangeStart);
    rangeEnd = parseAnyDate(currentOptions.rangeEnd);
    viewDate = startOfMonth(parseAnyDate(currentOptions.viewDate) || viewDate || selectedDate || new Date());
    render();
  }

  function getState() {
    return {
      viewDate: viewDate.toISOString(),
      value: selectedDate ? selectedDate.toISOString() : null,
      mode: currentOptions.mode,
      rangeStart: rangeStart ? rangeStart.toISOString() : null,
      rangeEnd: rangeEnd ? rangeEnd.toISOString() : null,
      options: { ...currentOptions },
    };
  }

  function destroy() {
    destroyed = true;
    events.clear();
    clearNode(container);
    root = null;
  }

  function isSelected(date) {
    if (currentOptions.mode === "range") {
      return Boolean((rangeStart && isSameDay(date, rangeStart)) || (rangeEnd && isSameDay(date, rangeEnd)));
    }
    return Boolean(selectedDate && isSameDay(date, selectedDate));
  }

  function isInRange(date) {
    if (currentOptions.mode !== "range" || !rangeStart || !rangeEnd) {
      return false;
    }
    const d = startOfDay(date).getTime();
    const a = startOfDay(rangeStart).getTime();
    const b = startOfDay(rangeEnd).getTime();
    return d > Math.min(a, b) && d < Math.max(a, b);
  }

  function isDisabledDate(date) {
    const day = startOfDay(date);
    const minDate = currentOptions.min ? startOfDay(parseAnyDate(currentOptions.min)) : null;
    const maxDate = currentOptions.max ? startOfDay(parseAnyDate(currentOptions.max)) : null;
    if (minDate && day < minDate) {
      return true;
    }
    if (maxDate && day > maxDate) {
      return true;
    }
    if (typeof currentOptions.disabledDates === "function") {
      return Boolean(currentOptions.disabledDates(new Date(day)));
    }
    return false;
  }

  render();

  return {
    get root() {
      return root;
    },
    update,
    setValue,
    setViewDate,
    getState,
    destroy,
  };
}

function normalizeOptions(options) {
  const next = { ...DEFAULT_OPTIONS, ...(options || {}) };
  next.ariaLabel = String(next.ariaLabel || DEFAULT_OPTIONS.ariaLabel);
  next.mode = next.mode === "range" ? "range" : "single";
  const week = Number(next.weekStartsOn);
  next.weekStartsOn = Number.isFinite(week) ? ((week % 7) + 7) % 7 : 0;
  const past = Number(next.yearRangePast);
  const future = Number(next.yearRangeFuture);
  next.yearRangePast = Number.isFinite(past) && past >= 0 ? Math.floor(past) : DEFAULT_OPTIONS.yearRangePast;
  next.yearRangeFuture = Number.isFinite(future) && future >= 0 ? Math.floor(future) : DEFAULT_OPTIONS.yearRangeFuture;
  return next;
}

function createCalendarDateOps(utc) {
  const getYear = date => date[utc ? "getUTCFullYear" : "getFullYear"]();
  const getMonth = date => date[utc ? "getUTCMonth" : "getMonth"]();
  const getDate = date => date[utc ? "getUTCDate" : "getDate"]();
  const getDay = date => date[utc ? "getUTCDay" : "getDay"]();
  function makeDate(year, month, day) {
    if (!utc) return new Date(year, month, day);
    const date = new Date(0);
    date.setUTCFullYear(year, month, day);
    return date;
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

function buildCalendarDays(monthDate, weekStartsOn) {
  const first = startOfMonth(monthDate);
  const startOffset = (getDay(first) - weekStartsOn + 7) % 7;
  const gridStart = addDays(first, -startOffset);
  const days = [];
  for (let i = 0; i < 42; i += 1) {
    const date = addDays(gridStart, i);
    days.push({
      date,
      outsideMonth: getMonth(date) !== getMonth(first),
    });
  }
  return days;
}

function rotateWeekdays(days, start) {
  return days.slice(start).concat(days.slice(0, start));
}

function getMonthOptions(locale) {
  const formatter = new Intl.DateTimeFormat(locale, { month: "short", ...(utc ? {timeZone: "UTC"} : {}) });
  const months = [];
  for (let i = 0; i < 12; i += 1) {
    months.push(formatter.format(makeDate(2026, i, 1)));
  }
  return months;
}

function getYearRange(baseYear, past, future) {
  const years = [];
  for (let year = baseYear + future; year >= baseYear - past; year -= 1) {
    years.push(year);
  }
  return years;
}

function addMonths(date, amount) {
  const next = new Date(date.getTime());
  next[utc ? "setUTCMonth" : "setMonth"](getMonth(next) + amount);
  return startOfMonth(next);
}

function addDays(date, amount) {
  const next = new Date(date.getTime());
  next[utc ? "setUTCDate" : "setDate"](getDate(next) + amount);
  return next;
}

function startOfMonth(date) {
  return makeDate(getYear(date), getMonth(date), 1);
}

function startOfDay(date) {
  return makeDate(getYear(date), getMonth(date), getDate(date));
}

function isSameDay(a, b) {
  return (
    getYear(a) === getYear(b) &&
    getMonth(a) === getMonth(b) &&
    getDate(a) === getDate(b)
  );
}

function formatMonthYear(date, locale) {
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", ...(utc ? {timeZone: "UTC"} : {}) }).format(date);
}

function formatDayLabel(date, locale) {
  return new Intl.DateTimeFormat(locale, {
    ...(utc ? {timeZone: "UTC"} : {}),
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

return { parseAnyDate, buildCalendarDays, rotateWeekdays, getMonthOptions, getYearRange, addMonths, addDays, startOfMonth, startOfDay, isSameDay, formatMonthYear, formatDayLabel, getYear, getMonth, getDate, makeDate };
}
