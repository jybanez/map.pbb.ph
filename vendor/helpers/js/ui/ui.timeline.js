import { createElement, clearNode } from "./ui.dom.js";
import { createEventBag } from "./ui.events.js";
import { createDropdown } from "./ui.dropdown.js?v=0.21.205";
import { createIcon } from "./ui.icons.js";

const GENERATED_ITEM_ID = Symbol("generatedTimelineItemId");
const DEFAULT_ITEM_HEIGHT = 64;
const DEFAULT_GROUP_LABEL_HEIGHT = 32;
let disclosureInstance = 0;

const DEFAULT_OPTIONS = {
  className: "",
  ariaLabel: "Timeline",
  orientation: "vertical", // vertical | horizontal
  density: "comfortable", // compact | comfortable
  emptyText: "No timeline items.",
  locale: "en-US",
  timeZone: undefined,
  groupByDate: true,
  showConnector: true,
  linkedRange: null, // { startMs, endMs, anchorMs? }
  includeUndatedInRange: false,
  onItemClick: null,
  onActionClick: null,
  onContextMenuAction: null,
  mountItemContent: null,
  enableVirtualization: false,
  virtualThreshold: 120,
  virtualOverscan: 480,
  endThreshold: 320,
  topAnchorThreshold: 48,
  isLoading: false,
  loadingText: "Loading timeline items…",
  hasMore: true,
  onRangeChange: null,
  onReachEnd: null,
  estimateItemHeight: null, // total virtual unit height, including any date heading
  collapsible: false,
  defaultCollapsed: false,
  onCollapseChange: null,
};

export function createTimeline(container, items = [], options = {}) {
  const customMounts = new Map();
  let currentItems = normalizeItems(items);
  let currentOptions = normalizeOptions(options);
  let visibleItems = [];
  let root = null;
  let loadingIndicator = null;
  let loadingStatus = null;
  let api = null;
  let virtualViewport = null;
  let floatingDate = null;
  let virtualTopSpacer = null;
  let virtualSlice = null;
  let virtualBottomSpacer = null;
  let virtualRange = { start: 0, end: -1, startId: null, endId: null };
  let lastEmittedRangeKey = "";
  let reachedBoundaryId = null;
  let scrollFrame = 0;
  let measureFrame = 0;
  let anchorRestoreToken = 0;
  let expectedScrollTop = null;
  let resizeObserver = null;
  let layoutSnapshot = null;
  let navigationToken = 0;
  let destroyed = false;
  const renderedUnits = new Map();
  const rowEvents = new Map();
  const rowMenus = new Map();
  const measuredHeights = new Map();
  const collapsedStates = new Map();
  const disclosureIds = new Map();
  const disclosurePrefix = `ui-timeline-disclosure-${++disclosureInstance}`;

  function syncLoading() {
    if (!root) return;
    root.setAttribute("aria-busy", String(currentOptions.isLoading));
    if (!loadingIndicator || !root.contains(loadingIndicator)) {
      // Keep a fixed end slot even when idle so clearing loading cannot clamp
      // the viewport's scrollTop or move a retained row at the lower boundary.
      loadingIndicator = createElement("div", { className: "ui-timeline-loading", attrs: { "aria-hidden": "true" } });
      (virtualBottomSpacer?.parentNode || root).appendChild(loadingIndicator);
    }
    loadingIndicator.classList.toggle("is-active", currentOptions.isLoading);
    loadingIndicator.textContent = currentOptions.isLoading ? currentOptions.loadingText : "";
    const empty = root.querySelector(":scope > .ui-timeline-empty");
    if (empty) empty.hidden = currentOptions.isLoading;
    if (!loadingStatus || loadingStatus.parentNode !== container) {
      // Outside aria-busy: loading announcements must not wait for completion.
      loadingStatus = createElement("div", { className: "ui-timeline-loading-status", attrs: { role: "status", "aria-live": "polite", "aria-atomic": "true" } });
      container.appendChild(loadingStatus);
    }
    const label = currentOptions.isLoading ? currentOptions.loadingText : "";
    if (loadingStatus.textContent !== label) loadingStatus.textContent = label;
  }

  function syncDisclosure() {
    if (!currentOptions.collapsible && !collapsedStates.size) return;
    const ids = new Set(currentItems.map(item => String(item.id)));
    for (const id of collapsedStates.keys()) if (!ids.has(id)) {
      collapsedStates.delete(id);
      disclosureIds.delete(id);
    }
    if (!currentOptions.collapsible) return;
    assertVirtualItemIdentities(currentItems);
    currentItems = currentItems.map(item => {
      const id = String(item.id);
      if (!collapsedStates.has(id)) collapsedStates.set(id, item.collapsed ?? currentOptions.defaultCollapsed);
      if (!disclosureIds.has(id)) disclosureIds.set(id, `${disclosurePrefix}-${disclosureIds.size + 1}-${++disclosureInstance}`);
      const collapsed = Boolean(collapsedStates.get(id));
      return item.collapsed === collapsed ? item : { ...item, collapsed };
    });
  }

  function isCollapsed(id) {
    return currentOptions.collapsible && collapsedStates.get(String(id)) === true;
  }

  function changeCollapsed(ids, value) {
    if (destroyed || !currentOptions.collapsible) return [];
    const selected = ids == null ? null : new Set(ids.map(String));
    const changed = currentItems.filter(item => (!selected || selected.has(String(item.id))) && isCollapsed(item.id) !== Boolean(value));
    if (!changed.length) return [];
    const activeRow = document.activeElement?.closest?.(".ui-timeline-item");
    const focusId = activeRow && container.contains(activeRow) ? activeRow.dataset.itemId : null;
    navigationToken += 1;
    const snapshot = captureVirtualSnapshot();
    if (snapshot) snapshot.reason = "layout";
    for (const item of changed) {
      collapsedStates.set(String(item.id), Boolean(value));
      measuredHeights.delete(getVirtualMeasureKey(item));
    }
    if (snapshot && value && changed.some(item => String(item.id) === String(snapshot.anchorId))) snapshot.anchorOffset = 0;
    render("layout", snapshot);
    if (focusId && changed.some(item => String(item.id) === focusId)) {
      Array.from(container.querySelectorAll(".ui-timeline-item")).find(row => row.dataset.itemId === focusId)
        ?.querySelector(".ui-timeline-disclosure")?.focus({ preventScroll: true });
    }
    const changedIds = changed.map(item => item.id);
    currentOptions.onCollapseChange?.({ ids: changedIds, collapsed: Boolean(value) });
    return changedIds;
  }

  function render(reason = "replace", restoreSnapshot = null) {
    syncDisclosure();
    if (!container || container.nodeType !== 1) {
      return;
    }
    visibleItems = applyLinkedRange(currentItems, currentOptions);
    if (shouldVirtualize(visibleItems, currentOptions)) {
      assertVirtualItemIdentities(visibleItems);
      renderVirtual(reason, restoreSnapshot);
      return;
    }
    teardownVirtualRoot();
    reconcileCustomMounts(visibleItems);
    clearNode(container);
    clearDetachedRowEvents();

    root = createElement("section", {
      className: buildRootClassName(currentOptions, false),
      attrs: {
        role: "region",
        "aria-label": currentOptions.ariaLabel,
      },
    });

    if (!visibleItems.length) {
      root.appendChild(createElement("p", {
        className: "ui-timeline-empty",
        text: currentOptions.emptyText,
      }));
      container.appendChild(root);
      syncLoading();
      return;
    }

    if (currentOptions.orientation === "vertical" && currentOptions.groupByDate) {
      renderVerticalGrouped(root, visibleItems);
    } else {
      renderList(root, visibleItems);
    }

    container.appendChild(root);
    syncLoading();
    clearDetachedRowEvents();
  }

  function renderVirtual(reason = "replace", restoreSnapshot = null, targetIndex = null) {
    ensureVirtualRoot();
    if (!restoreSnapshot && targetIndex == null && ["scroll", "position"].includes(reason)) {
      restoreSnapshot = captureVirtualSnapshot();
      if (restoreSnapshot) restoreSnapshot.reason = reason;
    }
    applyEstimatedAnchor(restoreSnapshot);

    const units = buildVirtualUnits(visibleItems, currentOptions);
    const anchorIndex = restoreSnapshot?.anchorId == null ? -1
      : units.findIndex(unit => String(unit.item.id) === String(restoreSnapshot.anchorId));
    const desiredTop = targetIndex != null ? estimateOffset(units, measuredHeights, targetIndex)
      : restoreSnapshot?.reason === "prepend" && restoreSnapshot.nearTop ? 0
      : anchorIndex >= 0 ? Math.max(0, estimateOffset(units, measuredHeights, anchorIndex) - restoreSnapshot.anchorOffset)
      : virtualViewport.scrollTop;
    const windowRange = computeMeasuredWindow(
      units,
      measuredHeights,
      desiredTop,
      virtualViewport.clientHeight || container.clientHeight || 1,
      currentOptions.virtualOverscan,
    );
    const renderedItems = visibleItems.slice(windowRange.start, windowRange.end);
    const activeElement = document.activeElement;
    const hadFocus = virtualSlice.contains(activeElement);
    reconcileCustomMounts(renderedItems);
    resizeObserver?.disconnect();
    virtualTopSpacer.style.height = `${windowRange.topSpacerHeight}px`;
    virtualBottomSpacer.style.height = `${windowRange.bottomSpacerHeight}px`;

    const nextUnits = new Map();
    for (let index = windowRange.start; index < windowRange.end; index += 1) {
      const unit = units[index];
      const previous = renderedUnits.get(String(unit.item.id));
      const reusable = previous && previous.item === unit.item && previous.label === unit.groupLabel;
      const unitNode = reusable ? previous.node : createElement("div", {
        className: `ui-timeline-virtual-unit${unit.startsGroup ? " starts-group" : ""}`,
        attrs: {
          "data-virtual-index": String(index),
          "data-item-id": String(unit.item.id),
          "data-measure-key": unit.key,
        },
      });
      unitNode.dataset.virtualIndex = String(index);
      unitNode.classList.toggle("has-group-divider", unit.startsGroup && index > 0);
      unitNode.classList.toggle("ends-group", index === units.length - 1 || units[index + 1].startsGroup);
      if (!reusable && unit.groupLabel) {
        unitNode.appendChild(createElement("p", {
          className: "ui-timeline-group-label",
          text: unit.groupLabel,
        }));
      }
      if (!reusable) unitNode.appendChild(renderItem(unit.item, index, visibleItems.length));
      else if (previous.index !== index || previous.total !== visibleItems.length) {
        const rail = unitNode.querySelector(".ui-timeline-rail");
        const connector = rail.querySelector(".ui-timeline-connector");
        if (currentOptions.showConnector && index < visibleItems.length - 1) {
          if (!connector) rail.appendChild(createElement("span", { className: "ui-timeline-connector" }));
        } else connector?.remove();
        const record = customMounts.get(getCustomMountKey(unit.item));
        if (record) {
          record.context = createItemContext(index, visibleItems.length);
          callMountUpdate(record, record.item, record.context);
        }
      }
      const position = virtualSlice.children[index - windowRange.start];
      if (position !== unitNode) virtualSlice.insertBefore(unitNode, position || null);
      nextUnits.set(String(unit.item.id), { node: unitNode, item: unit.item, label: unit.groupLabel, index, total: visibleItems.length });
      resizeObserver?.observe(unitNode);
    }
    for (const node of Array.from(virtualSlice.children)) {
      if (nextUnits.get(node.dataset.itemId)?.node !== node) node.remove();
    }
    renderedUnits.clear();
    for (const [key, value] of nextUnits) renderedUnits.set(key, value);
    clearDetachedRowEvents();
    if (hadFocus && document.activeElement !== activeElement) {
      if (activeElement.isConnected) activeElement.focus({ preventScroll: true });
      else virtualViewport.focus({ preventScroll: true });
    }

    updateVirtualRange(windowRange);
    measureRenderedUnits(units);
    // Measurements change both offsets and scroll bounds. Keep spacers in the
    // same coordinate system before restoring an anchor or aligning a jump.
    virtualTopSpacer.style.height = `${estimateOffset(units, measuredHeights, windowRange.start)}px`;
    virtualBottomSpacer.style.height = `${Math.max(0, estimateOffset(units, measuredHeights, units.length) - estimateOffset(units, measuredHeights, windowRange.end))}px`;
    if (targetIndex != null) setVirtualScrollTop(estimateOffset(units, measuredHeights, targetIndex));
    else applyEstimatedAnchor(restoreSnapshot);
    queueExactAnchorRestore(restoreSnapshot);
    layoutSnapshot = captureVirtualSnapshot();
    updateFloatingDate();
    if (!["layout", "jump", "position", "measure"].includes(reason)) checkReachEnd(reason);
  }

  function ensureVirtualRoot() {
    if (virtualViewport && root?.isConnected) {
      root.className = buildRootClassName(currentOptions, true);
      root.setAttribute("aria-label", currentOptions.ariaLabel);
      syncLoading();
      return;
    }
    teardownVirtualRoot();
    clearNode(container);
    root = createElement("section", {
      className: buildRootClassName(currentOptions, true),
      attrs: { role: "region", "aria-label": currentOptions.ariaLabel },
    });
    virtualViewport = createElement("div", {
      className: "ui-timeline-viewport",
      attrs: { tabindex: "0" },
    });
    const scroller = createElement("div", { className: "ui-timeline-virtual-scroller" });
    virtualTopSpacer = createElement("div", { className: "ui-timeline-virtual-spacer", attrs: { "aria-hidden": "true" } });
    virtualSlice = createElement("div", { className: "ui-timeline-list ui-timeline-virtual-slice", attrs: { role: "list" } });
    virtualBottomSpacer = createElement("div", { className: "ui-timeline-virtual-spacer", attrs: { "aria-hidden": "true" } });
    scroller.append(virtualTopSpacer, virtualSlice, virtualBottomSpacer);
    virtualViewport.appendChild(scroller);
    root.appendChild(virtualViewport);
    floatingDate = createElement("div", {
      className: "ui-timeline-group-label ui-timeline-floating-date",
      attrs: { "aria-hidden": "true", hidden: "" },
    });
    root.appendChild(floatingDate);
    container.appendChild(root);
    syncLoading();
    virtualViewport.addEventListener("scroll", onVirtualScroll, { passive: true });
    if (typeof ResizeObserver === "function") {
      resizeObserver = new ResizeObserver(onVirtualResize);
    }
  }

  function teardownVirtualRoot() {
    expectedScrollTop = null;
    renderedUnits.clear();
    layoutSnapshot = null;
    if (scrollFrame) clearTimeout(scrollFrame);
    if (measureFrame) cancelAnimationFrame(measureFrame);
    scrollFrame = 0;
    measureFrame = 0;
    resizeObserver?.disconnect();
    resizeObserver = null;
    virtualViewport?.removeEventListener("scroll", onVirtualScroll);
    virtualViewport = null;
    floatingDate = null;
    virtualTopSpacer = null;
    virtualSlice = null;
    virtualBottomSpacer = null;
    virtualRange = { start: 0, end: -1, startId: null, endId: null };
    lastEmittedRangeKey = "";
  }

  function onVirtualScroll() {
    updateFloatingDate();
    const programmaticScroll = expectedScrollTop != null && Math.abs(virtualViewport.scrollTop - expectedScrollTop) <= 1;
    if (!programmaticScroll) expectedScrollTop = null;
    if (!programmaticScroll) checkReachEnd("scroll");
    if (!programmaticScroll) {
      navigationToken += 1;
      layoutSnapshot = captureVirtualSnapshot();
      anchorRestoreToken += 1;
      if (measureFrame) {
        cancelAnimationFrame(measureFrame);
        measureFrame = 0;
      }
    }
    if (scrollFrame) return;
    const reason = programmaticScroll ? "position" : "scroll";
    scrollFrame = setTimeout(() => {
      scrollFrame = 0;
      renderVirtual(reason);
    }, 0);
  }

  function onVirtualResize(entries) {
    let changed = false;
    for (const entry of entries || []) {
      const measureKey = entry.target?.dataset?.measureKey;
      if (!measureKey) continue;
      const height = Math.max(1, entry.target.getBoundingClientRect().height);
      if (measuredHeights.get(measureKey) !== height) {
        measuredHeights.set(measureKey, height);
        changed = true;
      }
    }
    if (!changed || measureFrame) return;
    const snapshot = { ...(layoutSnapshot || captureVirtualSnapshot()), reason: "measure" };
    measureFrame = requestAnimationFrame(() => {
      measureFrame = 0;
      renderVirtual("measure", snapshot);
    });
  }

  function measureRenderedUnits(units) {
    Array.from(virtualSlice?.children || []).forEach((node) => {
      const index = Number(node.dataset.virtualIndex);
      const unit = units[index];
      if (!unit) return;
      const height = Math.max(1, node.getBoundingClientRect().height);
      if (measuredHeights.get(unit.key) !== height) {
        measuredHeights.set(unit.key, height);
      }
    });
  }

  function captureVirtualSnapshot() {
    if (!virtualViewport || !shouldVirtualize(visibleItems, currentOptions)) return null;
    const anchor = getFirstVisibleVirtualItem(virtualViewport);
    return {
      anchorId: anchor?.id || null,
      anchorOffset: anchor?.offset || 0,
      scrollTop: virtualViewport.scrollTop,
      nearTop: virtualViewport.scrollTop <= currentOptions.topAnchorThreshold,
    };
  }

  function applyEstimatedAnchor(snapshot) {
    if (!virtualViewport || !snapshot) return;
    if (snapshot.reason === "prepend" && snapshot.nearTop) {
      setVirtualScrollTop(0);
      return;
    }
    if (!snapshot.anchorId) {
      setVirtualScrollTop(snapshot.scrollTop || 0);
      return;
    }
    const units = buildVirtualUnits(visibleItems, currentOptions);
    const anchorIndex = units.findIndex((unit) => String(unit.item.id) === String(snapshot.anchorId));
    if (anchorIndex < 0) return;
    setVirtualScrollTop(Math.max(0, estimateOffset(units, measuredHeights, anchorIndex) - snapshot.anchorOffset));
  }

  function queueExactAnchorRestore(snapshot) {
    if (!virtualViewport || !snapshot || (snapshot.reason === "prepend" && snapshot.nearTop)) return;
    const token = anchorRestoreToken + 1;
    anchorRestoreToken = token;
    requestAnimationFrame(() => {
      if (!virtualViewport || !snapshot.anchorId || anchorRestoreToken !== token) return;
      const anchor = findVirtualItemNode(virtualViewport, snapshot.anchorId);
      if (!anchor) return;
      const delta = (anchor.getBoundingClientRect().top - getVirtualContentOrigin(virtualViewport)) - snapshot.anchorOffset;
      if (Math.abs(delta) > 1) setVirtualScrollTop(virtualViewport.scrollTop + delta);
      layoutSnapshot = captureVirtualSnapshot();
      if (!["layout", "jump", "position", "measure"].includes(snapshot.reason)) checkReachEnd("anchor");
    });
  }

  function setVirtualScrollTop(value) {
    if (!virtualViewport) return;
    virtualViewport.scrollTop = Math.max(0, value);
    // Native scroll delivery may occur after the next animation frame.
    expectedScrollTop = virtualViewport.scrollTop;
    updateFloatingDate();
  }

  function updateFloatingDate() {
    if (!floatingDate || !virtualViewport) return;
    floatingDate.hidden = true;
    if (!currentOptions.groupByDate) return;
    const top = virtualViewport.getBoundingClientRect().top;
    const node = Array.from(virtualSlice.children).find((unit) => unit.getBoundingClientRect().bottom > top + 1);
    const item = visibleItems[Number(node?.dataset.virtualIndex)];
    if (!item) return;
    const heading = node.querySelector(".ui-timeline-group-label");
    // Keep the inline heading until it passes the viewport, then retain its date
    // independently of the virtual window (which can unmount that heading).
    if (heading && heading.getBoundingClientRect().top >= top) return;
    const dayKey = getItemDayKey(item, currentOptions.timeZone);
    floatingDate.textContent = dayKey === "unknown" ? "Undated" : formatGroupLabel(dayKey, currentOptions.locale);
    floatingDate.style.width = `${virtualViewport.clientWidth}px`;
    floatingDate.hidden = false;
  }

  function updateVirtualRange(windowRange) {
    const startItem = visibleItems[windowRange.start] || null;
    const endItem = visibleItems[windowRange.end - 1] || null;
    virtualRange = {
      start: windowRange.start,
      end: endItem ? windowRange.end - 1 : -1,
      startId: startItem?.id ?? null,
      endId: endItem?.id ?? null,
    };
    const key = `${virtualRange.start}:${virtualRange.end}:${String(virtualRange.startId)}:${String(virtualRange.endId)}`;
    if (key === lastEmittedRangeKey) return;
    lastEmittedRangeKey = key;
    currentOptions.onRangeChange?.({ ...virtualRange }, getState());
  }

  function checkReachEnd(reason) {
    if (!virtualViewport || !visibleItems.length || currentOptions.isLoading || !currentOptions.hasMore || typeof currentOptions.onReachEnd !== "function") return;
    const distance = Math.max(0, virtualViewport.scrollHeight - virtualViewport.clientHeight - virtualViewport.scrollTop);
    if (distance > currentOptions.endThreshold) return;
    const boundaryId = String(visibleItems[visibleItems.length - 1].id);
    if (reachedBoundaryId === boundaryId) return;
    reachedBoundaryId = boundaryId;
    currentOptions.onReachEnd({ boundaryId, count: visibleItems.length, distance, reason }, getState());
  }

  function renderVerticalGrouped(host, itemsToRender) {
    const groups = groupItemsByDate(itemsToRender, currentOptions.locale, currentOptions.timeZone);
    groups.forEach((group) => {
      const section = createElement("section", { className: "ui-timeline-group" });
      section.appendChild(createElement("p", {
        className: "ui-timeline-group-label",
        text: group.label,
      }));
      const list = createElement("div", {
        className: "ui-timeline-list",
        attrs: { role: "list" },
      });
      renderList(list, group.items);
      section.appendChild(list);
      host.appendChild(section);
    });
  }

  function renderList(host, listItems) {
    const list = createElement("div", {
      className: "ui-timeline-list",
      attrs: { role: "list" },
    });
    listItems.forEach((item, index) => {
      const card = renderItem(item, index, listItems.length);
      list.appendChild(card);
    });
    host.appendChild(list);
  }

  function renderItem(item, index, total) {
    const row = createElement("article", {
      className: ["ui-timeline-item", currentOptions.collapsible ? "is-collapsible" : "", isCollapsed(item.id) ? "is-collapsed" : "", item.className || ""].filter(Boolean).join(" "),
      attrs: {
        "data-item-id": String(item.id),
        role: "listitem",
        tabindex: typeof currentOptions.onItemClick === "function" ? "0" : null,
        "aria-label": buildItemAriaLabel(item),
      },
    });
    const events = createEventBag();
    rowEvents.set(row, events);

    const rail = createElement("div", { className: "ui-timeline-rail" });
    const marker = createElement("span", {
      className: `ui-timeline-marker${item.status ? ` is-${item.status}` : ""}`,
      html: item.iconHtml || getStatusIconHtml(item.status),
    });
    rail.appendChild(marker);
    if (currentOptions.showConnector && index < total - 1) {
      rail.appendChild(createElement("span", { className: "ui-timeline-connector" }));
    }

    const body = createElement("div", { className: "ui-timeline-body" });
    const disclosure = currentOptions.collapsible;
    const header = createElement(disclosure ? "button" : "header", {
      className: `ui-timeline-header${disclosure ? " ui-timeline-disclosure" : ""}`,
      attrs: disclosure ? { type: "button", "aria-expanded": String(!isCollapsed(item.id)), "aria-controls": disclosureIds.get(String(item.id)) } : {},
    });
    header.appendChild(createElement(disclosure ? "span" : "h4", { className: "ui-timeline-title", text: item.title }));
    if (disclosure) {
      header.appendChild(createElement("span", { className: "ui-timeline-subtitle", text: item.subtitle }));
      const preview = createElement("span", { className: "ui-timeline-preview", text: item.preview ?? item.description });
      preview.hidden = !isCollapsed(item.id);
      header.appendChild(preview);
      events.on(header, "click", event => {
        event.stopPropagation();
        changeCollapsed([item.id], !isCollapsed(item.id));
      });
    }
    const menuItems = (Array.isArray(item.contextMenu?.items) ? item.contextMenu.items : [])
      .filter(action => action && action.id != null && action.label && !action.hidden);
    const headerRow = menuItems.length ? createElement("div", { className: "ui-timeline-header-row" }) : null;
    const headerActions = menuItems.length ? createElement("div", { className: "ui-timeline-header-actions" }) : header;
    if (item.timestamp) {
      headerActions.appendChild(createElement("time", {
        className: "ui-timeline-time",
        text: formatTimestamp(item.timestamp, currentOptions.locale, currentOptions.timeZone,
          currentOptions.groupByDate && currentOptions.orientation === "vertical"),
        attrs: { datetime: item.timestamp, title: formatTimestamp(item.timestamp, currentOptions.locale, currentOptions.timeZone) },
      }));
    }
    if (headerRow) {
      const trigger = createElement("button", {
        className: "ui-button ui-timeline-menu-trigger",
        text: "⋯",
        attrs: { type: "button", "aria-label": item.contextMenu.ariaLabel || `Actions for ${item.title}` },
      });
      headerActions.appendChild(trigger);
      headerRow.append(header, headerActions);
      body.appendChild(headerRow);
      const menu = createDropdown(trigger, menuItems.map(action => ({
        ...action,
        icon: action.iconHtml || (action.icon ? createIcon(action.icon).outerHTML : ""),
        danger: Boolean(action.danger || action.variant === "danger"),
      })), {
        align: "right",
        ariaLabel: item.contextMenu.ariaLabel || `Actions for ${item.title}`,
        className: "ui-timeline-item-menu",
        onSelect(action, meta) {
          const selected = menuItems.find(entry => entry.id === action.id);
          if (!selected || selected.disabled || destroyed || !container.contains(row)) return;
          currentOptions.onContextMenuAction?.(selected, item, {
            ...createItemContext(visibleItems.findIndex(entry => entry.id === item.id), visibleItems.length),
            menu: meta, trigger,
          });
        },
      });
      rowMenus.set(row, menu);
      events.on(trigger, "click", event => event.stopPropagation());
      events.on(trigger, "keydown", event => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          event.stopPropagation();
          menu.open();
        }
      });
    } else body.appendChild(header);
    const content = disclosure ? createElement("div", {
      className: "ui-timeline-details",
      attrs: { id: disclosureIds.get(String(item.id)) },
    }) : body;
    if (disclosure) {
      content.hidden = isCollapsed(item.id);
      body.appendChild(content);
    }

    if (item.subtitle && !disclosure) {
      body.appendChild(createElement("p", { className: "ui-timeline-subtitle", text: item.subtitle }));
    }
    if (item.description) {
      content.appendChild(createElement("p", { className: "ui-timeline-description", text: item.description }));
    }
    if (Array.isArray(item.meta) && item.meta.length) {
      const metaWrap = createElement("div", { className: "ui-timeline-meta" });
      item.meta.forEach((entry) => {
        metaWrap.appendChild(createElement("span", {
          className: "ui-timeline-tag",
          text: String(entry),
        }));
      });
      content.appendChild(metaWrap);
    }
    if (Array.isArray(item.actions) && item.actions.length) {
      const actions = createElement("div", { className: "ui-timeline-actions" });
      item.actions.forEach((action) => {
        const button = createElement("button", {
          className: `ui-button ${action.className || ""}`.trim(),
          text: action.label,
          attrs: { type: "button" },
        });
        events.on(button, "click", (event) => {
          event.stopPropagation();
          currentOptions.onActionClick?.(action, item);
        });
        actions.appendChild(button);
      });
      content.appendChild(actions);
    }
    renderCustomContent(content, item, index, total);

    events.on(row, "click", (event) => {
      if (shouldIgnoreItemActivation(event)) {
        return;
      }
      currentOptions.onItemClick?.(item);
    });
    if (typeof currentOptions.onItemClick === "function") {
      events.on(row, "keydown", (event) => {
        if (event.defaultPrevented) {
          return;
        }
        if (event.key !== "Enter" && event.key !== " ") {
          return;
        }
        if (shouldIgnoreItemActivation(event)) {
          return;
        }
        event.preventDefault();
        currentOptions.onItemClick?.(item);
      });
    }

    row.append(rail, body);
    return row;
  }

  function renderCustomContent(body, item, index, total) {
    if (typeof currentOptions.mountItemContent !== "function" || item.hasCustomContent === false) {
      return;
    }
    const key = getCustomMountKey(item);
    const context = createItemContext(index, total);
    let record = customMounts.get(key);
    if (record) {
      body.appendChild(record.host);
      record.item = item;
      record.context = context;
      record.host.dataset.itemId = String(item.id);
      record.host.dataset.contentKey = String(item.contentKey ?? "");
      callMountUpdate(record, item, context);
      return;
    }

    const host = createElement("div", {
      className: "ui-timeline-custom-content",
      attrs: {
        "data-item-id": String(item.id),
        "data-content-key": String(item.contentKey ?? ""),
      },
    });
    body.appendChild(host);

    let result = null;
    try {
      result = currentOptions.mountItemContent(host, item, context);
    } catch (error) {
      host.textContent = "";
      host.hidden = true;
      throw error;
    }
    if (!result && !host.childNodes.length) {
      host.remove();
      return;
    }
    record = normalizeMountRecord({
      key,
      id: String(item.id),
      contentKey: String(item.contentKey ?? ""),
      host,
      item,
      context,
      result,
    });
    customMounts.set(key, record);
  }

  function createItemContext(index, total) {
    return {
      index,
      total,
      timeline: api,
      options: { ...currentOptions },
      visibleItems: visibleItems.map((item) => ({ ...item })),
    };
  }

  function reconcileCustomMounts(nextVisibleItems) {
    if (!customMounts.size) {
      return;
    }
    if (typeof currentOptions.mountItemContent !== "function") {
      destroyAllCustomMounts();
      return;
    }
    const nextKeys = new Set(
      nextVisibleItems
        .filter((item) => item.hasCustomContent !== false)
        .map((item) => getCustomMountKey(item)),
    );
    Array.from(customMounts.entries()).forEach(([key, record]) => {
      if (!nextKeys.has(key)) {
        destroyCustomMount(record);
        customMounts.delete(key);
      }
    });
  }

  function callMountUpdate(record, item, context) {
    if (!record || typeof record.update !== "function") {
      return;
    }
    record.update(item, context);
  }

  function normalizeMountRecord(record) {
    if (typeof record.result === "function") {
      record.destroy = record.result;
      record.update = null;
      return record;
    }
    if (record.result && typeof record.result === "object") {
      record.update = typeof record.result.update === "function"
        ? record.result.update.bind(record.result)
        : null;
      record.destroy = typeof record.result.destroy === "function"
        ? record.result.destroy.bind(record.result)
        : null;
      return record;
    }
    record.update = null;
    record.destroy = null;
    return record;
  }

  function destroyCustomMount(record) {
    if (!record) {
      return;
    }
    try {
      record.destroy?.();
    } finally {
      record.host?.remove?.();
    }
  }

  function destroyAllCustomMounts() {
    Array.from(customMounts.values()).forEach((record) => destroyCustomMount(record));
    customMounts.clear();
  }

  function clearDetachedRowEvents() {
    for (const [row, bag] of rowEvents) {
      if (!container.contains(row)) {
        rowMenus.get(row)?.destroy();
        rowMenus.delete(row);
        bag.clear();
        rowEvents.delete(row);
      }
    }
  }

  // mutate is synchronous: capture the anchor before app-owned state/DOM changes.
  function invalidateLayout(ids = null, { mutate } = {}) {
    if (destroyed) return;
    navigationToken += 1;
    const snapshot = captureVirtualSnapshot();
    const selected = ids == null ? null : new Set((Array.isArray(ids) ? ids : [ids]).map(String));
    mutate?.();
    for (const item of currentItems) {
      if (!selected || selected.has(String(item.id))) measuredHeights.delete(getVirtualMeasureKey(item));
    }
    for (const record of customMounts.values()) {
      if (!selected || selected.has(record.id)) callMountUpdate(record, record.item, record.context);
    }
    if (!virtualViewport) return;
    if (snapshot) {
      snapshot.reason = "layout";
      const anchor = findVirtualItemNode(virtualViewport, snapshot.anchorId);
      // An offset deep in a removed body cannot be retained: reveal its header.
      if (anchor && -snapshot.anchorOffset >= anchor.getBoundingClientRect().height) snapshot.anchorOffset = 0;
    }
    renderVirtual("layout", snapshot);
  }

  async function scrollToItem(id, { align = "start", focus = false } = {}) {
    const key = String(id);
    if (destroyed) return { found: false, reason: "destroyed" };
    if (!currentItems.some(item => String(item.id) === key)) return { found: false, reason: "not-loaded" };
    const index = visibleItems.findIndex(item => String(item.id) === key);
    if (index < 0) return { found: false, reason: "filtered" };
    const token = ++navigationToken;
    anchorRestoreToken += 1;
    if (measureFrame) cancelAnimationFrame(measureFrame);
    measureFrame = 0;
    if (scrollFrame) clearTimeout(scrollFrame);
    scrollFrame = 0;
    if (virtualViewport) {
      // Recalculate after mounted content is measured, rather than trusting stale estimates.
      for (let pass = 0; pass < 2; pass += 1) {
        renderVirtual("jump", null, index);
        await new Promise(resolve => requestAnimationFrame(resolve));
        if (destroyed || token !== navigationToken) return { found: false, reason: "cancelled" };
      }
    }
    const row = Array.from(container.querySelectorAll(".ui-timeline-item[data-item-id]"))
      .find(node => node.dataset.itemId === key);
    if (!row) return { found: false, reason: "not-mounted" };
    // Earlier mount passes may have queued an exact restore at start alignment.
    anchorRestoreToken += 1;
    if (virtualViewport) {
      const rect = row.getBoundingClientRect();
      const viewport = virtualViewport.getBoundingClientRect();
      const offset = align === "center" ? (viewport.height - rect.height) / 2
        : align === "end" ? viewport.height - rect.height : 0;
      setVirtualScrollTop(virtualViewport.scrollTop + rect.top - viewport.top - offset);
      layoutSnapshot = captureVirtualSnapshot();
    } else row.scrollIntoView({ block: ["center", "end"].includes(align) ? align : "start" });
    if (focus) {
      if (!row.hasAttribute("tabindex")) row.setAttribute("tabindex", "-1");
      row.focus({ preventScroll: true });
    }
    return { found: true, id: key };
  }

  function update(nextItems = undefined, nextOptions = {}) {
    if (destroyed) return;
    const optionKeys = Object.keys(nextOptions || {});
    if (nextItems === undefined && optionKeys.length > 0 && optionKeys.every(key => ["isLoading", "hasMore", "loadingText"].includes(key))) {
      currentOptions = normalizeOptions({ ...currentOptions, ...(nextOptions || {}) });
      syncLoading();
      checkReachEnd("update");
      return;
    }
    navigationToken += 1;
    const snapshot = captureVirtualSnapshot();
    currentItems = normalizeItems(nextItems === undefined ? currentItems : nextItems);
    const disclosureChanged = nextOptions?.collapsible != null && Boolean(nextOptions.collapsible) !== currentOptions.collapsible;
    currentOptions = normalizeOptions({ ...currentOptions, ...(nextOptions || {}) });
    if (disclosureChanged) measuredHeights.clear();
    render("replace", snapshot);
  }

  function append(nextItems = []) {
    navigationToken += 1;
    const snapshot = captureVirtualSnapshot();
    if (snapshot) snapshot.reason = "append";
    const incoming = normalizeItems(nextItems);
    currentItems = currentItems.concat(incoming);
    render("append", snapshot);
  }

  function prepend(nextItems = []) {
    navigationToken += 1;
    const snapshot = captureVirtualSnapshot();
    if (snapshot) snapshot.reason = "prepend";
    const incoming = normalizeItems(nextItems);
    currentItems = incoming.concat(currentItems);
    render("prepend", snapshot);
  }

  function setLinkedRange(range) {
    navigationToken += 1;
    const snapshot = captureVirtualSnapshot();
    currentOptions = normalizeOptions({
      ...currentOptions,
      linkedRange: range ?? null,
    });
    render("replace", snapshot);
  }

  function resetReachEnd(options = {}) {
    reachedBoundaryId = null;
    if (options?.check !== false) checkReachEnd("reset");
  }

  function destroy() {
    destroyed = true;
    navigationToken += 1;
    destroyAllCustomMounts();
    teardownVirtualRoot();
    clearNode(container);
    clearDetachedRowEvents();
    root = null;
    loadingIndicator = null;
    loadingStatus = null;
  }

  function getState() {
    return {
      options: { ...currentOptions },
      items: currentItems.map((item) => ({ ...item })),
      visibleItems: visibleItems.map((item) => ({ ...item })),
      virtualization: {
        enabled: shouldVirtualize(visibleItems, currentOptions),
        range: { ...virtualRange },
        measuredCount: measuredHeights.size,
        reachedBoundaryId,
      },
    };
  }

  api = {
    setCollapsed: (id, value) => changeCollapsed([id], value).length > 0,
    isCollapsed,
    collapseAll: () => changeCollapsed(null, true),
    expandAll: () => changeCollapsed(null, false),
    invalidateLayout,
    scrollToItem,
    update,
    append,
    prepend,
    setLinkedRange,
    resetReachEnd,
    destroy,
    getState,
  };

  render();

  return api;
}

function normalizeOptions(options) {
  const next = { ...DEFAULT_OPTIONS, ...(options || {}) };
  next.orientation = String(next.orientation || "vertical").toLowerCase() === "horizontal"
    ? "horizontal"
    : "vertical";
  next.density = String(next.density || "comfortable").toLowerCase() === "compact"
    ? "compact"
    : "comfortable";
  if (next.linkedRange != null) {
    const normalizedRange = normalizeLinkedRange(next.linkedRange);
    next.linkedRange = normalizedRange || null;
  } else {
    next.linkedRange = null;
  }
  next.includeUndatedInRange = Boolean(next.includeUndatedInRange);
  next.mountItemContent = typeof next.mountItemContent === "function" ? next.mountItemContent : null;
  next.enableVirtualization = Boolean(next.enableVirtualization);
  next.virtualThreshold = normalizeNonNegativeNumber(next.virtualThreshold, 120);
  next.virtualOverscan = normalizeNonNegativeNumber(next.virtualOverscan, 480);
  next.endThreshold = normalizeNonNegativeNumber(next.endThreshold, 320);
  next.topAnchorThreshold = normalizeNonNegativeNumber(next.topAnchorThreshold, 48);
  next.isLoading = Boolean(next.isLoading);
  next.loadingText = String(next.loadingText ?? DEFAULT_OPTIONS.loadingText);
  next.hasMore = next.hasMore !== false;
  next.onRangeChange = typeof next.onRangeChange === "function" ? next.onRangeChange : null;
  next.onReachEnd = typeof next.onReachEnd === "function" ? next.onReachEnd : null;
  next.estimateItemHeight = typeof next.estimateItemHeight === "function" ? next.estimateItemHeight : null;
  next.collapsible = Boolean(next.collapsible);
  next.defaultCollapsed = Boolean(next.defaultCollapsed);
  next.onCollapseChange = typeof next.onCollapseChange === "function" ? next.onCollapseChange : null;
  return next;
}

function normalizeItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }
  return items
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const ts = item.timestamp ? new Date(item.timestamp) : null;
      const normalized = {
        ...item,
        id: item.id ?? index + 1,
        title: String(item.title ?? "Untitled Event"),
        subtitle: item.subtitle == null ? "" : String(item.subtitle),
        description: item.description == null ? "" : String(item.description),
        preview: item.preview == null ? undefined : String(item.preview),
        collapsed: item.collapsed == null ? undefined : Boolean(item.collapsed),
        timestamp: ts && !Number.isNaN(ts.getTime()) ? ts.toISOString() : null,
        status: normalizeStatus(item.status),
        meta: Array.isArray(item.meta) ? item.meta : [],
        actions: normalizeActions(item.actions),
        iconHtml: item.iconHtml ? String(item.iconHtml) : "",
        contentKey: item.contentKey == null ? "" : String(item.contentKey),
        hasCustomContent: item.hasCustomContent === false ? false : item.hasCustomContent,
      };
      Object.defineProperty(normalized, GENERATED_ITEM_ID, {
        value: item.id == null,
        enumerable: false,
      });
      return normalized;
    })
    .filter(Boolean)
    .sort((a, b) => {
      const x = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const y = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return y - x;
    });
}

function buildRootClassName(options, virtualized) {
  return [
    "ui-timeline",
    `ui-timeline--${options.orientation}`,
    `ui-timeline--density-${options.density}`,
    virtualized ? "is-virtualized" : "",
    options.className || "",
  ].filter(Boolean).join(" ");
}

function shouldVirtualize(items, options) {
  return Boolean(
    options?.enableVirtualization
    && options.orientation === "vertical"
    && items.length > 0
    && items.length >= options.virtualThreshold
  );
}

function assertVirtualItemIdentities(items) {
  const seen = new Set();
  for (const item of items) {
    if (item[GENERATED_ITEM_ID]) {
      throw new Error("ui.timeline virtualization requires every item to have an explicit stable id.");
    }
    const id = String(item.id);
    if (seen.has(id)) {
      throw new Error(`ui.timeline virtualization requires unique item ids; duplicate \"${id}\".`);
    }
    seen.add(id);
  }
}

function buildVirtualUnits(items, options) {
  let previousDayKey = null;
  return items.map((item) => {
    const dayKey = options.groupByDate ? getItemDayKey(item, options.timeZone) : null;
    const startsGroup = Boolean(options.groupByDate && dayKey !== previousDayKey);
    previousDayKey = dayKey;
    return {
      item,
      key: getVirtualMeasureKey(item),
      startsGroup,
      groupLabel: startsGroup ? (dayKey === "unknown" ? "Undated" : formatGroupLabel(dayKey, options.locale)) : "",
      estimatedHeight: getEstimatedHeight(item, startsGroup, options),
    };
  });
}

function getEstimatedHeight(item, startsGroup, options) {
  const estimate = options.estimateItemHeight?.(item, { startsGroup });
  return typeof estimate === "number" && Number.isFinite(estimate) && estimate > 0
    ? estimate : estimateTimelineItemHeight(item, startsGroup);
}

function computeMeasuredWindow(units, measuredHeights, scrollTop, viewportHeight, overscan) {
  const startPixel = Math.max(0, scrollTop - overscan);
  const endPixel = scrollTop + Math.max(1, viewportHeight) + overscan;
  const offsets = new Array(units.length);
  let totalHeight = 0;
  let start = 0;
  let end = 0;

  for (let index = 0; index < units.length; index += 1) {
    offsets[index] = totalHeight;
    const height = measuredHeights.get(units[index].key) || units[index].estimatedHeight;
    totalHeight += height;
    if (totalHeight < startPixel) start = index + 1;
    if (offsets[index] <= endPixel) end = index + 1;
  }

  start = Math.min(start, Math.max(0, units.length - 1));
  end = Math.max(start + 1, Math.min(units.length, end));
  const topSpacerHeight = offsets[start] || 0;
  const bottomStart = end < units.length ? offsets[end] : totalHeight;
  return {
    start,
    end,
    topSpacerHeight,
    bottomSpacerHeight: Math.max(0, totalHeight - bottomStart),
    totalHeight,
  };
}

function estimateOffset(units, measuredHeights, endIndex) {
  let offset = 0;
  for (let index = 0; index < endIndex; index += 1) {
    offset += measuredHeights.get(units[index].key) || units[index].estimatedHeight;
  }
  return offset;
}

function estimateTimelineItemHeight(item, startsGroup) {
  let height = DEFAULT_ITEM_HEIGHT + (startsGroup ? DEFAULT_GROUP_LABEL_HEIGHT : 0);
  height += Math.min(72, Math.ceil(String(item.description || "").length / 72) * 18);
  if (item.subtitle) height += 18;
  if (item.meta?.length) height += 28;
  if (item.actions?.length) height += 38;
  if (item.hasCustomContent !== false && item.contentKey) height += 80;
  return height;
}

function getVirtualMeasureKey(item) {
  return `${String(item.id)}::${String(item.contentKey ?? "")}`;
}

function getItemDayKey(item, timeZone) {
  if (!item.timestamp) return "unknown";
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).format(new Date(item.timestamp));
}

// Offsets are relative to the scroll content, not the outer border box. Using
// the latter feeds border/padding offsets back into every programmatic scroll.
function getVirtualContentOrigin(viewport) {
  return viewport.firstElementChild.getBoundingClientRect().top + viewport.scrollTop;
}

function getFirstVisibleVirtualItem(viewport) {
  const viewportRect = viewport.getBoundingClientRect();
  const nodes = Array.from(viewport.querySelectorAll(".ui-timeline-virtual-unit[data-item-id]"));
  const node = nodes.find((candidate) => candidate.getBoundingClientRect().bottom > viewportRect.top + 2);
  return node ? {
    id: node.dataset.itemId || null,
    offset: node.getBoundingClientRect().top - getVirtualContentOrigin(viewport),
  } : null;
}

function findVirtualItemNode(viewport, id) {
  return Array.from(viewport.querySelectorAll(".ui-timeline-virtual-unit[data-item-id]"))
    .find((node) => node.dataset.itemId === String(id)) || null;
}

function normalizeNonNegativeNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : fallback;
}

function normalizeActions(actions) {
  if (!Array.isArray(actions)) {
    return [];
  }
  return actions
    .map((action, index) => {
      if (!action || typeof action !== "object" || !action.label) {
        return null;
      }
      return {
        id: action.id ?? `action-${index}`,
        label: String(action.label),
        className: String(action.className || ""),
      };
    })
    .filter(Boolean);
}

function getCustomMountKey(item) {
  return `${String(item.id)}::${String(item.contentKey ?? "")}`;
}

function shouldIgnoreItemActivation(event) {
  const target = event?.target;
  if (!target || !(target instanceof Element)) {
    return false;
  }
  const customHost = target.closest(".ui-timeline-custom-content");
  if (customHost) {
    return true;
  }
  const interactive = target.closest("button, a, input, select, textarea, summary, [contenteditable='true'], [role='button'], [role='link'], [role='checkbox'], [role='switch'], [role='textbox'], [role='menuitem'], [tabindex]");
  return Boolean(interactive && !interactive.classList?.contains("ui-timeline-item"));
}

function buildItemAriaLabel(item) {
  const parts = [item.title];
  if (item.subtitle) {
    parts.push(item.subtitle);
  }
  if (item.timestamp) {
    parts.push(item.timestamp);
  }
  if (item.description) {
    parts.push(item.description);
  }
  return parts.filter(Boolean).join(". ");
}

function normalizeStatus(status) {
  const value = String(status || "").toLowerCase();
  if (!value) {
    return "";
  }
  const clean = value.replace(/[^a-z0-9_-]/g, "");
  const aliasMap = {
    assigned: "assigned",
    requested: "requested",
    accepted: "accepted",
    en_route: "en_route",
    on_scene: "on_scene",
    completed: "completed",
    cancelled: "cancelled",
    canceled: "cancelled",
    success: "completed",
    warning: "requested",
    error: "cancelled",
    info: "accepted",
  };
  return aliasMap[clean] || clean;
}

function formatTimestamp(value, locale, timeZone, timeOnly = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat(locale, {
    ...(timeOnly ? {} : { month: "short", day: "2-digit", year: "numeric" }),
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(date);
}

function groupItemsByDate(items, locale, timeZone) {
  const byDay = new Map();
  items.forEach((item) => {
    const key = item.timestamp
      ? new Intl.DateTimeFormat("en-CA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone,
      }).format(new Date(item.timestamp))
      : "unknown";
    if (!byDay.has(key)) {
      byDay.set(key, []);
    }
    byDay.get(key).push(item);
  });

  return Array.from(byDay.entries()).map(([key, groupItems]) => ({
    key,
    label: key === "unknown" ? "Undated" : formatGroupLabel(key, locale),
    items: groupItems,
  }));
}

function applyLinkedRange(items, options) {
  if (!options?.linkedRange) {
    return items.slice();
  }
  const anchorMs = resolveRangeAnchorMs(items, options);
  if (!Number.isFinite(anchorMs)) {
    return options.includeUndatedInRange ? items.slice() : [];
  }
  const startMs = options.linkedRange.startMs;
  const endMs = options.linkedRange.endMs;

  return items.filter((item) => {
    if (!item.timestamp) {
      return options.includeUndatedInRange;
    }
    const timestampMs = new Date(item.timestamp).getTime();
    if (!Number.isFinite(timestampMs)) {
      return options.includeUndatedInRange;
    }
    const relativeMs = timestampMs - anchorMs;
    return relativeMs >= startMs && relativeMs <= endMs;
  });
}

function resolveRangeAnchorMs(items, options) {
  const explicitAnchor = Number(options?.linkedRange?.anchorMs);
  if (Number.isFinite(explicitAnchor)) {
    return explicitAnchor;
  }
  let minMs = Infinity;
  items.forEach((item) => {
    if (!item.timestamp) {
      return;
    }
    const timestampMs = new Date(item.timestamp).getTime();
    if (Number.isFinite(timestampMs) && timestampMs < minMs) {
      minMs = timestampMs;
    }
  });
  return Number.isFinite(minMs) ? minMs : NaN;
}

function normalizeLinkedRange(range) {
  if (!range || typeof range !== "object") {
    return null;
  }
  const startRaw = Number(range.startMs);
  const endRaw = Number(range.endMs);
  if (!Number.isFinite(startRaw) || !Number.isFinite(endRaw)) {
    return null;
  }
  let startMs = Math.max(0, Math.round(startRaw));
  let endMs = Math.max(0, Math.round(endRaw));
  if (startMs > endMs) {
    const temp = startMs;
    startMs = endMs;
    endMs = temp;
  }
  const normalized = { startMs, endMs };
  const anchorRaw = Number(range.anchorMs);
  if (Number.isFinite(anchorRaw)) {
    normalized.anchorMs = Math.round(anchorRaw);
  }
  return normalized;
}

function formatGroupLabel(isoDate, locale) {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

function getStatusIconHtml(status) {
  const key = String(status || "").toLowerCase();
  if (!key) {
    return "";
  }
  const common = 'viewBox="0 0 24 24" aria-hidden="true"';
  const icons = {
    assigned: `<svg ${common}><circle cx="12" cy="12" r="5"/></svg>`,
    requested: `<svg ${common}><path d="M12 4v8l5 3"/></svg>`,
    accepted: `<svg ${common}><path d="m5 13 4 4L19 7"/></svg>`,
    en_route: `<svg ${common}><path d="M3 12h8l3-4 7 4h-4l-2 5-3-2-2 2"/></svg>`,
    on_scene: `<svg ${common}><path d="M12 21s-6-5.4-6-10a6 6 0 1 1 12 0c0 4.6-6 10-6 10z"/><circle cx="12" cy="11" r="2.5"/></svg>`,
    completed: `<svg ${common}><path d="m5 13 4 4L19 7"/></svg>`,
    cancelled: `<svg ${common}><path d="M7 7l10 10M17 7 7 17"/></svg>`,
  };
  return icons[key] || "";
}
