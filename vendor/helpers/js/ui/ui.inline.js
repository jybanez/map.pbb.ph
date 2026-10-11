import { createElement } from "./ui.dom.js";
import { setFieldError } from "./ui.field.error.js";
import { createIcon } from "./ui.icons.js";
import { createSelect } from "./ui.select.js";
import { createPopover } from "./ui.popover.js?v=0.21.215";
import { createDatepicker } from "./ui.datepicker.js?v=0.21.204";
import { parseCivil } from "./ui.datepicker.civil.js?v=0.21.191";

export const createInlineText = (host, options = {}) => createInline(host, options, "text");
export const createInlineSelect = (host, options = {}) => createInline(host, options, "select");
export const createInlineDate = (host, options = {}) => createInline(host, options, "date");

function createInline(host, options, kind) {
  if (!host?.appendChild) throw new TypeError("Inline editor requires a host element.");
  let opts = { label: "Value", value: null, placeholder: "Not set", valueMode: "wall-clock", showTime: false, actionsPlacement: "below", ...options };
  let value = opts.value, draft = value, phase = "view", error = "", destroyed = false, generation = 0, control = null, input = null, interactionLocked = false;
  const root = createElement("div", { className: `ui-inline ui-inline-${kind}` });
  const view = createElement("button", { className: "ui-inline-view", attrs: { type: "button" } });
  const editor = createElement("div", { className: "ui-inline-editor" });
  const field = createElement("div", { className: "ui-inline-field" });
  const feedback = createElement("p", { attrs: { role: "alert" } });
  const status = createElement("span", { className: "ui-inline-status", attrs: { role: "status" } });
  const saveButton = createElement("button", { className: "ui-inline-action", attrs: { type: "button", "aria-label": "Save", title: "Save" } });
  const cancelButton = createElement("button", { className: "ui-inline-action", attrs: { type: "button", "aria-label": "Cancel", title: "Cancel" } });
  saveButton.appendChild(createIcon("actions.check"));
  cancelButton.appendChild(createIcon("actions.close"));
  const actions = createElement("div", { className: "ui-inline-actions" });
  actions.append(status, saveButton, cancelButton);
  editor.append(field, feedback, actions);
  root.append(view, editor); host.appendChild(root);
  const target = () => field.querySelector("input,textarea,button");
  const active = () => phase !== "view";
  const locked = () => interactionLocked || opts.disabled || opts.readOnly || opts.readonly;
  const doc = host.ownerDocument, win = doc.defaultView;
  let actionPopover = null, actualPlacement = "below";
  function clearPopover() {
    const focused = actions.contains(doc.activeElement) ? doc.activeElement : null;
    actionPopover?.destroy(); actionPopover = null;
    if (active() && focused?.isConnected) focused.focus({ preventScroll: true });
  }
  function layoutActions() {
    if (destroyed) return;
    const requested = ["inline", "overlay"].includes(opts.actionsPlacement) ? opts.actionsPlacement : "below";
    const boundary = root.closest(".ui-modal");
    const viewport = win.visualViewport;
    const availableWidth = Math.min(viewport?.width || win.innerWidth, boundary?.clientWidth || Infinity);
    const availableHeight = Math.min(viewport?.height || win.innerHeight, boundary?.clientHeight || Infinity);
    actualPlacement = requested === "inline" && root.clientWidth < 280 || requested === "overlay" && (availableWidth < 360 || availableHeight < 180) ? "below" : requested;
    root.dataset.actionsPlacement = actualPlacement;
    if (!active() || !root.getClientRects().length || actualPlacement !== "overlay") { clearPopover(); return; }
    if (!actionPopover) {
      const focused = actions.contains(doc.activeElement) ? doc.activeElement : null;
      actionPopover = createPopover(field, {
        content: actions, placement: "bottom-end", offset: 4, boundary,
        triggerOnClick: false, initialFocus: false, restoreFocus: false,
        closeOnEscape: false, closeOnOutsideClick: false,
        panelRole: "group", ariaLabel: `${opts.label} actions`, className: "ui-inline-actions-popover"
      });
      actionPopover.open();
      focused?.focus({ preventScroll: true });
    } else actionPopover.position();
  }
  const resizeObserver = new win.ResizeObserver(layoutActions);
  resizeObserver.observe(root);
  win.addEventListener("resize", layoutActions);
  win.visualViewport?.addEventListener("resize", layoutActions);
  function display() {
    if (typeof opts.formatValue === "function") return opts.formatValue(value);
    if (value == null || value === "") return opts.placeholder;
    if (kind === "select") return opts.items?.find(item => String(item.id ?? item.value ?? item) === String(value))?.label ?? String(value);
    return String(value);
  }
  function sync() {
    root.dataset.inlineActive = String(active());
    root.dataset.state = opts.disabled ? "disabled" : (opts.readOnly || opts.readonly) ? "readonly" : phase;
    root.setAttribute("aria-busy", String(phase === "saving"));
    view.hidden = active(); editor.hidden = !active();
    view.textContent = display(); view.disabled = Boolean(opts.disabled);
    view.setAttribute("aria-label", `${opts.label}: ${display()}${locked() ? "" : ". Edit"}`);
    view.setAttribute("aria-disabled", String(Boolean(locked())));
    saveButton.disabled = cancelButton.disabled = phase === "saving" || interactionLocked;
    field.inert = phase === "saving" || interactionLocked;
    actions.inert = interactionLocked;
    status.textContent = phase === "saving" ? "Saving…" : "";
    setFieldError(target(), feedback, error);
    layoutActions();
    root.dispatchEvent(new CustomEvent("ui:inline-state", { bubbles: true, detail: getState() }));
    opts.onStateChange?.(getState());
  }
  function changed(next) {
    if (phase === "saving" || interactionLocked || destroyed) return;
    draft = next; error = ""; phase = "edit";
    // Canonical select/date controls rerender their trigger after onChange.
    queueMicrotask(() => { if (!destroyed && active()) sync(); });
  }
  function mount() {
    control?.destroy(); control = null; input = null; field.replaceChildren();
    if (kind === "text") {
      input = createElement(opts.multiline ? "textarea" : "input", { className: "ui-input", attrs: { "aria-label": opts.label, placeholder: opts.placeholder } });
      input.value = draft ?? ""; input.addEventListener("input", () => changed(input.value)); field.append(input);
    } else if (kind === "select") {
      control = createSelect(field, opts.items || [], { ariaLabel: opts.label, placeholder: opts.placeholder, searchable: opts.searchable !== false, clearable: false, selected: draft == null ? [] : [draft], onChange: changed });
    } else {
      control = createDatepicker(field, { ...opts, mode: "single", value: draft, ariaLabel: opts.label, onChange: changed });
    }
  }
  function edit() {
    if (destroyed || locked() || active()) return false;
    draft = value; phase = "edit"; error = "";
    try { mount(); } catch (e) { phase = "view"; throw e; }
    sync(); target()?.focus(); return true;
  }
  function cancel() {
    if (destroyed || !active() || phase === "saving" || interactionLocked) return false;
    generation++; control?.destroy(); control = null; field.replaceChildren(); phase = "view"; draft = value; error = ""; sync(); view.focus(); return true;
  }
  function validate(next) {
    if (opts.required && (next == null || String(next).trim() === "")) return `${opts.label} — required.`;
    if (next != null && next !== "") {
      if (kind === "text") {
        if (opts.minLength != null && next.length < opts.minLength) return `${opts.label} — enter at least ${opts.minLength} characters.`;
        if (opts.maxLength != null && next.length > opts.maxLength) return `${opts.label} — use at most ${opts.maxLength} characters.`;
      }
      if (kind === "select" && !(opts.items || []).some(item => String(item.id ?? item.value ?? item) === String(next) && !item.disabled)) return `${opts.label} — choose an available option.`;
      if (kind === "date") {
        try {
          const parse = v => opts.valueMode === "wall-clock" ? parseCivil(v) : new Date(v);
          const date = parse(next);
          if (!date || !Number.isFinite(+date)) return `${opts.label} — choose a valid date.`;
          if (opts.min != null && +date < +parse(opts.min)) return `${opts.label} — choose a date on or after ${opts.min}.`;
          if (opts.max != null && +date > +parse(opts.max)) return `${opts.label} — choose a date on or before ${opts.max}.`;
          if (opts.disabledDates?.(opts.valueMode === "wall-clock" ? String(next).slice(0, 10) : date)) return `${opts.label} — choose an available date.`;
        } catch { return `${opts.label} — choose a valid date.`; }
      }
    }
    const result = opts.validate?.(next, { value });
    if (result?.then) throw new TypeError("Inline validate must be synchronous; server validation belongs in onSave.");
    return result === false ? `${opts.label} — check this value.` : typeof result === "string" ? result : "";
  }
  async function save() {
    if (destroyed || !active() || phase === "saving" || locked()) return false;
    const next = kind === "text" ? input.value : control.getValue();
    draft = next; error = validate(next);
    if (error) { phase = "error"; sync(); target()?.focus(); return false; }
    const token = ++generation; phase = "saving"; error = "";
    // Recreate the closed canonical control so no portaled choices remain active during a save.
    mount(); sync();
    try {
      const result = await opts.onSave?.(next, { previousValue: value });
      if (destroyed || token !== generation) return false;
      if (result === false) throw new Error(`${opts.label} could not be saved. Review the value and try again.`);
      value = next; draft = next; phase = "view"; control?.destroy(); control = null; field.replaceChildren(); sync(); view.focus(); return true;
    } catch (e) {
      if (destroyed || token !== generation) return false;
      phase = "error"; error = e?.message || `${opts.label} could not be saved.`; sync(); target()?.focus(); return false;
    }
  }
  function getState() { return { state: phase, value, draft, error, actionsPlacement: actualPlacement, active: active(), disabled: Boolean(opts.disabled), readOnly: Boolean(opts.readOnly || opts.readonly) }; }
  function update(next = {}) {
    if (destroyed) return;
    generation++; control?.destroy(); control = null; field.replaceChildren();
    opts = { ...opts, ...next }; if (Object.hasOwn(next, "value")) value = next.value;
    draft = value; phase = "view"; error = ""; sync();
  }
  root.addEventListener("ui:interaction-lock", event => {
    const next = Boolean(event.detail?.locked);
    if (interactionLocked === next || destroyed) return;
    interactionLocked = next;
    // Close any portaled control, retaining the inline editor and selected draft.
    if (next && control?.getState().open) { draft = control.getValue(); mount(); }
    sync();
  });
  view.addEventListener("click", edit); saveButton.addEventListener("click", save); cancelButton.addEventListener("click", cancel);
  function onKeydown(e) {
    if (e.defaultPrevented) return;
    if (e.key === "Escape" && active() && !control?.getState().open) { e.preventDefault(); e.stopPropagation(); cancel(); }
    if (e.key === "Tab" && actionPopover && !control?.getState().open && phase !== "saving") {
      if (!e.shiftKey && field.contains(e.target)) { e.preventDefault(); saveButton.focus(); }
      else if (e.shiftKey && e.target === saveButton) { e.preventDefault(); target()?.focus(); }
      else if (!e.shiftKey && e.target === cancelButton) {
        const candidates = [...doc.querySelectorAll('button,input,textarea,select,a[href],[tabindex="0"]')].filter(n => !n.disabled && n.getClientRects().length && !n.closest('[inert]') && !actions.contains(n));
        const next = candidates.find(n => !root.contains(n) && (root.compareDocumentPosition(n) & 4));
        if (next) { e.preventDefault(); next.focus(); }
      }
    }
    if (kind === "text" && e.key === "Enter" && e.target === input && (!opts.multiline || e.ctrlKey || e.metaKey)) { e.preventDefault(); save(); }
  }
  root.addEventListener("keydown", onKeydown);
  actions.addEventListener("keydown", e => { if (!root.contains(actions)) onKeydown(e); });
  sync();
  return { edit, save, cancel, update, getState, getValue: () => value, destroy() { if (destroyed) return; generation++; destroyed = true; clearPopover(); resizeObserver.disconnect(); win.removeEventListener("resize", layoutActions); win.visualViewport?.removeEventListener("resize", layoutActions); control?.destroy(); phase = "view"; root.dataset.inlineActive = "false"; root.dispatchEvent(new CustomEvent("ui:inline-state", { bubbles: true })); root.remove(); } };
}
