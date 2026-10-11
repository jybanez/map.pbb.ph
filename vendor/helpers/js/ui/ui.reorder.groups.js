import { createElement } from "./ui.dom.js";

let instance = 0;
export function createReorderGroups(host, initialGroups = [], options = {}) {
  if (!host?.appendChild) throw new TypeError("Grouped reorder requires a host element.");
  let groups = normalize(initialGroups), opts = { ...options }, drag = null, destroyed = false, interactionLocked = false, building = false, lockFocus = null;
  const rows = new Map(), sections = new Map();
  const root = createElement("div", { className: "ui-reorder-groups" });
  const help = createElement("p", { className: "ui-reorder-help", text: "Space to pick up or drop. Up/Down to move. Left/Right to change group. Escape to cancel.", attrs: { id: `ui-reorder-help-${++instance}` } });
  const groupHelp = createElement("p", { className: "ui-reorder-live", text: "Space or Enter to pick up or drop a group. Up/Down to move. Escape to cancel.", attrs: { id: `${help.id}-groups` } });
  const live = createElement("div", { className: "ui-reorder-live", attrs: { role: "status", "aria-live": "polite" } });
  root.append(help, groupHelp, live); host.appendChild(root);
  const snapshot = () => groups.map(g => ({ ...g, items: g.items.map(i => ({ ...i })) }));
  const locate = id => { for (const g of groups) { const index = g.items.findIndex(i => i.id === String(id)); if (index >= 0) return { group: g, index, item: g.items[index] }; } return null; };
  const blocked = id => { const loc = locate(id); return destroyed || interactionLocked || opts.disabled || opts.readOnly || !loc || loc.group.disabled || loc.item.disabled || rows.get(String(id))?.node.querySelector('[data-inline-active="true"]') || opts.isItemLocked?.(loc.item, loc.group); };
  const groupBlocked = id => {
    const group = groups.find(g => g.id === String(id));
    return destroyed || interactionLocked || opts.disabled || opts.readOnly || !opts.reorderGroups || !group || group.disabled
      || sections.get(String(id))?.section.querySelector('[data-inline-active="true"]') || opts.isGroupLocked?.(group);
  };
  const dragBlocked = d => d.kind === "group" ? groupBlocked(d.id) : blocked(d.id);
  const dragRecord = d => d.kind === "group" ? sections.get(d.id) : rows.get(d.id);
  function syncHandles() {
    if (building || destroyed) return;
    if (drag && dragBlocked(drag)) finish(false);
    rows.forEach((record, id) => { record.handle.disabled = Boolean(blocked(id)); });
    sections.forEach((record, id) => { if (record.handle) record.handle.disabled = Boolean(groupBlocked(id)); });
  }
  function build() {
    building = true;
    rows.forEach(r => r.cleanup?.()); sections.forEach(s => s.cleanup?.()); rows.clear(); sections.clear();
    root.querySelectorAll(".ui-reorder-group").forEach(n => n.remove());
    for (const g of groups) {
      const section = createElement("section", { className: "ui-reorder-group", attrs: { "data-group-id": g.id, "aria-label": g.label || g.id } });
      const title = createElement("h3", { text: g.label || g.id });
      const list = createElement("div", { className: "ui-reorder-list", attrs: { role: "list", "aria-label": g.label || g.id } });
      const empty = createElement("div", { className: "ui-reorder-empty", text: opts.emptyText || "Drop an item here" });
      const header = createElement("div", { className: "ui-reorder-group-header" });
      let handle = null;
      if (opts.reorderGroups) {
        handle = createElement("button", { className: "ui-reorder-handle ui-reorder-group-handle", text: "⠿", attrs: { type: "button", "aria-label": `Move group ${g.label || g.id}`, "aria-describedby": groupHelp.id, "aria-pressed": "false" } });
        header.append(handle);
        handle.addEventListener("keydown", e => groupKeyboard(e, g.id));
        handle.addEventListener("pointerdown", e => pointerStart(e, g.id, "group"));
      }
      const content = createElement("div", { className: "ui-reorder-group-content" });
      header.append(content); section.append(header, list, empty); root.append(section);
      const result = opts.renderGroupHeader?.(content, g, { groupId: g.id, index: groups.indexOf(g) });
      if (!opts.renderGroupHeader) content.append(title);
      if (!opts.reorderGroups && !opts.renderGroupHeader) header.replaceWith(title);
      sections.set(g.id, { section, node: section, handle, list, empty, title: opts.renderGroupHeader ? null : title, cleanup: typeof result === "function" ? result : result?.destroy?.bind(result) });
      for (const item of g.items) {
        const node = createElement("div", { className: "ui-reorder-row", attrs: { role: "listitem", "data-item-id": item.id } });
        const handle = createElement("button", { className: "ui-reorder-handle", text: "⠿", attrs: { type: "button", "aria-label": `Move ${item.label || item.id}`, "aria-describedby": help.id, "aria-pressed": "false" } });
        const content = createElement("div", { className: "ui-reorder-content" });
        node.append(handle, content); list.append(node);
        const result = opts.renderItem?.(content, item, { groupId: g.id });
        if (!opts.renderItem) content.textContent = item.label || item.id;
        rows.set(item.id, { node, handle, labelContent: opts.renderItem ? null : content, cleanup: typeof result === "function" ? result : result?.destroy?.bind(result) });
        handle.addEventListener("keydown", e => keyboard(e, item.id));
        handle.addEventListener("pointerdown", e => pointerStart(e, item.id));
      }
    }
    building = false;
    syncOrder(); syncHandles(); syncInteractionLock();
  }
  function syncOrder() {
    let previous = live;
    for (const [groupIndex, g] of groups.entries()) {
      const record = sections.get(g.id);
      if (previous.nextElementSibling !== record.section) root.insertBefore(record.section, previous.nextElementSibling);
      previous = record.section;
      syncGroupLabel(g, groupIndex);
      const section = sections.get(g.id);
      g.items.forEach((item, index) => {
        const row = rows.get(item.id).node;
        if (section.list.children[index] !== row) section.list.insertBefore(row, section.list.children[index] || null);
        row.setAttribute("aria-posinset", String(index + 1)); row.setAttribute("aria-setsize", String(g.items.length));
      });
      section.empty.hidden = g.items.length > 0;
    }
  }
  function syncGroupLabel(group, index) {
    const record = sections.get(group.id), label = group.label || group.id;
    record.section.setAttribute("aria-label", label);
    record.list.setAttribute("aria-label", label);
    if (record.handle) record.handle.setAttribute("aria-label", `Move group ${label}, ${index + 1} of ${groups.length}`);
    if (record.title) record.title.textContent = label;
  }
  function setItemLabel(id, label) {
    if (destroyed) return false;
    const loc = locate(id);
    if (!loc) return false;
    loc.item.label = String(label ?? "");
    const record = rows.get(loc.item.id), name = loc.item.label || loc.item.id;
    record.handle.setAttribute("aria-label", `Move ${name}`);
    if (record.labelContent) record.labelContent.textContent = name;
    return true;
  }
  function setGroupLabel(id, label) {
    if (destroyed) return false;
    const index = groups.findIndex(group => group.id === String(id));
    if (index < 0) return false;
    groups[index].label = String(label ?? "");
    syncGroupLabel(groups[index], index);
    return true;
  }
  function start(id, mode) {
    if (drag || blocked(id)) return false;
    const loc = locate(id); drag = { kind: "item", id, mode, before: snapshot(), fromGroupId: loc.group.id, fromIndex: loc.index, targetGroupId: loc.group.id, targetIndex: loc.index };
    rows.get(id).node.classList.add("is-picked-up"); rows.get(id).handle.setAttribute("aria-pressed", "true");
    live.textContent = `Picked up ${loc.item.label || id}.`; return true;
  }
  function preview(groupId, index) {
    const group = groups.find(g => g.id === groupId);
    if (!drag || !group || group.disabled || blocked(drag.id)) return;
    drag.targetGroupId = groupId; drag.targetIndex = index;
    root.querySelectorAll(".is-insertion-before,.is-insertion-end").forEach(n => n.classList.remove("is-insertion-before", "is-insertion-end"));
    const candidates = group.items.filter(i => i.id !== drag.id);
    if (!drag.placeholder) {
      drag.placeholder = createElement("div", { className: "ui-reorder-placeholder", attrs: { "aria-hidden": "true" } });
      drag.placeholder.style.height = `${rows.get(drag.id).node.getBoundingClientRect().height}px`;
    }
    const list = sections.get(groupId).list;
    const before = candidates[index] ? rows.get(candidates[index].id).node : null;
    if (drag.placeholder.parentNode !== list || drag.placeholder.nextSibling !== before) list.insertBefore(drag.placeholder, before);
    sections.forEach((s, id) => { s.empty.hidden = id === groupId || groups.find(g => g.id === id).items.length > 0; });
    if (candidates[index]) rows.get(candidates[index].id).node.classList.add("is-insertion-before");
    else sections.get(groupId).section.classList.add("is-insertion-end");
    live.textContent = `Move to ${group.label || group.id}, position ${index + 1}.`;
  }
  function startGroup(id, mode) {
    if (drag || groupBlocked(id)) return false;
    const index = groups.findIndex(g => g.id === id);
    drag = { kind: "group", id, mode, before: snapshot(), fromIndex: index, targetIndex: index };
    const record = sections.get(id);
    record.section.classList.add("is-picked-up"); record.handle.setAttribute("aria-pressed", "true");
    live.textContent = `Picked up group ${groups[index].label || id}. Use Up/Down to move; Space or Enter to drop; Escape to cancel.`;
    return true;
  }
  function previewGroup(index) {
    if (!drag || drag.kind !== "group" || groupBlocked(drag.id)) return;
    const candidates = groups.filter(g => g.id !== drag.id);
    drag.targetIndex = Math.max(0, Math.min(index, candidates.length));
    if (!drag.placeholder) {
      drag.placeholder = createElement("div", { className: "ui-reorder-placeholder", attrs: { "aria-hidden": "true" } });
      drag.placeholder.style.height = `${sections.get(drag.id).section.getBoundingClientRect().height}px`;
    }
    const before = candidates[drag.targetIndex] ? sections.get(candidates[drag.targetIndex].id).section : null;
    if (drag.placeholder.parentNode !== root || drag.placeholder.nextSibling !== before) root.insertBefore(drag.placeholder, before);
    live.textContent = `Move group ${groups.find(g => g.id === drag.id).label || drag.id} to position ${drag.targetIndex + 1} of ${groups.length}.`;
  }
  function groupKeyboard(e, id) {
    if (e.key === "Escape" && drag?.kind === "group" && drag.id === id) { e.preventDefault(); finish(false); return; }
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); if (drag?.kind === "group" && drag.id === id) finish(true); else startGroup(id, "keyboard"); return; }
    if (drag?.kind !== "group" || drag.id !== id || drag.mode !== "keyboard" || !["ArrowUp", "ArrowDown"].includes(e.key)) return;
    e.preventDefault(); previewGroup(drag.targetIndex + (e.key === "ArrowDown" ? 1 : -1));
  }
  function finish(commit) {
    if (!drag) return false;
    const d = drag; drag = null;
    d.ghost?.remove(); d.placeholder?.remove();
    sections.forEach((s, id) => { s.empty.hidden = groups.find(g => g.id === id).items.length > 0; });
    const record = dragRecord(d);
    record?.node.classList.remove("is-picked-up"); record?.handle.setAttribute("aria-pressed", "false");
    root.querySelectorAll(".is-insertion-before,.is-insertion-end").forEach(n => n.classList.remove("is-insertion-before", "is-insertion-end"));
    host.ownerDocument.removeEventListener("pointermove", pointerMove); host.ownerDocument.removeEventListener("pointerup", pointerEnd); host.ownerDocument.removeEventListener("pointercancel", pointerCancel);
    host.ownerDocument.removeEventListener("keydown", pointerKey);
    host.ownerDocument.defaultView.removeEventListener("blur", pointerCancel);
    if (d.pointerId != null && record?.handle.hasPointerCapture?.(d.pointerId)) record.handle.releasePointerCapture(d.pointerId);
    if (!commit || dragBlocked(d)) { live.textContent = "Move cancelled."; return false; }
    if (d.kind === "group") {
      const fromIndex = groups.findIndex(g => g.id === d.id), toIndex = d.targetIndex;
      if (fromIndex === toIndex) { live.textContent = "Group order unchanged."; return false; }
      const [group] = groups.splice(fromIndex, 1); groups.splice(toIndex, 0, group);
      syncOrder(); record.handle.focus({ preventScroll: true });
      live.textContent = `Moved group ${group.label || d.id} to position ${toIndex + 1} of ${groups.length}.`;
      opts.onGroupReorder?.({ groupId: d.id, fromIndex, toIndex, orderedGroupIds: groups.map(g => g.id), previousGroups: d.before, groups: snapshot() });
      return true;
    }
    const from = locate(d.id), to = groups.find(g => g.id === d.targetGroupId);
    if (!to || to.disabled) return false;
    const index = Math.max(0, Math.min(d.targetIndex, to.items.length - (to === from.group ? 1 : 0)));
    if (to === from.group && index === from.index) { live.textContent = "Order unchanged."; return false; }
    from.group.items.splice(from.index, 1); to.items.splice(index, 0, from.item); syncOrder(); record.handle.focus({ preventScroll: true });
    const affected = [...new Set([from.group.id, to.id])];
    live.textContent = `Moved ${from.item.label || d.id} to ${to.label || to.id}, position ${index + 1}.`;
    opts.onReorder?.({ itemId: d.id, fromGroupId: from.group.id, fromIndex: from.index, toGroupId: to.id, toIndex: index, orderedIdsByGroup: Object.fromEntries(affected.map(id => [id, groups.find(g => g.id === id).items.map(i => i.id)])), previousGroups: d.before, groups: snapshot() });
    return true;
  }
  function keyboard(e, id) {
    if (e.key === "Escape" && drag?.kind === "item" && drag.id === id) { e.preventDefault(); finish(false); return; }
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); if (drag?.kind === "item" && drag.id === id) finish(true); else start(id, "keyboard"); return; }
    if (drag?.kind !== "item" || drag.id !== id || drag.mode !== "keyboard" || !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
    e.preventDefault(); let g = groups.find(x => x.id === drag.targetGroupId), index = drag.targetIndex;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      const available = groups.filter(x => !x.disabled), at = available.indexOf(g);
      g = available[Math.max(0, Math.min(available.length - 1, at + (e.key === "ArrowRight" ? 1 : -1)))]; index = 0;
    } else index += e.key === "ArrowDown" ? 1 : -1;
    preview(g.id, Math.max(0, Math.min(index, g.items.filter(i => i.id !== id).length)));
  }
  function pointerStart(e, id, kind = "item") {
    if (e.button !== 0 || e.isPrimary === false || !(kind === "group" ? startGroup(id, "pointer") : start(id, "pointer"))) return;
    e.preventDefault(); drag.pointerId = e.pointerId;
    const record = dragRecord(drag), row = record.node, rect = row.getBoundingClientRect();
    const ghost = row.cloneNode(true);
    ghost.classList.add("ui-reorder-ghost"); ghost.classList.remove("is-picked-up");
    ghost.inert = true; ghost.setAttribute("aria-hidden", "true");
    for (const node of [ghost, ...ghost.querySelectorAll("*")]) {
      for (const attr of ["id", "name", "data-item-id", "data-group-id", "aria-describedby", "aria-controls", "aria-labelledby"]) node.removeAttribute(attr);
    }
    const style = host.ownerDocument.defaultView.getComputedStyle(row);
    for (const property of style) if (property.startsWith("--ui-")) ghost.style.setProperty(property, style.getPropertyValue(property));
    ghost.style.font = style.font; ghost.style.color = style.color;
    ghost.style.width = `${rect.width}px`;
    drag.ghost = ghost; drag.offsetX = e.clientX - rect.left; drag.offsetY = e.clientY - rect.top;
    host.ownerDocument.body.appendChild(ghost);
    positionGhost(e);
    record.handle.focus({ preventScroll: true });
    record.handle.setPointerCapture?.(e.pointerId);
    const doc = host.ownerDocument;
    doc.addEventListener("pointermove", pointerMove); doc.addEventListener("pointerup", pointerEnd); doc.addEventListener("pointercancel", pointerCancel); doc.defaultView.addEventListener("blur", pointerCancel);
    doc.addEventListener("keydown", pointerKey);
  }
  function pointerMove(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    e.preventDefault(); positionGhost(e);
    if (drag.kind === "group") {
      const hit = host.ownerDocument.elementFromPoint(e.clientX, e.clientY);
      drag.overTarget = Boolean(hit && root.contains(hit));
      if (!drag.overTarget) { drag.placeholder?.remove(); return; }
      const gap = drag.placeholder?.getBoundingClientRect();
      if (drag.placeholder?.isConnected && e.clientY >= gap.top && e.clientY <= gap.bottom) return;
      const candidates = groups.filter(g => g.id !== drag.id);
      const at = candidates.findIndex(g => { const rect = sections.get(g.id).section.getBoundingClientRect(); return e.clientY < rect.top + rect.height / 2; });
      previewGroup(at < 0 ? candidates.length : at); return;
    }
    const hit = host.ownerDocument.elementFromPoint(e.clientX, e.clientY)?.closest(".ui-reorder-group");
    if (!hit || !root.contains(hit) || groups.find(g => g.id === hit.dataset.groupId)?.disabled) {
      drag.overTarget = false; drag.placeholder?.remove();
      sections.forEach((s, id) => { s.empty.hidden = groups.find(g => g.id === id).items.length > 0; });
      root.querySelectorAll(".is-insertion-before,.is-insertion-end").forEach(n => n.classList.remove("is-insertion-before", "is-insertion-end"));
      return;
    }
    const g = groups.find(g => g.id === hit.dataset.groupId); drag.overTarget = !g.disabled;
    const gap = drag.placeholder?.getBoundingClientRect();
    if (drag.placeholder?.isConnected && hit.dataset.groupId === drag.targetGroupId && e.clientY >= gap.top && e.clientY <= gap.bottom) return;
    const candidates = g.items.filter(i => i.id !== drag.id);
    const at = candidates.findIndex(i => { const rect = rows.get(i.id).node.getBoundingClientRect(); return e.clientY < rect.top + rect.height / 2; });
    preview(g.id, at < 0 ? candidates.length : at);
  }
  function positionGhost(e) {
    if (!drag?.ghost) return;
    drag.ghost.style.left = `${e.clientX - drag.offsetX}px`;
    drag.ghost.style.top = `${e.clientY - drag.offsetY}px`;
  }
  function pointerEnd(e) { if (drag?.pointerId === e.pointerId) finish(Boolean(drag.overTarget)); }
  function pointerCancel() { finish(false); }
  function pointerKey(e) { if (e.key === "Escape" && drag?.mode === "pointer") { e.preventDefault(); finish(false); } }
  function syncInteractionLock() {
    root.inert = interactionLocked;
    root.setAttribute("aria-busy", String(interactionLocked));
    root.querySelectorAll(".ui-inline").forEach(editor => editor.dispatchEvent(new CustomEvent("ui:interaction-lock", { detail: { locked: interactionLocked } })));
  }
  function setInteractionLocked(locked) {
    if (destroyed) return;
    const next = Boolean(locked);
    if (next === interactionLocked) return;
    if (next) lockFocus = root.contains(host.ownerDocument.activeElement) ? host.ownerDocument.activeElement : null;
    interactionLocked = next;
    if (interactionLocked) finish(false);
    syncInteractionLock(); syncHandles();
    if (!next) {
      if (lockFocus?.isConnected && host.ownerDocument.activeElement === host.ownerDocument.body && !lockFocus.disabled) lockFocus.focus({ preventScroll: true });
      lockFocus = null;
    }
  }
  root.addEventListener("ui:inline-state", syncHandles);
  root.addEventListener("lostpointercapture", () => { if (drag?.mode === "pointer") finish(false); });
  build();
  return {
    getState: () => ({ groups: snapshot(), interactionLocked, dragging: drag ? (drag.kind === "group" ? { kind: "group", groupId: drag.id, index: drag.targetIndex } : { itemId: drag.id, groupId: drag.targetGroupId, index: drag.targetIndex }) : null }),
    setInteractionLocked,
    setGroupLabel,
    setItemLabel,
    cancel: () => finish(false),
    update(nextGroups = groups, nextOptions = {}) { if (destroyed) return; const checked = normalize(nextGroups); finish(false); groups = checked; opts = { ...opts, ...nextOptions }; build(); },
    setItemLocked(id, locked) { const loc = locate(id); if (!loc) return; loc.item.disabled = Boolean(locked); syncHandles(); },
    destroy() { if (destroyed) return; finish(false); destroyed = true; root.removeEventListener("ui:inline-state", syncHandles); rows.forEach(r => r.cleanup?.()); sections.forEach(s => s.cleanup?.()); root.remove(); rows.clear(); sections.clear(); },
  };
}

function normalize(groups) {
  const groupIds = new Set(), itemIds = new Set();
  if (!Array.isArray(groups)) throw new TypeError("groups must be an array.");
  return groups.map(g => {
    if (g?.id == null || groupIds.has(String(g.id))) throw new TypeError("Groups require unique stable ids.");
    groupIds.add(String(g.id));
    return { ...g, id: String(g.id), items: (g.items || []).map(i => {
      if (i?.id == null || itemIds.has(String(i.id))) throw new TypeError("Items require globally unique stable ids.");
      itemIds.add(String(i.id)); return { ...i, id: String(i.id) };
    }) };
  });
}
