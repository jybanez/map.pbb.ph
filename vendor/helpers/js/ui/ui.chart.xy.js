import { createElement, clearNode } from "./ui.dom.js";

const SVG_NS = "http://www.w3.org/2000/svg";

const DEFAULT_OPTIONS = {
  title: "",
  description: "",
  ariaLabel: "",
  className: "",
  xType: "auto", // auto | number | date | category
  xLabel: "X",
  yLabel: "Y",
  width: 720,
  height: 360,
  size: "md",
  showLegend: true,
  showPoints: true,
  showGrid: true,
  loading: false,
  loadingText: "Loading chart data...",
  error: "",
  emptyText: "No chart data available.",
  xFormatter: null,
  yFormatter: null,
  pointLabel: null,
  onSelect: null,
  onHover: null,
};

const TONES = ["info", "success", "warning", "danger", "critical", "neutral"];
const SIZES = new Set(["sm", "md", "lg"]);
const X_TYPES = new Set(["auto", "number", "date", "category"]);

export function createXyChart(container, options = {}) {
  if (!container || container.nodeType !== 1) {
    throw new Error("[createXyChart] A container element is required.");
  }

  let currentOptions = normalizeOptions(options);
  let currentSeries = normalizeSeries(currentOptions.series);
  let destroyed = false;
  let root = null;

  function render() {
    if (destroyed) {
      return;
    }
    clearNode(container);
    currentSeries = normalizeSeries(currentOptions.series);
    root = createElement("section", {
      className: ["ui-chart-xy", `ui-chart-xy--${currentOptions.size}`, currentOptions.className].filter(Boolean).join(" "),
      attrs: {
        role: "figure",
        "aria-label": currentOptions.ariaLabel || currentOptions.title || "X-Y chart",
      },
    });

    renderHeader(root);
    if (currentOptions.loading) {
      renderState(root, "loading", currentOptions.loadingText);
      container.appendChild(root);
      return;
    }
    if (currentOptions.error) {
      renderState(root, "error", currentOptions.error);
      container.appendChild(root);
      return;
    }
    if (!currentSeries.some((series) => series.points.length)) {
      renderState(root, "empty", currentOptions.emptyText);
      container.appendChild(root);
      return;
    }

    const model = buildModel(currentSeries, currentOptions);
    root.appendChild(renderPlot(model));
    root.appendChild(renderSummaryTable(model));
    if (currentOptions.showLegend) {
      root.appendChild(renderLegend(model));
    }
    container.appendChild(root);
  }

  function renderHeader(host) {
    if (!currentOptions.title && !currentOptions.description) {
      return;
    }
    const header = createElement("header", { className: "ui-chart-xy-header" });
    if (currentOptions.title) {
      header.appendChild(createElement("h3", { className: "ui-chart-xy-title", text: currentOptions.title }));
    }
    if (currentOptions.description) {
      header.appendChild(createElement("p", { className: "ui-chart-xy-description", text: currentOptions.description }));
    }
    host.appendChild(header);
  }

  function renderState(host, kind, text) {
    host.appendChild(createElement("div", {
      className: `ui-chart-xy-state ui-chart-xy-state--${kind}`,
      text,
      attrs: { role: kind === "error" ? "alert" : "status" },
    }));
  }

  function renderPlot(model) {
    const wrap = createElement("div", { className: "ui-chart-xy-plot" });
    const svg = svgEl("svg", {
      class: "ui-chart-xy-svg",
      viewBox: `0 0 ${model.width} ${model.height}`,
      role: "img",
      "aria-label": currentOptions.ariaLabel || currentOptions.title || "X-Y chart plot",
    });
    if (currentOptions.showGrid) {
      renderGrid(svg, model);
    }
    renderBands(svg, model);
    renderThresholds(svg, model);
    renderAxes(svg, model);
    model.series.forEach((series) => renderSeries(svg, model, series));
    wrap.appendChild(svg);
    return wrap;
  }

  function renderGrid(svg, model) {
    model.yTicks.forEach((tick) => {
      const y = model.scaleY(tick.value);
      svg.appendChild(svgEl("line", {
        class: "ui-chart-xy-grid-line",
        x1: model.plot.left,
        y1: y,
        x2: model.plot.right,
        y2: y,
      }));
    });
  }

  function renderBands(svg, model) {
    model.bands.forEach((band) => {
      if (band.axis !== "y") {
        return;
      }
      const y1 = model.scaleY(band.from);
      const y2 = model.scaleY(band.to);
      const y = Math.min(y1, y2);
      const height = Math.abs(y2 - y1);
      svg.appendChild(svgEl("rect", {
        class: ["ui-chart-xy-band", band.tone ? `is-${band.tone}` : ""].filter(Boolean).join(" "),
        x: model.plot.left,
        y,
        width: model.plot.width,
        height,
        style: band.color ? `--ui-chart-xy-band-color: ${band.color}` : null,
      }));
      if (band.label) {
        svg.appendChild(svgText(band.label, model.plot.right - 4, y + 14, "ui-chart-xy-band-label", "end"));
      }
    });
  }

  function renderThresholds(svg, model) {
    model.thresholds.forEach((threshold) => {
      if (threshold.axis !== "y") {
        return;
      }
      const y = model.scaleY(threshold.value);
      svg.appendChild(svgEl("line", {
        class: ["ui-chart-xy-threshold", threshold.tone ? `is-${threshold.tone}` : ""].filter(Boolean).join(" "),
        x1: model.plot.left,
        y1: y,
        x2: model.plot.right,
        y2: y,
        style: threshold.color ? `--ui-chart-xy-threshold-color: ${threshold.color}` : null,
      }));
      if (threshold.label) {
        svg.appendChild(svgText(threshold.label, model.plot.right - 4, y - 6, "ui-chart-xy-threshold-label", "end"));
      }
    });
  }

  function renderAxes(svg, model) {
    svg.appendChild(svgEl("line", { class: "ui-chart-xy-axis", x1: model.plot.left, y1: model.plot.bottom, x2: model.plot.right, y2: model.plot.bottom }));
    svg.appendChild(svgEl("line", { class: "ui-chart-xy-axis", x1: model.plot.left, y1: model.plot.top, x2: model.plot.left, y2: model.plot.bottom }));
    model.xTicks.forEach((tick) => {
      const x = model.scaleX(tick.value);
      svg.appendChild(svgEl("line", { class: "ui-chart-xy-tick", x1: x, y1: model.plot.bottom, x2: x, y2: model.plot.bottom + 5 }));
      svg.appendChild(svgText(formatX(tick.raw ?? tick.value), x, model.plot.bottom + 20, "ui-chart-xy-axis-label", "middle"));
    });
    model.yTicks.forEach((tick) => {
      const y = model.scaleY(tick.value);
      svg.appendChild(svgEl("line", { class: "ui-chart-xy-tick", x1: model.plot.left - 5, y1: y, x2: model.plot.left, y2: y }));
      svg.appendChild(svgText(formatY(tick.value), model.plot.left - 9, y + 4, "ui-chart-xy-axis-label", "end"));
    });
    svg.appendChild(svgText(currentOptions.xLabel, model.plot.left + model.plot.width / 2, model.height - 8, "ui-chart-xy-axis-title", "middle"));
    svg.appendChild(svgText(currentOptions.yLabel, 12, model.plot.top - 10, "ui-chart-xy-axis-title", "start"));
  }

  function renderSeries(svg, model, series) {
    const pathData = series.points.map((point, index) => `${index ? "L" : "M"} ${model.scaleX(point.xValue)} ${model.scaleY(point.y)}`).join(" ");
    const group = svgEl("g", {
      class: ["ui-chart-xy-series", series.tone ? `is-${series.tone}` : ""].filter(Boolean).join(" "),
      style: series.color ? `--ui-chart-xy-series-color: ${series.color}` : null,
      "data-series-id": series.id,
    });
    group.appendChild(svgEl("path", { class: "ui-chart-xy-line", d: pathData }));
    if (currentOptions.showPoints) {
      series.points.forEach((point, index) => {
        const circle = svgEl("circle", {
          class: "ui-chart-xy-point",
          cx: model.scaleX(point.xValue),
          cy: model.scaleY(point.y),
          r: point.r || 4,
          tabindex: isInteractive() ? "0" : null,
          role: isInteractive() ? "button" : "img",
          "aria-label": buildPointLabel(series, point),
          "data-series-id": series.id,
          "data-point-id": point.id,
          "data-index": index,
        });
        wirePoint(circle, series, point, index);
        group.appendChild(circle);
      });
    }
    svg.appendChild(group);
  }

  function renderLegend(model) {
    const legend = createElement("ul", { className: "ui-chart-xy-legend", attrs: { "aria-label": "Chart series" } });
    model.series.forEach((series) => {
      const item = createElement("li", { className: "ui-chart-xy-legend-item" });
      const swatch = createElement("span", {
        className: ["ui-chart-xy-legend-swatch", series.tone ? `is-${series.tone}` : ""].filter(Boolean).join(" "),
        attrs: { "aria-hidden": "true" },
      });
      if (series.color) {
        swatch.style.setProperty("--ui-chart-xy-series-color", series.color);
      }
      item.append(swatch, createElement("span", { text: series.label }));
      legend.appendChild(item);
    });
    return legend;
  }

  function renderSummaryTable(model) {
    const table = createElement("table", { className: "ui-chart-xy-summary" });
    const thead = createElement("thead");
    const header = createElement("tr");
    [ "Series", currentOptions.xLabel, currentOptions.yLabel ].forEach((label) => header.appendChild(createElement("th", { text: label })));
    thead.appendChild(header);
    const tbody = createElement("tbody");
    model.series.forEach((series) => {
      series.points.forEach((point) => {
        const row = createElement("tr");
        row.append(
          createElement("td", { text: series.label }),
          createElement("td", { text: formatX(point.xRaw) }),
          createElement("td", { text: formatY(point.y) })
        );
        tbody.appendChild(row);
      });
    });
    table.append(thead, tbody);
    return table;
  }

  function wirePoint(node, series, point, index) {
    if (!isInteractive()) {
      return;
    }
    node.addEventListener("click", () => currentOptions.onSelect?.(point, { series, index, chart: api }));
    node.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        currentOptions.onSelect?.(point, { series, index, chart: api });
      }
    });
    node.addEventListener("mouseenter", () => currentOptions.onHover?.(point, { series, index, chart: api }));
    node.addEventListener("focus", () => currentOptions.onHover?.(point, { series, index, chart: api }));
  }

  function isInteractive() {
    return typeof currentOptions.onSelect === "function" || typeof currentOptions.onHover === "function";
  }

  function buildPointLabel(series, point) {
    if (typeof currentOptions.pointLabel === "function") {
      return String(currentOptions.pointLabel(point, { series }) || "");
    }
    return `${series.label}: ${formatY(point.y)} at ${formatX(point.xRaw)}`;
  }

  function formatX(value) {
    if (typeof currentOptions.xFormatter === "function") {
      return String(currentOptions.xFormatter(value) ?? "");
    }
    return String(value ?? "");
  }

  function formatY(value) {
    if (typeof currentOptions.yFormatter === "function") {
      return String(currentOptions.yFormatter(value) ?? "");
    }
    return Number.isFinite(Number(value)) ? String(Number(value)) : String(value ?? "");
  }

  function update(nextOptions = {}) {
    currentOptions = normalizeOptions({ ...currentOptions, ...(nextOptions || {}) });
    render();
  }

  function setSeries(series = []) {
    update({ series });
  }

  function getState() {
    return {
      options: { ...currentOptions },
      series: currentSeries.map(cloneSeries),
    };
  }

  function destroy() {
    destroyed = true;
    clearNode(container);
    root = null;
  }

  const api = { update, setSeries, getState, destroy };
  render();
  return api;
}

function buildModel(series, options) {
  const width = Math.max(320, Number(options.width) || DEFAULT_OPTIONS.width);
  const height = Math.max(220, Number(options.height) || DEFAULT_OPTIONS.height);
  const plot = { left: 58, right: width - 24, top: 32, bottom: height - 48 };
  plot.width = plot.right - plot.left;
  plot.height = plot.bottom - plot.top;
  const xType = resolveXType(series, options.xType);
  const xDomain = buildXDomain(series, xType);
  const yDomain = buildYDomain(series, options);
  const scaleX = (value) => {
    if (xType === "category") {
      const index = Math.max(0, xDomain.values.indexOf(String(value)));
      const count = Math.max(1, xDomain.values.length - 1);
      return plot.left + (index / count) * plot.width;
    }
    const min = xDomain.min;
    const max = xDomain.max === min ? min + 1 : xDomain.max;
    return plot.left + ((Number(value) - min) / (max - min)) * plot.width;
  };
  const scaleY = (value) => {
    const min = yDomain.min;
    const max = yDomain.max === min ? min + 1 : yDomain.max;
    return plot.bottom - ((Number(value) - min) / (max - min)) * plot.height;
  };
  const normalizedSeries = series.map((item) => ({
    ...item,
    points: item.points.map((point) => ({ ...point, xValue: normalizeXValue(point.x, xType, xDomain), xRaw: point.x })),
  }));
  return {
    width,
    height,
    plot,
    xType,
    series: normalizedSeries,
    bands: normalizeBands(options.bands),
    thresholds: normalizeThresholds(options.thresholds),
    xTicks: buildXTicks(xDomain, xType),
    yTicks: buildNumericTicks(yDomain.min, yDomain.max),
    scaleX,
    scaleY,
  };
}

function normalizeOptions(input = {}) {
  const next = { ...DEFAULT_OPTIONS, ...(input || {}) };
  next.size = SIZES.has(next.size) ? next.size : DEFAULT_OPTIONS.size;
  next.xType = X_TYPES.has(next.xType) ? next.xType : DEFAULT_OPTIONS.xType;
  next.series = Array.isArray(next.series) ? next.series : [];
  next.thresholds = Array.isArray(next.thresholds) ? next.thresholds : [];
  next.bands = Array.isArray(next.bands) ? next.bands : [];
  next.showLegend = next.showLegend !== false;
  next.showPoints = next.showPoints !== false;
  next.showGrid = next.showGrid !== false;
  return next;
}

function normalizeSeries(series) {
  return (Array.isArray(series) ? series : []).map((item, index) => {
    const tone = TONES.includes(item?.tone) ? item.tone : TONES[index % TONES.length];
    return {
      id: String(item?.id || `series-${index + 1}`),
      label: String(item?.label || `Series ${index + 1}`),
      tone,
      color: item?.color || "",
      meta: item?.meta || null,
      points: normalizePoints(item?.points || item?.data),
    };
  }).filter((item) => item.points.length);
}

function normalizePoints(points) {
  return (Array.isArray(points) ? points : []).map((point, index) => {
    const source = Array.isArray(point) ? { x: point[0], y: point[1] } : point || {};
    const y = Number(source.y ?? source.value);
    if (!Number.isFinite(y)) {
      return null;
    }
    return {
      id: String(source.id || `point-${index + 1}`),
      x: source.x ?? source.label ?? index,
      y,
      label: source.label || "",
      r: Number.isFinite(Number(source.r)) ? Math.max(1, Number(source.r)) : 0,
      meta: source.meta || null,
    };
  }).filter(Boolean);
}

function cloneSeries(series) {
  return { ...series, points: series.points.map((point) => ({ ...point })) };
}

function resolveXType(series, configured) {
  if (configured !== "auto") {
    return configured;
  }
  const values = series.flatMap((item) => item.points.map((point) => point.x));
  if (values.every((value) => Number.isFinite(Number(value)))) {
    return "number";
  }
  if (values.every((value) => !Number.isNaN(Date.parse(value)))) {
    return "date";
  }
  return "category";
}

function buildXDomain(series, xType) {
  const values = series.flatMap((item) => item.points.map((point) => point.x));
  if (xType === "category") {
    return { values: Array.from(new Set(values.map(String))) };
  }
  const numeric = values.map((value) => normalizeXValue(value, xType)).filter((value) => Number.isFinite(value));
  const min = Math.min(...numeric);
  const max = Math.max(...numeric);
  return padDomain(min, max);
}

function normalizeXValue(value, xType, xDomain = null) {
  if (xType === "category") {
    return String(value);
  }
  if (xType === "date") {
    return Date.parse(value);
  }
  return Number(value);
}

function buildYDomain(series, options) {
  const values = series.flatMap((item) => item.points.map((point) => point.y));
  normalizeThresholds(options.thresholds).forEach((threshold) => {
    if (threshold.axis === "y") values.push(threshold.value);
  });
  normalizeBands(options.bands).forEach((band) => {
    if (band.axis === "y") values.push(band.from, band.to);
  });
  return padDomain(Math.min(...values), Math.max(...values), true);
}

function padDomain(min, max, includeZero = false) {
  let nextMin = Number.isFinite(min) ? min : 0;
  let nextMax = Number.isFinite(max) ? max : 1;
  if (includeZero) {
    nextMin = Math.min(0, nextMin);
    nextMax = Math.max(0, nextMax);
  }
  if (nextMin === nextMax) {
    return { min: nextMin - 1, max: nextMax + 1 };
  }
  const pad = (nextMax - nextMin) * 0.08;
  return { min: nextMin - pad, max: nextMax + pad };
}

function buildXTicks(domain, xType) {
  if (xType === "category") {
    const values = domain.values.length > 6 ? domain.values.filter((_, index) => index % Math.ceil(domain.values.length / 6) === 0) : domain.values;
    return values.map((value) => ({ value, raw: value }));
  }
  return buildNumericTicks(domain.min, domain.max).map((tick) => ({
    value: tick.value,
    raw: xType === "date" ? new Date(tick.value).toISOString().slice(0, 10) : tick.value,
  }));
}

function buildNumericTicks(min, max, count = 5) {
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) && max !== safeMin ? max : safeMin + 1;
  return Array.from({ length: count }, (_, index) => ({ value: safeMin + ((safeMax - safeMin) * index) / (count - 1) }));
}

function normalizeThresholds(thresholds) {
  return (Array.isArray(thresholds) ? thresholds : []).map((item) => ({
    axis: item?.axis === "x" ? "x" : "y",
    value: Number(item?.value),
    label: String(item?.label || ""),
    tone: TONES.includes(item?.tone) ? item.tone : "",
    color: item?.color || "",
  })).filter((item) => Number.isFinite(item.value));
}

function normalizeBands(bands) {
  return (Array.isArray(bands) ? bands : []).map((item) => ({
    axis: item?.axis === "x" ? "x" : "y",
    from: Number(item?.from),
    to: Number(item?.to),
    label: String(item?.label || ""),
    tone: TONES.includes(item?.tone) ? item.tone : "",
    color: item?.color || "",
  })).filter((item) => Number.isFinite(item.from) && Number.isFinite(item.to));
}

function svgEl(tagName, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tagName);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      node.setAttribute(key, String(value));
    }
  });
  return node;
}

function svgText(text, x, y, className, anchor = "start") {
  const node = svgEl("text", { x, y, class: className, "text-anchor": anchor });
  node.textContent = String(text ?? "");
  return node;
}
