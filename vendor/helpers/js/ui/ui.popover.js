import { createElement, clearNode } from "./ui.dom.js";
import { createEventBag } from "./ui.events.js";

const PLACEMENTS = new Set(["bottom-start", "bottom-end", "top-start", "top-end"]);

const DEFAULT_OPTIONS = {
  content: null,
  placement: "bottom-start",
  offset: 8,
  matchTriggerWidth: false,
  panelParent: "body", // body | trigger-parent | HTMLElement | selector
  panelRole: "dialog",
  ariaLabel: "Popover",
  className: "",
  closeOnOutsideClick: true,
  closeOnEscape: true,
  restoreFocus: true,
  initialFocus: "first", // first | panel | false | selector | HTMLElement | function
  onOpenChange: null,
  triggerOnClick: true,
  boundary: null, // optional element limiting the panel within the viewport
};

export function createPopover(triggerEl, options = {}) {
  if (!triggerEl || triggerEl.nodeType !== 1) {
    throw new TypeError("createPopover requires a trigger element.");
  }

  const doc = triggerEl.ownerDocument || document;
  const win = doc.defaultView || window;
  const triggerEvents = createEventBag();
  const globalEvents = createEventBag();
  const panelId = `ui-popover-${Math.random().toString(36).slice(2, 10)}`;
  const originalTriggerAttributes = captureTriggerAttributes(triggerEl);
  let currentOptions = normalizeOptions(options);
  let open = false;
  let destroyed = false;
  let panel = null;
  let contentHost = null;
  let contentRecord = null;
  let actualPlacement = currentOptions.placement;
  let lastFocusedElement = null;
  let api = null;

  function ensurePanel() {
    if (panel) return;
    panel = createElement("div", {
      className: "ui-popover",
      attrs: {
        id: panelId,
        tabindex: "-1",
        "data-ui-popover-id": panelId,
      },
    });
    contentHost = createElement("div", { className: "ui-popover-content" });
    panel.appendChild(contentHost);
    syncPanel();
    mountContent();
  }

  function syncPanel() {
    if (!panel) return;
    panel.className = ["ui-popover", currentOptions.className].filter(Boolean).join(" ");
    panel.setAttribute("role", currentOptions.panelRole);
    panel.setAttribute("aria-label", currentOptions.ariaLabel);
  }

  function mountContent() {
    if (!contentHost) return;
    clearNode(contentHost);
    contentRecord = null;
    const source = currentOptions.content;
    if (source?.nodeType === 1) {
      contentRecord = {
        element: source,
        originalParent: source.parentNode,
        originalNextSibling: source.nextSibling,
        update: null,
        destroy: null,
      };
      contentHost.appendChild(source);
      return;
    }
    if (typeof source !== "function") return;
    const result = source(contentHost, createContentContext());
    contentRecord = normalizeContentRecord(result);
    if (contentRecord.element && !contentRecord.element.parentNode) {
      contentHost.appendChild(contentRecord.element);
    }
  }

  function normalizeContentRecord(result) {
    if (result?.nodeType === 1) {
      return { element: result, update: null, destroy: null };
    }
    if (typeof result === "function") {
      return { element: null, update: null, destroy: result };
    }
    if (result && typeof result === "object") {
      return {
        element: result.element?.nodeType === 1 ? result.element : null,
        update: typeof result.update === "function" ? result.update.bind(result) : null,
        destroy: typeof result.destroy === "function" ? result.destroy.bind(result) : null,
      };
    }
    return { element: null, update: null, destroy: null };
  }

  function destroyContent({ restoreElement = false } = {}) {
    if (!contentRecord) return;
    try {
      contentRecord.destroy?.();
    } finally {
      if (restoreElement && contentRecord.originalParent && contentRecord.element) {
        const sibling = contentRecord.originalNextSibling;
        if (sibling?.parentNode === contentRecord.originalParent) {
          contentRecord.originalParent.insertBefore(contentRecord.element, sibling);
        } else {
          contentRecord.originalParent.appendChild(contentRecord.element);
        }
      }
      contentRecord = null;
    }
  }

  function createContentContext() {
    return {
      popover: api,
      trigger: triggerEl,
      panel,
      contentHost,
      close: (meta) => close(meta),
    };
  }

  function openPopover(meta = {}) {
    if (destroyed || open) return false;
    ensurePanel();
    const parent = resolvePanelParent(currentOptions.panelParent, triggerEl, doc);
    parent.appendChild(panel);
    stampPortalOwners(panel, triggerEl);
    lastFocusedElement = triggerEl;
    open = true;
    triggerEl.setAttribute("aria-expanded", "true");
    panel.classList.remove("is-closing");
    position();
    bindGlobal();
    win.requestAnimationFrame(() => {
      if (!open || destroyed) return;
      panel?.classList.add("is-open");
      focusInitial();
      position();
    });
    emitOpenChange(true, normalizeMeta(meta, "api"));
    return true;
  }

  function close(meta = {}) {
    if (destroyed || !open) return false;
    const closeMeta = normalizeMeta(meta, "api");
    open = false;
    unbindGlobal();
    triggerEl.setAttribute("aria-expanded", "false");
    panel?.classList.remove("is-open");
    panel?.remove();
    if (closeMeta.restoreFocus !== false && currentOptions.restoreFocus) {
      restoreFocus();
    }
    emitOpenChange(false, closeMeta);
    return true;
  }

  function toggle(meta = {}) {
    return open ? close(meta) : openPopover(meta);
  }

  function bindGlobal() {
    globalEvents.clear();
    if (currentOptions.closeOnOutsideClick) {
      globalEvents.on(doc, "mousedown", (event) => {
        if (!open || isInteractionOwned(event.target)) return;
        close({ reason: "outside" });
      });
    }
    if (currentOptions.closeOnEscape) {
      globalEvents.on(doc, "keydown", (event) => {
        if (!open || event.key !== "Escape") return;
        win.queueMicrotask(() => {
          if (!open || event.defaultPrevented || isOwnedPortalTarget(event.target, panelId)) return;
          event.preventDefault();
          close({ reason: "escape" });
        });
      });
    }
    globalEvents.on(win, "resize", position);
    globalEvents.on(win, "scroll", position, true);
    if (win.visualViewport) {
      globalEvents.on(win.visualViewport, "resize", position);
      globalEvents.on(win.visualViewport, "scroll", position);
    }
  }

  function unbindGlobal() {
    globalEvents.clear();
  }

  function isInteractionOwned(target) {
    if (!target || typeof target.closest !== "function") return false;
    return Boolean(triggerEl.contains(target) || panel?.contains(target) || isOwnedPortalTarget(target, panelId));
  }

  function position() {
    if (!open || !panel?.isConnected) return;
    const triggerRect = triggerEl.getBoundingClientRect();
    const viewport = win.visualViewport;
    let viewportWidth = viewport?.width || doc.documentElement.clientWidth || win.innerWidth;
    let viewportHeight = viewport?.height || doc.documentElement.clientHeight || win.innerHeight;
    let viewportLeft = viewport?.offsetLeft || 0;
    let viewportTop = viewport?.offsetTop || 0;
    const boundary = currentOptions.boundary?.getBoundingClientRect?.();
    if (boundary) {
      const right = Math.min(viewportLeft + viewportWidth, boundary.right);
      const bottom = Math.min(viewportTop + viewportHeight, boundary.bottom);
      viewportLeft = Math.max(viewportLeft, boundary.left);
      viewportTop = Math.max(viewportTop, boundary.top);
      viewportWidth = Math.max(0, right - viewportLeft);
      viewportHeight = Math.max(0, bottom - viewportTop);
    }
    const margin = 8;
    const gap = currentOptions.offset;

    panel.style.width = currentOptions.matchTriggerWidth ? `${Math.round(triggerRect.width)}px` : "";
    panel.style.minWidth = currentOptions.matchTriggerWidth ? `${Math.min(Math.round(triggerRect.width), Math.max(0, viewportWidth - margin * 2))}px` : boundary ? "0px" : "";
    panel.style.maxWidth = `${Math.max(boundary ? 0 : 120, Math.round(viewportWidth - margin * 2))}px`;
    panel.style.maxHeight = "";
    panel.style.left = "0px";
    panel.style.top = "0px";

    const measured = panel.getBoundingClientRect();
    const panelWidth = panel.offsetWidth || measured.width;
    const panelHeight = panel.offsetHeight || measured.height;
    const preferred = currentOptions.placement;
    const wantsTop = preferred.startsWith("top");
    const spaceBelow = viewportTop + viewportHeight - triggerRect.bottom - gap - margin;
    const spaceAbove = triggerRect.top - viewportTop - gap - margin;
    const useTop = wantsTop
      ? !(panelHeight > spaceAbove && spaceBelow > spaceAbove)
      : panelHeight > spaceBelow && spaceAbove > spaceBelow;
    actualPlacement = `${useTop ? "top" : "bottom"}-${preferred.endsWith("end") ? "end" : "start"}`;
    const availableHeight = Math.max(boundary ? 0 : 80, useTop ? spaceAbove : spaceBelow);
    panel.style.maxHeight = `${Math.round(availableHeight)}px`;

    let left = preferred.endsWith("end") ? triggerRect.right - panelWidth : triggerRect.left;
    const minLeft = viewportLeft + margin;
    const maxLeft = viewportLeft + viewportWidth - panelWidth - margin;
    left = Math.max(minLeft, Math.min(left, Math.max(minLeft, maxLeft)));
    const top = useTop
      ? triggerRect.top - Math.min(panelHeight, availableHeight) - gap
      : triggerRect.bottom + gap;
    const minTop = viewportTop + margin;
    const maxTop = viewportTop + viewportHeight - Math.min(panelHeight, availableHeight) - margin;
    panel.style.left = `${Math.round(left)}px`;
    panel.style.top = `${Math.round(Math.max(minTop, Math.min(top, Math.max(minTop, maxTop))))}px`;
    panel.dataset.placement = actualPlacement;
  }

  function focusInitial() {
    const target = resolveInitialFocus(currentOptions.initialFocus, panel, contentHost);
    target?.focus?.();
  }

  function restoreFocus() {
    const target = lastFocusedElement?.isConnected ? lastFocusedElement : triggerEl;
    target?.focus?.();
    lastFocusedElement = null;
  }

  function emitOpenChange(nextOpen, meta) {
    currentOptions.onOpenChange?.(nextOpen, {
      ...meta,
      placement: actualPlacement,
      refs: getRefs(),
    });
  }

  function update(nextOptions = {}) {
    if (destroyed || !nextOptions || typeof nextOptions !== "object") return;
    const contentChanged = Object.prototype.hasOwnProperty.call(nextOptions, "content")
      && nextOptions.content !== currentOptions.content;
    currentOptions = normalizeOptions({ ...currentOptions, ...nextOptions });
    if (panel) {
      syncPanel();
      if (contentChanged) {
        destroyContent({ restoreElement: true });
        mountContent();
      } else {
        contentRecord?.update?.(currentOptions, createContentContext());
      }
    }
    triggerEl.setAttribute("aria-haspopup", currentOptions.panelRole);
    if (open) {
      const parent = resolvePanelParent(currentOptions.panelParent, triggerEl, doc);
      if (panel.parentNode !== parent) parent.appendChild(panel);
      stampPortalOwners(panel, triggerEl);
      position();
    }
  }

  function getRefs() {
    return { trigger: triggerEl, panel, contentHost };
  }

  function getState() {
    return {
      open,
      placement: actualPlacement,
      preferredPlacement: currentOptions.placement,
      options: { ...currentOptions },
      refs: getRefs(),
    };
  }

  function destroy() {
    if (destroyed) return;
    if (open) close({ reason: "destroy", restoreFocus: false });
    destroyed = true;
    triggerEvents.clear();
    unbindGlobal();
    destroyContent({ restoreElement: true });
    panel?.remove();
    restoreTriggerAttributes(triggerEl, originalTriggerAttributes);
    panel = null;
    contentHost = null;
    lastFocusedElement = null;
  }

  triggerEl.setAttribute("aria-haspopup", currentOptions.panelRole);
  triggerEl.setAttribute("aria-expanded", "false");
  triggerEl.setAttribute("aria-controls", panelId);
  triggerEvents.on(triggerEl, "click", (event) => {
    if (!currentOptions.triggerOnClick) return;
    event.preventDefault();
    toggle({ reason: "trigger" });
  });

  api = { open: openPopover, close, toggle, update, destroy, getState, getRefs, position };
  return api;
}

function normalizeOptions(options) {
  const next = { ...DEFAULT_OPTIONS, ...(options || {}) };
  next.placement = PLACEMENTS.has(String(next.placement)) ? String(next.placement) : DEFAULT_OPTIONS.placement;
  next.offset = Math.max(0, Number.isFinite(Number(next.offset)) ? Number(next.offset) : DEFAULT_OPTIONS.offset);
  next.matchTriggerWidth = Boolean(next.matchTriggerWidth);
  next.panelRole = String(next.panelRole || DEFAULT_OPTIONS.panelRole);
  next.ariaLabel = String(next.ariaLabel || DEFAULT_OPTIONS.ariaLabel);
  next.className = String(next.className || "").trim();
  next.closeOnOutsideClick = next.closeOnOutsideClick !== false;
  next.closeOnEscape = next.closeOnEscape !== false;
  next.restoreFocus = next.restoreFocus !== false;
  next.onOpenChange = typeof next.onOpenChange === "function" ? next.onOpenChange : null;
  return next;
}

function resolvePanelParent(value, trigger, doc) {
  if (value === false || value === "trigger-parent" || value === "parent") {
    return trigger.parentElement || doc.body || doc.documentElement;
  }
  if (value?.nodeType === 1) return value;
  if (typeof value === "string" && value !== "body") {
    try {
      return doc.querySelector(value) || doc.body || doc.documentElement;
    } catch {
      return doc.body || doc.documentElement;
    }
  }
  return doc.body || doc.documentElement;
}

function resolveInitialFocus(value, panel, contentHost) {
  if (value === false || !panel) return null;
  if (value?.nodeType === 1) return value;
  if (typeof value === "function") return value({ panel, contentHost }) || null;
  if (typeof value === "string" && value !== "first" && value !== "panel") {
    return panel.querySelector(value) || panel;
  }
  if (value === "panel") return panel;
  return panel.querySelector([
    "button:not([disabled])",
    "[href]",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ].join(",")) || panel;
}

function stampPortalOwners(panel, trigger) {
  const ownerModal = trigger.closest?.("[data-ui-modal-id]");
  if (ownerModal?.dataset?.uiModalId) {
    panel.dataset.uiModalPortalOwner = ownerModal.dataset.uiModalId;
  } else {
    delete panel.dataset.uiModalPortalOwner;
  }
}

function isOwnedPortalTarget(target, panelId) {
  const portal = target?.closest?.("[data-ui-popover-portal-owner]");
  return portal?.dataset?.uiPopoverPortalOwner === panelId;
}

function captureTriggerAttributes(trigger) {
  return ["aria-haspopup", "aria-expanded", "aria-controls"].reduce((result, name) => {
    result[name] = trigger.hasAttribute(name) ? trigger.getAttribute(name) : null;
    return result;
  }, {});
}

function restoreTriggerAttributes(trigger, attributes) {
  Object.entries(attributes).forEach(([name, value]) => {
    if (value == null) trigger.removeAttribute(name);
    else trigger.setAttribute(name, value);
  });
}

function normalizeMeta(meta, fallbackReason) {
  if (typeof meta === "string") return { reason: meta };
  return { reason: fallbackReason, ...(meta || {}) };
}
