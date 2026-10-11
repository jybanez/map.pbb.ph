import { createElement, clearNode } from "./ui.dom.js";
import { createIcon } from "./ui.icons.js";

const DEFAULT_OPTIONS = {
  className: "",
  chrome: true,
  showSelectionLabel: true,
  selectionLabelPlaceholder: "No selection",
  labelWidth: null,
  dense: false,
  mobileLayout: "stack",
  showSectionDescriptions: true,
  showPropertyHelp: true,
  emptyValue: "—",
  mixedLabel: "Mixed",
  trueLabel: "Yes",
  falseLabel: "No",
  maskPasswords: true,
  showPasswordToggle: true,
  showPasswordLabel: "Show value",
  hidePasswordLabel: "Hide value",
  showCopyButtons: false,
  copyLabel: "Copy",
  onCopy: null,
  onAction: null,
  formatValue: null,
};

export function createPropertyViewer(container, data = {}, options = {}) {
  let currentData = normalizeData(data);
  let currentOptions = normalizeOptions(options);
  let revealedProperties = new Set();
  let root = null;

  function render() {
    if (!container || container.nodeType !== 1) {
      return;
    }
    clearNode(container);
    root = createElement("div", {
      className: [
        "ui-property-viewer",
        currentOptions.chrome ? "" : "is-chrome-less",
        currentOptions.dense ? "is-dense" : "",
        currentOptions.mobileLayout === "columns" ? "is-mobile-columns" : "",
        currentOptions.className || "",
      ].filter(Boolean).join(" "),
    });
    applyRootVars();

    if (currentOptions.showSelectionLabel) {
      root.appendChild(createSelectionRow());
    }

    currentData.sections.forEach((section) => {
      root.appendChild(createSectionNode(section));
    });
    container.appendChild(root);
  }

  function applyRootVars() {
    if (!root) {
      return;
    }
    if (currentOptions.labelWidth == null || currentOptions.labelWidth === "") {
      root.style.removeProperty("--ui-property-viewer-label-width");
      return;
    }
    root.style.setProperty(
      "--ui-property-viewer-label-width",
      typeof currentOptions.labelWidth === "number" ? `${currentOptions.labelWidth}px` : String(currentOptions.labelWidth),
    );
  }

  function createSelectionRow() {
    const row = createElement("div", { className: "ui-property-viewer-selection" });
    row.appendChild(createElement("div", {
      className: "ui-property-viewer-selection-label",
      text: "Selection",
    }));
    row.appendChild(createElement("div", {
      className: "ui-property-viewer-selection-value",
      text: currentData.selectionLabel || currentOptions.selectionLabelPlaceholder,
    }));
    return row;
  }

  function createSectionNode(section) {
    const node = createElement("section", {
      className: "ui-property-viewer-section",
      dataset: { sectionId: section.id },
    });
    const header = createElement("div", { className: "ui-property-viewer-section-header" });
    header.appendChild(createElement("div", {
      className: "ui-property-viewer-section-title",
      text: section.title,
    }));
    if (currentOptions.showSectionDescriptions && section.description) {
      header.appendChild(createElement("div", {
        className: "ui-property-viewer-section-description",
        text: section.description,
      }));
    }
    if (section.title || (currentOptions.showSectionDescriptions && section.description)) {
      node.appendChild(header);
    }

    const body = createElement("div", { className: "ui-property-viewer-section-body" });
    section.properties.forEach((property) => {
      body.appendChild(createPropertyRow(section, property));
    });
    node.appendChild(body);
    return node;
  }

  function createPropertyRow(section, property) {
    if (property.kind === "divider") {
      return createElement("div", { className: "ui-property-viewer-divider" });
    }

    const row = createElement("div", {
      className: [
        "ui-property-viewer-row",
        property.kind === "password" ? "is-sensitive" : "",
        property.mixed ? "is-mixed" : "",
        property.tone ? `is-${property.tone}` : "",
      ].filter(Boolean).join(" "),
      dataset: { propertyId: property.id },
    });
    row.appendChild(createElement("div", {
      className: "ui-property-viewer-label",
      text: property.label,
    }));

    const valueCell = createElement("div", { className: "ui-property-viewer-value" });
    valueCell.appendChild(createValueNode(section, property));
    if (currentOptions.showPropertyHelp && property.help) {
      valueCell.appendChild(createElement("div", {
        className: "ui-property-viewer-help",
        text: property.help,
      }));
    }
    row.appendChild(valueCell);
    row.appendChild(createActionsCell(section, property));
    return row;
  }

  function createValueNode(section, property) {
    if (property.kind === "action") {
      const button = createElement("button", {
        className: "ui-button ui-button-primary ui-property-viewer-action",
        text: property.value == null || property.value === "" ? property.label : String(property.value),
        attrs: {
          type: "button",
          disabled: property.disabled ? "disabled" : null,
        },
      });
      button.addEventListener("click", () => emitAction(section, property, property.actions?.[0] || { id: property.id, label: button.textContent || property.label }));
      return button;
    }

    if (property.kind === "custom") {
      return createCustomValueNode(section, property);
    }

    if (property.kind === "color" || property.kind === "color-select") {
      const wrap = createElement("div", { className: "ui-property-viewer-color" });
      wrap.appendChild(createElement("span", {
        className: "ui-property-viewer-color-swatch",
        attrs: { "aria-hidden": "true" },
      }));
      wrap.lastElementChild.style.background = normalizeColorValue(property.value);
      wrap.appendChild(createElement("span", {
        className: "ui-property-viewer-display",
        text: formatPropertyValue(property),
      }));
      return wrap;
    }

    if (Array.isArray(property.value) || property.kind === "tags" || property.kind === "badges") {
      return createListValue(property);
    }

    return createElement("div", {
      className: "ui-property-viewer-display",
      text: formatPropertyValue(property, {
        revealed: isPropertyRevealed(section, property),
      }),
    });
  }

  function createListValue(property) {
    const values = Array.isArray(property.value) ? property.value : normalizeDelimitedValues(property.value);
    const wrap = createElement("div", { className: "ui-property-viewer-list" });
    if (!values.length || property.mixed) {
      wrap.appendChild(createElement("span", {
        className: "ui-property-viewer-display",
        text: property.mixed ? currentOptions.mixedLabel : currentOptions.emptyValue,
      }));
      return wrap;
    }
    values.forEach((value) => {
      wrap.appendChild(createElement("span", {
        className: "ui-property-viewer-chip",
        text: resolveOptionLabel(property, value),
      }));
    });
    return wrap;
  }

  function createCustomValueNode(section, property) {
    const wrap = createElement("div", { className: "ui-property-viewer-custom" });
    if (typeof property.render !== "function") {
      wrap.appendChild(createElement("span", {
        className: "ui-property-viewer-display",
        text: formatPropertyValue(property, {
          revealed: isPropertyRevealed(section, property),
        }),
      }));
      return wrap;
    }

    try {
      const rendered = property.render(property.value, {
        sectionId: section.id,
        propertyId: property.id,
        property: cloneProperty(property),
        createElement,
      });
      appendCustomRenderResult(wrap, rendered);
    } catch (error) {
      console.error("[ui.property.viewer] Custom property renderer failed.", error);
      wrap.appendChild(createElement("span", {
        className: "ui-property-viewer-display",
        text: currentOptions.emptyValue,
      }));
    }
    return wrap;
  }

  function createActionsCell(section, property) {
    const cell = createElement("div", { className: "ui-property-viewer-actions" });
    const actions = Array.isArray(property.actions) ? property.actions : [];
    actions.forEach((action) => {
      if (!action || typeof action !== "object") {
        return;
      }
      const button = createElement("button", {
        className: [
          "ui-button",
          action.danger ? "ui-button-danger" : "ui-button-ghost",
          "ui-property-viewer-action",
        ].filter(Boolean).join(" "),
        text: action.label || action.id || "Action",
        attrs: {
          type: "button",
          disabled: action.disabled || property.disabled ? "disabled" : null,
        },
      });
      button.addEventListener("click", () => emitAction(section, property, action));
      cell.appendChild(button);
    });

    if (shouldShowPasswordToggle(property)) {
      const revealed = isPropertyRevealed(section, property);
      const label = revealed ? currentOptions.hidePasswordLabel : currentOptions.showPasswordLabel;
      const button = createElement("button", {
        className: "ui-button ui-button-quiet ui-button-icon ui-property-viewer-sensitive-toggle",
        attrs: {
          type: "button",
          "aria-label": label,
          title: label,
          "aria-pressed": revealed ? "true" : "false",
        },
      });
      button.appendChild(createIcon(revealed ? "actions.hide" : "actions.view", { size: 16 }));
      button.addEventListener("click", () => {
        togglePropertyReveal(section, property);
        render();
        focusSensitiveToggle(section.id, property.id);
      });
      cell.appendChild(button);
    }

    if (shouldShowCopyButton(property)) {
      const copyLabel = property.copyLabel || currentOptions.copyLabel;
      const button = createElement("button", {
        className: "ui-button ui-button-quiet ui-button-icon ui-property-viewer-copy",
        attrs: {
          type: "button",
          "aria-label": copyLabel,
          title: copyLabel,
        },
      });
      button.appendChild(createIcon("actions.copy", { size: 16 }));
      button.addEventListener("click", () => emitCopy(section, property, button));
      cell.appendChild(button);
    }
    return cell;
  }

  function emitAction(section, property, action) {
    currentOptions.onAction?.(cloneProperty(property), action ? { ...action } : null, {
      sectionId: section.id,
      source: property.id,
    });
  }

  async function emitCopy(section, property, source) {
    const value = getCopyValue(property);
    if (typeof currentOptions.onCopy === "function") {
      currentOptions.onCopy({
        sectionId: section.id,
        propertyId: property.id,
        kind: property.kind,
        value,
      }, { source });
      return;
    }
    try {
      await navigator.clipboard?.writeText?.(stringifyCopyValue(value));
    } catch (_error) {
      // Clipboard access is browser/permission dependent; app-owned onCopy can handle failures.
    }
  }

  function update(nextData = {}, nextOptions = {}) {
    if (Object.prototype.hasOwnProperty.call(nextData || {}, "selectionLabel")) {
      currentData.selectionLabel = nextData.selectionLabel == null ? "" : String(nextData.selectionLabel);
    }
    if (Object.prototype.hasOwnProperty.call(nextData || {}, "sections")) {
      currentData.sections = normalizeSections(nextData.sections || []);
      revealedProperties = pruneRevealedProperties(revealedProperties, currentData.sections);
    }
    currentOptions = normalizeOptions({ ...currentOptions, ...(nextOptions || {}) });
    render();
  }

  function setSections(sections = []) {
    currentData.sections = normalizeSections(sections);
    revealedProperties = pruneRevealedProperties(revealedProperties, currentData.sections);
    render();
  }

  function setSelectionLabel(label) {
    currentData.selectionLabel = label == null ? "" : String(label);
    render();
  }

  function getState() {
    return {
      selectionLabel: currentData.selectionLabel,
      sections: currentData.sections.map(cloneSection),
      options: { ...currentOptions },
    };
  }

  function destroy() {
    clearNode(container);
    root = null;
  }

  render();

  return {
    update,
    setSections,
    setSelectionLabel,
    getState,
    destroy,
    get root() {
      return root;
    },
  };

  function formatPropertyValue(property, meta = {}) {
    if (property.mixed) {
      return currentOptions.mixedLabel;
    }
    if (typeof currentOptions.formatValue === "function") {
      const formatted = currentOptions.formatValue(cloneProperty(property), meta);
      if (formatted !== undefined && formatted !== null) {
        return String(formatted);
      }
    }
    if (property.kind === "password" && currentOptions.maskPasswords && !meta.raw && !meta.revealed) {
      return property.value == null || property.value === "" ? currentOptions.emptyValue : "••••••••";
    }
    if (property.kind === "checkbox" || property.kind === "toggle" || typeof property.value === "boolean") {
      return property.value ? currentOptions.trueLabel : currentOptions.falseLabel;
    }
    if (property.kind === "select" || property.kind === "ui.select" || property.kind === "color-select") {
      return resolveOptionLabel(property, property.value);
    }
    if (property.value instanceof Date) {
      return property.value.toLocaleString();
    }
    if (Array.isArray(property.value)) {
      return property.value.map((item) => resolveOptionLabel(property, item)).join(", ");
    }
    if (property.value && typeof property.value === "object") {
      return JSON.stringify(property.value);
    }
    return formatScalar(property.value, currentOptions.emptyValue);
  }

  function shouldShowCopyButton(property) {
    if (property.kind === "action") {
      return false;
    }
    if (property.kind === "password") {
      return property.copyable === true;
    }
    if (property.copyable !== null) {
      return property.copyable;
    }
    return currentOptions.showCopyButtons;
  }

  function focusSensitiveToggle(sectionId, propertyId) {
    const rows = root?.querySelectorAll(".ui-property-viewer-row") || [];
    const row = Array.from(rows).find((candidate) => {
      const section = candidate.closest(".ui-property-viewer-section");
      return section?.dataset.sectionId === String(sectionId)
        && candidate.dataset.propertyId === String(propertyId);
    });
    row?.querySelector(".ui-property-viewer-sensitive-toggle")?.focus();
  }

  function shouldShowPasswordToggle(property) {
    return property.kind === "password"
      && currentOptions.maskPasswords
      && currentOptions.showPasswordToggle
      && property.revealable !== false
      && property.value != null
      && property.value !== "";
  }

  function getPropertyKey(section, property) {
    return `${section.id}::${property.id}`;
  }

  function isPropertyRevealed(section, property) {
    return revealedProperties.has(getPropertyKey(section, property));
  }

  function togglePropertyReveal(section, property) {
    const key = getPropertyKey(section, property);
    if (revealedProperties.has(key)) {
      revealedProperties.delete(key);
      return;
    }
    revealedProperties.add(key);
  }

  function getCopyValue(property) {
    if (Object.prototype.hasOwnProperty.call(property, "copyValue")) {
      return property.copyValue;
    }
    return formatPropertyValue(property, { raw: true });
  }
}

function normalizeData(data = {}) {
  return {
    selectionLabel: data.selectionLabel == null ? "" : String(data.selectionLabel),
    sections: normalizeSections(data.sections || []),
  };
}

function normalizeSections(sections = []) {
  return (Array.isArray(sections) ? sections : []).map((section, index) => ({
    id: String(section?.id ?? `section-${index}`),
    title: String(section?.title ?? `Section ${index + 1}`),
    description: section?.description == null ? "" : String(section.description),
    properties: normalizeProperties(section?.properties || []),
  }));
}

function normalizeProperties(properties = []) {
  return (Array.isArray(properties) ? properties : []).map((property, index) => ({
    ...property,
    id: String(property?.id ?? `property-${index}`),
    label: String(property?.label ?? property?.id ?? `Property ${index + 1}`),
    kind: normalizeKind(property?.kind),
    options: normalizeOptionsList(property?.options || property?.items || []),
    actions: Array.isArray(property?.actions) ? property.actions.map(normalizeAction).filter(Boolean) : [],
    help: property?.help == null ? "" : String(property.help),
    tone: normalizeTone(property?.tone),
    mixed: Boolean(property?.mixed),
    disabled: Boolean(property?.disabled),
    revealable: property?.revealable !== false,
    copyable: property?.copyable == null ? null : Boolean(property.copyable),
    copyLabel: property?.copyLabel == null ? "" : String(property.copyLabel),
  }));
}

function normalizeKind(kind) {
  const value = String(kind || "display").toLowerCase();
  return [
    "display",
    "text",
    "textarea",
    "number",
    "checkbox",
    "toggle",
    "select",
    "ui.select",
    "password",
    "color",
    "color-select",
    "custom",
    "action",
    "divider",
    "tags",
    "badges",
  ].includes(value) ? value : "display";
}

function appendCustomRenderResult(container, rendered) {
  if (rendered === undefined || rendered === null) {
    return;
  }
  if (typeof Node !== "undefined" && rendered instanceof Node) {
    container.appendChild(rendered);
    return;
  }
  if (Array.isArray(rendered)) {
    rendered.forEach((item) => appendCustomRenderResult(container, item));
    return;
  }
  container.textContent = String(rendered);
}

function normalizeTone(tone) {
  const value = String(tone || "").toLowerCase();
  return ["neutral", "success", "warning", "danger", "info"].includes(value) ? value : "";
}

function normalizeOptionsList(options = []) {
  return (Array.isArray(options) ? options : []).map((option) => {
    if (option && typeof option === "object") {
      return {
        value: option.value,
        label: String(option.label ?? option.value ?? ""),
      };
    }
    return { value: option, label: String(option ?? "") };
  });
}

function normalizeAction(action) {
  if (!action || typeof action !== "object") {
    return null;
  }
  const id = String(action.id || action.label || "").trim();
  const label = String(action.label || action.id || "").trim();
  if (!id && !label) {
    return null;
  }
  return {
    ...action,
    id: id || label,
    label: label || id,
    danger: Boolean(action.danger),
    disabled: Boolean(action.disabled),
  };
}

function normalizeOptions(options = {}) {
  return {
    ...DEFAULT_OPTIONS,
    ...(options || {}),
    className: String(options?.className || ""),
    chrome: options?.chrome !== false,
    showSelectionLabel: options?.showSelectionLabel !== false,
    labelWidth: options?.labelWidth ?? null,
    dense: Boolean(options?.dense),
    mobileLayout: options?.mobileLayout === "columns" ? "columns" : "stack",
    showSectionDescriptions: options?.showSectionDescriptions !== false,
    showPropertyHelp: options?.showPropertyHelp !== false,
    emptyValue: options?.emptyValue == null ? DEFAULT_OPTIONS.emptyValue : String(options.emptyValue),
    mixedLabel: options?.mixedLabel == null ? DEFAULT_OPTIONS.mixedLabel : String(options.mixedLabel),
    trueLabel: options?.trueLabel == null ? DEFAULT_OPTIONS.trueLabel : String(options.trueLabel),
    falseLabel: options?.falseLabel == null ? DEFAULT_OPTIONS.falseLabel : String(options.falseLabel),
    maskPasswords: options?.maskPasswords !== false,
    showPasswordToggle: options?.showPasswordToggle !== false,
    showPasswordLabel: options?.showPasswordLabel == null ? DEFAULT_OPTIONS.showPasswordLabel : String(options.showPasswordLabel),
    hidePasswordLabel: options?.hidePasswordLabel == null ? DEFAULT_OPTIONS.hidePasswordLabel : String(options.hidePasswordLabel),
    showCopyButtons: Boolean(options?.showCopyButtons),
    copyLabel: options?.copyLabel == null ? DEFAULT_OPTIONS.copyLabel : String(options.copyLabel),
    onCopy: typeof options?.onCopy === "function" ? options.onCopy : null,
    onAction: typeof options?.onAction === "function" ? options.onAction : null,
    formatValue: typeof options?.formatValue === "function" ? options.formatValue : null,
  };
}

function pruneRevealedProperties(revealedProperties, sections) {
  const nextKeys = new Set();
  sections.forEach((section) => {
    section.properties.forEach((property) => {
      nextKeys.add(`${section.id}::${property.id}`);
    });
  });
  return new Set(Array.from(revealedProperties).filter((key) => nextKeys.has(key)));
}

function resolveOptionLabel(property, value) {
  if (Array.isArray(value)) {
    return value.map((item) => resolveOptionLabel(property, item)).join(", ");
  }
  const match = property.options?.find((option) => String(option.value) === String(value));
  return match?.label || formatScalar(value, "—");
}

function formatScalar(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  return String(value);
}

function stringifyCopyValue(value) {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

function normalizeDelimitedValues(value) {
  if (value === undefined || value === null || value === "") {
    return [];
  }
  return String(value).split(",").map((item) => item.trim()).filter(Boolean);
}

function normalizeColorValue(value) {
  const text = String(value || "").trim();
  return /^#[0-9a-f]{6}$/i.test(text) ? text : "#6f9cff";
}

function cloneSection(section) {
  return {
    ...section,
    properties: section.properties.map(cloneProperty),
  };
}

function cloneProperty(property) {
  return {
    ...property,
    options: property.options?.map((option) => ({ ...option })) || [],
    actions: property.actions?.map((action) => ({ ...action })) || [],
  };
}
