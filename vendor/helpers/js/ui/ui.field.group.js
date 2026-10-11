import { createCheckbox } from "./ui.checkbox.js";
import { createCheckboxGroup } from "./ui.checkbox.group.js";
import { createCombobox } from "./ui.combobox.js";
import { fieldGroupPresets } from "./ui.field.group.presets.js";
import { FieldGroupSchemaError, validateFieldGroupSchema } from "./ui.field.group.schema.js";
import { createIcon } from "./ui.icons.js";
import { createNumberStepper } from "./ui.number.stepper.js";

const instancePrefix = Math.random().toString(36).slice(2);
let fieldGroupSequence = 0;

const DEFAULT_OPTIONS = {
  name: "",
  label: "",
  value: null,
  repeatable: false,
  required: false,
  chrome: true,
  fieldLayout: "stacked",
  fieldLayoutDensity: "standard",
  autoValidate: true,
  fields: [],
  validations: [],
  addLabel: "",
  removeLabel: "Remove",
  emptyItem: null,
  entryKey: "",
  preserveEntryKeys: false,
  createEntryKey: null,
  minItems: 0,
  maxItems: null,
  allowRemove: true,
  allowReorder: false,
  strictSchema: false,
  onChange: null,
};

export function createFieldGroup(container, options = {}) {
  if (!container || typeof container.appendChild !== "function") {
    throw new Error("createFieldGroup(container, options) requires a host container.");
  }

  const instanceId = `${instancePrefix}-${++fieldGroupSequence}`;
  let currentOptions = normalizeOptions(options);
  let value = normalizeValue(currentOptions.value, currentOptions);
  let renderedValidation = { status: true, errors: [], warnings: [] };
  const listeners = [];
  const expandedBreakdowns = new Set();
  const collapsedBreakdowns = new Set();

  const refs = {
    root: document.createElement("div"),
    labelRow: document.createElement("div"),
    label: document.createElement("div"),
    required: document.createElement("span"),
    body: document.createElement("div"),
    live: document.createElement("div"),
  };

  refs.root.className = "ui-field-group";
  refs.labelRow.className = "ui-field-group-label-row";
  refs.label.className = "ui-label ui-field-group-label";
  refs.required.className = "ui-field-group-required";
  refs.required.textContent = "Required";
  refs.body.className = "ui-field-group-body";
  refs.live.className = "ui-field-group-live";
  refs.live.setAttribute("aria-live", "polite");
  refs.live.setAttribute("aria-atomic", "true");
  refs.labelRow.append(refs.label, refs.required);
  refs.root.append(refs.labelRow, refs.body, refs.live);
  container.appendChild(refs.root);

  render();

  return {
    root: refs.root,
    getValue() {
      return cloneValue(value);
    },
    setValue(nextValue, meta = {}) {
      value = normalizeValue(nextValue, currentOptions);
      render();
      if (meta.emit !== false) {
        emitChange();
      }
    },
    update(nextOptions = {}) {
      const mergedOptions = { ...currentOptions, ...(nextOptions || {}) };
      const shouldRefreshFields = ["fields", "preset", "field_preset", "config", "field_config", "config_json", "configJson"].some((key) =>
        Object.prototype.hasOwnProperty.call(nextOptions || {}, key)
      );
      if (shouldRefreshFields) {
        delete mergedOptions.rawFields;
        if (!Object.prototype.hasOwnProperty.call(nextOptions || {}, "fields")) {
          delete mergedOptions.fields;
        }
      }
      currentOptions = normalizeOptions(mergedOptions);
      value = normalizeValue(
        Object.prototype.hasOwnProperty.call(nextOptions || {}, "value") ? nextOptions.value : value,
        currentOptions
      );
      render();
    },
    validate() {
      return getCurrentValidation();
    },
    addItem(item = null, meta = {}) {
      return addItem(item, meta);
    },
    removeItem(index, meta = {}) {
      return removeItem(index, meta);
    },
    moveItem(fromIndex, toIndex, meta = {}) {
      return moveItem(fromIndex, toIndex, meta);
    },
    destroy() {
      clearListeners();
      refs.root.remove();
    },
  };

  function render() {
    clearListeners();
    renderedValidation = getCurrentValidation();
    refs.root.className = [
      "ui-field-group",
      currentOptions.chrome ? "" : "is-chrome-less",
      currentOptions.fieldLayout === "horizontal" ? "is-horizontal" : "",
      currentOptions.fieldLayoutDensity === "compact" ? "is-compact" : "",
    ].filter(Boolean).join(" ");
    refs.root.dataset.repeatable = currentOptions.repeatable ? "true" : "false";
    refs.root.dataset.chrome = currentOptions.chrome ? "true" : "false";
    refs.label.textContent = currentOptions.label || currentOptions.name || "Group";
    refs.labelRow.hidden = !currentOptions.chrome || (!refs.label.textContent && !currentOptions.required);
    refs.required.hidden = !currentOptions.required;
    clearNode(refs.body);

    const items = currentOptions.repeatable ? value : [value && typeof value === "object" ? value : {}];
    const renderItems = currentOptions.repeatable && !items.length ? [createEmptyItem(currentOptions)] : items;

    renderItems.forEach((item, index) => {
      refs.body.appendChild(renderItem(item, index, renderItems.length));
    });

    if (currentOptions.repeatable) {
      const add = document.createElement("button");
      add.type = "button";
      add.className = "ui-field-group-add";
      add.textContent = currentOptions.addLabel || `Add ${currentOptions.label || "Entry"}`;
      add.disabled = hasReachedMaxItems();
      add.setAttribute("aria-disabled", add.disabled ? "true" : "false");
      on(add, "click", () => {
        addItem();
      });
      refs.body.appendChild(add);
    }
  }

  function renderItem(item, index, itemCount) {
    const itemEl = document.createElement("div");
    itemEl.className = "ui-field-group-item";

    if (currentOptions.repeatable) {
      const header = document.createElement("div");
      header.className = "ui-field-group-item-header";

      const title = document.createElement("span");
      title.className = "ui-field-group-item-title";
      title.textContent = `#${index + 1}`;

      const itemIssues = getItemIssues(index);
      const warning = document.createElement("span");
      const itemErrorCount = itemIssues.filter((issue) => issue.severity === "error").length;
      const itemWarningCount = itemIssues.filter((issue) => issue.severity !== "error").length;
      warning.className = [
        "ui-field-group-item-warning",
        itemErrorCount ? "is-error" : "",
      ].filter(Boolean).join(" ");
      warning.hidden = itemIssues.length === 0;
      warning.textContent = itemErrorCount
        ? `${itemErrorCount} ${itemErrorCount === 1 ? "error" : "errors"}`
        : `${itemWarningCount} ${itemWarningCount === 1 ? "warning" : "warnings"}`;
      warning.title = itemIssues.map((item) => item.message || item.warning || item.error).filter(Boolean).join("\n");

      header.append(title, warning);
      if (currentOptions.allowReorder && itemCount > 1) {
        const reorder = document.createElement("span");
        reorder.className = "ui-field-group-reorder";
        const moveUp = createMoveButton(index, -1, itemCount);
        const moveDown = createMoveButton(index, 1, itemCount);
        reorder.append(moveUp, moveDown);
        header.appendChild(reorder);
      }
      if (canRemoveItem(itemCount, index)) {
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "ui-field-group-remove";
        remove.setAttribute("aria-label", `${currentOptions.removeLabel} #${index + 1}`);
        remove.title = `${currentOptions.removeLabel} #${index + 1}`;
        remove.appendChild(createIcon("actions.delete", { size: 16 }));
        on(remove, "click", () => {
          removeItem(index);
        });
        header.appendChild(remove);
      }
      itemEl.appendChild(header);
    }

    const rows = document.createElement("div");
    rows.className = "ui-field-group-rows";
    currentOptions.fieldRows.forEach((fieldRow) => {
      const renderRow = safeArray(fieldRow).filter((field) => !field || isFieldVisibleForItem(field, item));
      if (!renderRow.some((field) => field && getFieldKey(field))) {
        return;
      }
      const row = document.createElement("div");
      row.className = "ui-field-group-row";
      row.style.setProperty("--ui-field-group-columns", String(Math.max(renderRow.length, 1)));
      renderRow.forEach((field) => {
        const childKey = getFieldKey(field);
        if (!childKey) {
          row.appendChild(renderFieldPlaceholder());
          return;
        }
        row.appendChild(renderChildField(field, item, index));
        const breakdown = normalizeBreakdown(field);
        const breakdownKey = `${index}:${childKey}`;
        if (breakdown && isBreakdownOpen(breakdownKey, breakdown)) {
          row.appendChild(renderBreakdown(field, item, index, breakdown));
        }
      });
      if (row.childElementCount) {
        rows.appendChild(row);
      }
    });
    itemEl.appendChild(rows);
    return itemEl;
  }

  function createMoveButton(index, direction, itemCount) {
    const destination = index + direction;
    const label = direction < 0 ? "Move up" : "Move down";
    const button = document.createElement("button");
    button.type = "button";
    button.className = `ui-field-group-move ui-field-group-move-${direction < 0 ? "up" : "down"}`;
    button.disabled = destination < 0 || destination >= itemCount;
    button.setAttribute("aria-label", `${label} #${index + 1}`);
    button.title = `${label} #${index + 1}`;
    button.appendChild(createIcon(direction < 0 ? "navigation.chevron-up" : "navigation.chevron-down", { size: 16 }));
    on(button, "click", () => moveItem(index, destination, { focus: true }));
    return button;
  }

  function addItem(item = null, meta = {}) {
    if (!currentOptions.repeatable || hasReachedMaxItems()) {
      return false;
    }
    const nextItem = item && typeof item === "object" && !Array.isArray(item)
      ? normalizeItem(item, currentOptions)
      : createEmptyItem(currentOptions);
    value = [...safeArray(value), nextItem];
    render();
    announce(`Added ${currentOptions.label || "entry"} #${value.length}.`);
    if (meta.emit !== false) {
      emitChange();
    }
    return true;
  }

  function removeItem(index, meta = {}) {
    const items = safeArray(value);
    if (!currentOptions.repeatable || !canRemoveItem(items.length, index) || index < 0 || index >= items.length) {
      return false;
    }
    value = items.filter((_, itemIndex) => itemIndex !== index);
    render();
    announce(`Removed ${currentOptions.label || "entry"} #${index + 1}.`);
    if (meta.emit !== false) {
      emitChange();
    }
    return true;
  }

  function moveItem(fromIndex, toIndex, meta = {}) {
    const items = [...safeArray(value)];
    if (
      !currentOptions.repeatable
      || !currentOptions.allowReorder
      || fromIndex < 0
      || toIndex < 0
      || fromIndex >= items.length
      || toIndex >= items.length
      || fromIndex === toIndex
    ) {
      return false;
    }
    const [item] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, item);
    value = items;
    render();
    announce(`Moved ${currentOptions.label || "entry"} from position ${fromIndex + 1} to ${toIndex + 1}.`);
    if (meta.focus) {
      refs.body.querySelectorAll(".ui-field-group-item")[toIndex]?.querySelector(".ui-field-group-move:not([disabled])")?.focus();
    }
    if (meta.emit !== false) {
      emitChange();
    }
    return true;
  }

  function canRemoveItem(itemCount, index) {
    if (!currentOptions.allowRemove) {
      return false;
    }
    if (!currentOptions.itemBoundsConfigured) {
      return index > 0;
    }
    return itemCount > currentOptions.minItems;
  }

  function hasReachedMaxItems() {
    return currentOptions.maxItems != null && safeArray(value).length >= currentOptions.maxItems;
  }

  function announce(message) {
    refs.live.textContent = "";
    requestAnimationFrame(() => {
      refs.live.textContent = String(message || "");
    });
  }

  function isBreakdownOpen(key, breakdown) {
    if (!breakdown) {
      return false;
    }
    if (expandedBreakdowns.has(key)) {
      return true;
    }
    if (collapsedBreakdowns.has(key)) {
      return false;
    }
    return Boolean(breakdown.defaultOpen);
  }

  function renderChildField(field, item, index) {
    const childKey = getFieldKey(field);
    const type = getFieldType(field);
    const breakdown = normalizeBreakdown(field);
    const breakdownKey = `${index}:${childKey}`;
    const breakdownOpen = isBreakdownOpen(breakdownKey, breakdown);
    const issueKeys = breakdown ? [childKey, ...getBreakdownFieldKeys(breakdown)] : [childKey];
    const fieldIssues = getFieldIssues(index, issueKeys);
    const hasErrors = fieldIssues.some((issue) => issue.severity === "error");
    const row = document.createElement("div");
    row.className = [
      "ui-field ui-field-group-child",
      fieldIssues.length ? "has-warning" : "",
      hasErrors ? "has-error" : "",
    ].filter(Boolean).join(" ");
    row.dataset.fieldKey = childKey;
    row.dataset.controlType = type;

    const label = document.createElement("label");
    label.className = type === "checkbox" ? "ui-field-group-checkbox" : "ui-label";
    label.textContent = getFieldLabel(field, childKey);

    const warningBadge = renderIssueBadge(fieldIssues);

    let labelNode = label;
    if (breakdown) {
      labelNode = document.createElement("div");
      labelNode.className = "ui-field-group-child-label-row";
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "ui-field-group-breakdown-toggle";
      toggle.setAttribute("aria-expanded", breakdownOpen ? "true" : "false");
      toggle.setAttribute("aria-label", `${breakdownOpen ? "Hide" : "Show"} ${breakdown.label}`);
      toggle.title = `${breakdownOpen ? "Hide" : "Show"} ${breakdown.label}`;
      toggle.appendChild(createIcon(breakdownOpen ? "navigation.chevron-up" : "navigation.chevron-down", { size: 14 }));
      on(toggle, "click", () => {
        if (isBreakdownOpen(breakdownKey, breakdown)) {
          expandedBreakdowns.delete(breakdownKey);
          collapsedBreakdowns.add(breakdownKey);
        } else {
          collapsedBreakdowns.delete(breakdownKey);
          expandedBreakdowns.add(breakdownKey);
        }
        render();
      });
      const controls = document.createElement("span");
      controls.className = "ui-field-group-child-label-controls";
      if (warningBadge) {
        controls.appendChild(warningBadge);
      }
      controls.appendChild(toggle);
      labelNode.append(label, controls);
    } else if (warningBadge) {
      label.appendChild(warningBadge);
    }

    const control = createControl(field, item?.[childKey] ?? field?.default_value ?? "", index);
    if (!control) {
      return row;
    }
    associateFieldLabel(label, control, type, index, childKey);

    if (type === "checkbox" || type === "checkbox-group") {
      row.appendChild(control);
    } else {
      row.append(labelNode, control);
    }
    applyControlIssueAria(row, fieldIssues, index, childKey);

    const updateValue = () => {
      const previousItem = currentOptions.repeatable
        ? { ...(safeArray(value)[index] || {}) }
        : { ...(value && typeof value === "object" ? value : {}) };
      const nextItems = currentOptions.repeatable
        ? safeArray(value).map((sourceItem) => ({ ...(sourceItem || {}) }))
        : [{ ...(value && typeof value === "object" ? value : {}) }];
      if (!nextItems[index]) {
        nextItems[index] = {};
      }
      nextItems[index][childKey] = getControlValue(control, field);
      applyHiddenValuePolicy(previousItem, nextItems[index], currentOptions.fields);
      const shouldRender = applyComputedValues(nextItems[index], currentOptions.fields, childKey);
      const shouldRefreshVisibility = visibilitySignature(previousItem, currentOptions.fieldRows) !== visibilitySignature(nextItems[index], currentOptions.fieldRows);
      value = currentOptions.repeatable ? nextItems : nextItems[0];
      const nextValidation = getCurrentValidation();
      const shouldRefreshValidationUi = currentOptions.autoValidate && validationIssueSignature(renderedValidation) !== validationIssueSignature(nextValidation);
      emitChange(nextValidation);
      if (shouldRender || shouldRefreshVisibility || shouldRefreshValidationUi) {
        if (shouldRender || shouldRefreshVisibility) {
          renderedValidation = nextValidation;
          render();
        } else {
          updateValidationUi(nextValidation);
        }
      }
    };

    on(control, "change", updateValue);
    if (!["select", "multiselect", "checkbox", "number-stepper", "number_stepper"].includes(type)) {
      on(control, "input", updateValue);
    }

    return row;
  }

  function associateFieldLabel(label, control, type, index, childKey) {
    if (["checkbox", "checkbox-group", "notice", "message"].includes(type)) {
      return;
    }
    const idBase = `ui-field-group-${instanceId}-${toDomId(currentOptions.name || "group")}-${index}-${toDomId(childKey)}`;
    if (type === "multiselect") {
      label.id = `${idBase}-label`;
      control.setAttribute("role", "group");
      control.setAttribute("aria-labelledby", label.id);
      return;
    }
    const target = control.matches("input, select, textarea, [role='spinbutton']")
      ? control
      : control.querySelector("input, select, textarea, [role='spinbutton']");
    if (!target) {
      return;
    }
    target.id ||= idBase;
    label.htmlFor = target.id;
  }

  function renderFieldPlaceholder() {
    const placeholder = document.createElement("div");
    placeholder.className = "ui-field-group-placeholder";
    placeholder.setAttribute("aria-hidden", "true");
    return placeholder;
  }

  function renderBreakdown(field, item, index, breakdown) {
    const wrap = document.createElement("div");
    wrap.className = "ui-field-group-breakdown";
    wrap.dataset.breakdownFor = getFieldKey(field);
    wrap.style.setProperty("--ui-field-group-column-span", String(Math.max(Number(field?.breakdown?.columns || 0), 1)));

    const title = document.createElement("div");
    title.className = "ui-field-group-breakdown-title";
    title.textContent = breakdown.label;
    wrap.appendChild(title);

    const validationLines = getBreakdownValidationLines(index, item, breakdown);
    if (validationLines.length) {
      const warningList = document.createElement("div");
      warningList.className = "ui-field-group-breakdown-warnings";
      validationLines.forEach((warning) => {
        const line = document.createElement("div");
        line.className = [
          "ui-field-group-breakdown-warning",
          warning.invalid ? "is-invalid" : "is-valid",
        ].filter(Boolean).join(" ");
        line.textContent = warning.message || "Check this breakdown.";
        warningList.appendChild(line);
      });
      wrap.appendChild(warningList);
    }

    normalizeChildFieldRows({ fields: breakdown.fields }).forEach((fieldRow) => {
      const renderRow = safeArray(fieldRow).filter((field) => !field || isFieldVisibleForItem(field, item));
      if (!renderRow.some((field) => field && getFieldKey(field))) {
        return;
      }
      const row = document.createElement("div");
      row.className = "ui-field-group-breakdown-row";
      row.style.setProperty("--ui-field-group-columns", String(Math.max(renderRow.length, 1)));
      renderRow.forEach((child) => {
        const key = getFieldKey(child);
        if (key) {
          row.appendChild(renderChildField(child, item, index));
        } else {
          row.appendChild(renderFieldPlaceholder());
        }
      });
      if (row.childElementCount) {
        wrap.appendChild(row);
      }
    });

    return wrap;
  }

  function createControl(field, rawValue, index) {
    const type = getFieldType(field);
    if (requiresConfiguredOptions(field) && !normalizeOptionsList(field?.options).length) {
      const unconfigured = document.createElement("div");
      unconfigured.className = "ui-field-group-unsupported is-unconfigured";
      unconfigured.setAttribute("role", "status");
      unconfigured.textContent = String(field?.unconfiguredLabel || "This field requires application-provided choices.");
      return unconfigured;
    }
    if (type === "notice" || type === "message") {
      const notice = document.createElement("div");
      notice.className = [
        "ui-field-group-notice",
        `is-${String(field?.tone || field?.severity || "info").toLowerCase()}`,
      ].join(" ");
      notice.textContent = String(field?.message ?? field?.text ?? field?.help_text ?? field?.help ?? "");
      notice.setAttribute("role", String(field?.role || "note"));
      return notice;
    }

    if (type === "textarea") {
      const textarea = document.createElement("textarea");
      textarea.className = "ui-input";
      textarea.value = rawValue == null ? "" : String(rawValue);
      applyCommonAttrs(textarea, field);
      return textarea;
    }

    if (type === "select") {
      const select = document.createElement("select");
      select.className = "ui-input";
      applyCommonAttrs(select, field);
      if (field?.placeholder !== false) {
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = String(field?.placeholder || "Select");
        select.appendChild(placeholder);
      }
      normalizeOptionsList(field?.options).forEach((option) => {
        const optionEl = document.createElement("option");
        optionEl.value = option.value;
        optionEl.textContent = option.label;
        select.appendChild(optionEl);
      });
      select.value = rawValue == null ? "" : String(rawValue);
      return select;
    }

    if (type === "multiselect") {
      const wrap = document.createElement("div");
      wrap.className = "ui-field-group-multiselect";
      const selected = new Set(
        (Array.isArray(rawValue) ? rawValue : String(rawValue || "").split(","))
          .map((item) => String(item).trim())
          .filter(Boolean)
      );
      normalizeOptionsList(field?.options).forEach((option) => {
        const optionLabel = document.createElement("label");
        optionLabel.className = "ui-field-group-multiselect-option";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = option.value;
        checkbox.checked = selected.has(option.value);
        const text = document.createElement("span");
        text.textContent = option.label;
        optionLabel.append(checkbox, text);
        wrap.appendChild(optionLabel);
      });
      return wrap;
    }

    if (type === "checkbox-group") {
      const host = document.createElement("div");
      host.className = "ui-field-group-checkbox-group-host";
      const checkboxGroup = createCheckboxGroup(host, {
        name: `ui-field-group-${instanceId}-${index}-${toDomId(getFieldKey(field))}`,
        label: getFieldLabel(field, getFieldKey(field)),
        values: rawValue,
        options: field?.options,
        min: field?.min,
        max: field?.max,
        disabled: Boolean(field?.disabled),
        readonly: Boolean(field?.readonly),
        help: field?.help || "",
      });
      host.__uiCheckboxGroupInstance = checkboxGroup;
      return host;
    }

    if (type === "combobox" || type === "suggest" || type === "local-history") {
      const host = document.createElement("div");
      host.className = "ui-field-group-combobox-host";
      const combobox = createCombobox(host, {
        name: getFieldKey(field),
        id: field?.id || "",
        value: rawValue,
        placeholder: field?.placeholder || "",
        required: isRequiredField(field),
        disabled: Boolean(field?.disabled),
        readonly: Boolean(field?.readonly),
        ariaLabel: getFieldLabel(field, getFieldKey(field)),
        suggestions: field?.suggestions || field?.options || [],
        storageKey: field?.storageKey || field?.historyStorageKey || field?.history_storage_key || "",
        maxSuggestions: field?.maxSuggestions ?? field?.max_suggestions ?? 20,
        minChars: field?.minChars ?? field?.min_chars ?? 0,
        noResultsText: field?.noResultsText || field?.no_results_text || "No saved entries",
        onInput() {
          host.dispatchEvent(new Event("input", { bubbles: true }));
        },
        onChange() {
          host.dispatchEvent(new Event("change", { bubbles: true }));
        },
      });
      host.__uiComboboxInstance = combobox;
      return host;
    }

    if (type === "number-stepper" || type === "number_stepper") {
      const host = document.createElement("div");
      host.className = "ui-field-group-number-stepper-host";
      const numberStepper = createNumberStepper(host, {
        name: getFieldKey(field),
        value: rawValue,
        min: field?.min ?? null,
        max: field?.max,
        step: field?.step ?? 1,
        decimals: field?.decimals ?? 0,
        required: isRequiredField(field),
        disabled: Boolean(field?.disabled),
        readonly: Boolean(field?.readonly),
        placeholder: field?.placeholder || "",
        ariaLabel: getFieldLabel(field, getFieldKey(field)),
        allowEmpty: field?.allowEmpty ?? !isRequiredField(field),
        onInput() {
          host.dispatchEvent(new Event("input", { bubbles: true }));
        },
        onChange() {
          host.dispatchEvent(new Event("change", { bubbles: true }));
        },
      });
      host.__uiNumberStepperInstance = numberStepper;
      return host;
    }

    if (!isSupportedControlType(type)) {
      const unsupported = document.createElement("div");
      unsupported.className = "ui-field-group-unsupported";
      unsupported.setAttribute("role", "alert");
      unsupported.textContent = `Unsupported field type: ${type || "unknown"}`;
      return unsupported;
    }

    const input = document.createElement("input");
    input.className = "ui-input";
    if (type === "checkbox") {
      const host = document.createElement("div");
      host.className = "ui-field-group-checkbox-host";
      const checkbox = createCheckbox(host, {
        id: `ui-field-group-${instanceId}-${index}-${toDomId(getFieldKey(field))}-checkbox`,
        name: getFieldKey(field),
        label: getFieldLabel(field, getFieldKey(field)),
        checked: Boolean(rawValue),
        value: rawValue,
        ...(Object.prototype.hasOwnProperty.call(field, "checkedValue") ? { checkedValue: field.checkedValue } : {}),
        ...(Object.prototype.hasOwnProperty.call(field, "uncheckedValue") ? { uncheckedValue: field.uncheckedValue } : {}),
        required: isRequiredField(field),
        disabled: Boolean(field?.disabled),
        readonly: Boolean(field?.readonly),
        help: field?.help || "",
      });
      host.__uiCheckboxInstance = checkbox;
      return host;
    }
    input.type = type === "number" ? "number" : "text";
    input.value = rawValue == null ? "" : String(rawValue);
    applyCommonAttrs(input, field);
    return input;
  }

  function emitChange(validation = getCurrentValidation()) {
    currentOptions.onChange?.(cloneValue(value), {
      name: currentOptions.name,
      validation,
    });
  }

  function on(el, event, handler) {
    el.addEventListener(event, handler);
    listeners.push(() => el.removeEventListener(event, handler));
  }

  function clearListeners() {
    listeners.splice(0).forEach((off) => off());
  }

  function getCurrentValidation() {
    return validateGroup({
      ...currentOptions,
      enabledBreakdowns: expandedBreakdowns,
      collapsedBreakdowns,
    }, value);
  }

  function getItemIssues(index) {
    const prefix = getItemPathPrefix(currentOptions, index);
    return normalizeValidationIssues(renderedValidation)
      .filter((issue) => String(issue?.field_key || "").startsWith(prefix));
  }

  function getFieldIssues(index, keys) {
    const keySet = new Set(safeArray(keys).filter(Boolean));
    return getItemIssues(index).filter((warning) => {
      const warningKey = getLastPathSegment(warning?.field_key);
      const related = safeArray(warning?.related_fields);
      return keySet.has(warningKey) || related.some((key) => keySet.has(key));
    });
  }

  function getBreakdownValidationLines(index, item, breakdown) {
    const breakdownKeys = getBreakdownFieldKeys(breakdown);
    const options = {
      ...currentOptions,
      enabledBreakdowns: expandedBreakdowns,
      collapsedBreakdowns,
    };
    return safeArray(currentOptions.validations).map((rule) => {
      const context = getRuleBreakdownContext(rule, currentOptions);
      if (!context || !context.keys.some((key) => breakdownKeys.includes(key))) {
        return null;
      }
      const result = evaluateValidationRule(rule, item, options, index);
      return {
        invalid: Boolean(result),
        message: result?.message || getValidationRuleMessage(rule, currentOptions),
      };
    }).filter(Boolean);
  }

  function updateValidationUi(nextValidation) {
    renderedValidation = nextValidation;
    const itemEls = currentOptions.repeatable
      ? Array.from(refs.body.querySelectorAll(":scope > .ui-field-group-item"))
      : Array.from(refs.body.children).filter((node) => node?.classList?.contains("ui-field-group-item"));

    itemEls.forEach((itemEl, index) => {
      const item = currentOptions.repeatable
        ? safeArray(value)[index]
        : value;
      const itemIssues = getItemIssues(index);
      const itemErrorCount = itemIssues.filter((issue) => issue.severity === "error").length;
      const itemWarningCount = itemIssues.filter((issue) => issue.severity !== "error").length;
      const itemBadge = itemEl.querySelector(":scope > .ui-field-group-item-header .ui-field-group-item-warning");
      if (itemBadge) {
        itemBadge.classList.toggle("is-error", itemErrorCount > 0);
        itemBadge.hidden = itemIssues.length === 0;
        itemBadge.textContent = itemErrorCount
          ? `${itemErrorCount} ${itemErrorCount === 1 ? "error" : "errors"}`
          : `${itemWarningCount} ${itemWarningCount === 1 ? "warning" : "warnings"}`;
        itemBadge.title = itemIssues.map((item) => item.message || item.warning || item.error).filter(Boolean).join("\n");
      }

      safeArray(currentOptions.fields).forEach((field) => {
        const childKey = getFieldKey(field);
        if (!childKey) {
          return;
        }
        const breakdown = normalizeBreakdown(field);
        const issueKeys = breakdown ? [childKey, ...getBreakdownFieldKeys(breakdown)] : [childKey];
        updateFieldIssueUi(itemEl, index, childKey, issueKeys);
        if (breakdown) {
          updateBreakdownValidationUi(itemEl, index, item, childKey, breakdown);
        }
      });
    });
  }

  function updateFieldIssueUi(itemEl, index, childKey, issueKeys) {
    const fieldIssues = getFieldIssues(index, issueKeys);
    const hasIssues = fieldIssues.length > 0;
    const hasErrors = fieldIssues.some((issue) => issue.severity === "error");
    itemEl.querySelectorAll(`[data-field-key="${cssEscape(childKey)}"]`).forEach((row) => {
      row.classList.toggle("has-warning", hasIssues);
      row.classList.toggle("has-error", hasErrors);
      row.querySelectorAll(":scope .ui-field-group-warning-badge").forEach((badge) => badge.remove());
      applyControlIssueAria(row, fieldIssues, index, childKey);
      const badge = renderIssueBadge(fieldIssues);
      if (!badge) {
        return;
      }
      const controls = row.querySelector(":scope > .ui-field-group-child-label-row .ui-field-group-child-label-controls");
      if (controls) {
        controls.prepend(badge);
        return;
      }
      const label = row.querySelector(":scope > .ui-label");
      label?.appendChild(badge);
    });
  }

  function applyControlIssueAria(row, issues, index, childKey) {
    row.querySelector(":scope > .ui-field-group-field-issues")?.remove();
    const descriptionId = `ui-field-group-${instanceId}-${toDomId(currentOptions.name || "group")}-${index}-${toDomId(childKey)}-issues`;
    const controls = row.matches("input, select, textarea")
      ? [row]
      : Array.from(row.querySelectorAll("input, select, textarea, [role='spinbutton']"));
    const hasErrors = safeArray(issues).some((issue) => issue.severity === "error");
    controls.forEach((control) => {
      const describedBy = String(control.getAttribute("aria-describedby") || "").split(/\s+/).filter((id) => id && id !== descriptionId);
      if (describedBy.length) {
        control.setAttribute("aria-describedby", describedBy.join(" "));
      } else {
        control.removeAttribute("aria-describedby");
      }
      if (hasErrors) {
        control.setAttribute("aria-invalid", "true");
      } else {
        control.removeAttribute("aria-invalid");
      }
    });
    if (!issues.length) {
      return;
    }
    const description = document.createElement("span");
    description.id = descriptionId;
    description.className = "ui-field-group-field-issues";
    description.textContent = issues.map((issue) => issue.message || issue.error || issue.warning).filter(Boolean).join(" ");
    row.appendChild(description);
    controls.forEach((control) => {
      const ids = new Set(String(control.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean));
      ids.add(descriptionId);
      control.setAttribute("aria-describedby", [...ids].join(" "));
    });
  }

  function updateBreakdownValidationUi(itemEl, index, item, childKey, breakdown) {
    const wrap = itemEl.querySelector(`.ui-field-group-breakdown[data-breakdown-for="${cssEscape(childKey)}"]`);
    if (!wrap) {
      return;
    }
    const validationLines = getBreakdownValidationLines(index, item, breakdown);
    let list = wrap.querySelector(":scope > .ui-field-group-breakdown-warnings");
    if (!validationLines.length) {
      list?.remove();
      return;
    }
    if (!list) {
      list = document.createElement("div");
      list.className = "ui-field-group-breakdown-warnings";
      const title = wrap.querySelector(":scope > .ui-field-group-breakdown-title");
      if (title?.nextSibling) {
        wrap.insertBefore(list, title.nextSibling);
      } else {
        wrap.appendChild(list);
      }
    }
    clearNode(list);
    validationLines.forEach((warning) => {
      const line = document.createElement("div");
      line.className = [
        "ui-field-group-breakdown-warning",
        warning.invalid ? "is-invalid" : "is-valid",
      ].filter(Boolean).join(" ");
      line.textContent = warning.message || "Check this breakdown.";
      list.appendChild(line);
    });
  }
}

function toDomId(value) {
  return String(value || "value").replace(/[^a-z0-9_-]+/gi, "-");
}

export function normalizeFieldGroupValue(field, rawValue) {
  return normalizeValue(rawValue, normalizeOptions(field));
}

export function validateFieldGroup(field, rawValue) {
  const options = normalizeOptions(field);
  return validateGroup(options, normalizeValue(rawValue, options, { clampNumbers: false }));
}

export function serializeFieldGroupValue(field, rawValue) {
  return JSON.stringify(normalizeFieldGroupValue(field, rawValue));
}

export function parseFieldGroupValue(field, rawValue) {
  const options = normalizeOptions(field);
  if (!rawValue) {
    return normalizeValue(null, options);
  }
  if (typeof rawValue === "object") {
    return normalizeValue(rawValue, options);
  }
  try {
    return normalizeValue(JSON.parse(String(rawValue)), options);
  } catch (_) {
    return normalizeValue(null, options);
  }
}

export function resolveFieldGroupFields(field = {}) {
  return cloneFieldDefinitions(normalizeOptions(field).fields);
}

export function resolveFieldGroupRows(field = {}) {
  return cloneFieldDefinitions(normalizeOptions(field).rawFields);
}

export function isRepeatableFieldGroup(field = {}) {
  return normalizeOptions(field).repeatable;
}

function validateGroup(options, rawValue) {
  const errors = [];
  const warnings = [];
  const items = options.repeatable ? safeArray(rawValue) : [rawValue && typeof rawValue === "object" ? rawValue : {}];

  const schemaValidation = validateFieldGroupSchema({
    repeatable: options.repeatable,
    ...(options.entryKey ? { entryKey: options.entryKey } : {}),
    minItems: options.minItems,
    maxItems: options.maxItems,
    fields: options.rawFields,
    validations: options.validations,
  }, { allowPersistence: !options.strictSchema });
  schemaValidation.errors.forEach((issue) => {
    const normalizedIssue = toValidationIssue(issue, options.name);
    if (options.strictSchema) {
      errors.push(normalizedIssue);
    } else {
      warnings.push({ ...normalizedIssue, severity: "warning", message: normalizedIssue.error });
    }
  });

  if (options.repeatable && items.length < options.minItems) {
    errors.push(createValidationIssue(
      "FIELD_GROUP_MIN_ITEMS",
      options.name,
      `At least ${options.minItems} ${options.minItems === 1 ? "entry is" : "entries are"} required.`
    ));
  }
  if (options.repeatable && options.maxItems != null && items.length > options.maxItems) {
    errors.push(createValidationIssue(
      "FIELD_GROUP_MAX_ITEMS",
      options.name,
      `No more than ${options.maxItems} ${options.maxItems === 1 ? "entry is" : "entries are"} allowed.`
    ));
  }
  if (options.repeatable && options.entryKey) {
    const identities = new Map();
    items.forEach((item, index) => {
      const identity = String(item?.[options.entryKey] ?? "").trim();
      const path = `${options.name}.${index}.${options.entryKey}`;
      if (!identity) {
        errors.push(createValidationIssue("FIELD_GROUP_ENTRY_KEY_MISSING", path, "Repeatable entry identity is missing."));
      } else if (identities.has(identity)) {
        errors.push(createValidationIssue("FIELD_GROUP_ENTRY_KEY_DUPLICATE", path, `Repeatable entry identity "${identity}" is duplicated.`));
      } else {
        identities.set(identity, index);
      }
    });
  }

  if (options.required && (!items.length || items.every((item) => isEmptyItem(item, options.fields)))) {
    errors.push(createValidationIssue("FIELD_GROUP_REQUIRED", options.name, "Required group entry is missing"));
  }

  items.forEach((item, index) => {
    options.fields.forEach((field) => {
      if (!isFieldVisibleForItem(field, item)) {
        return;
      }
      const childKey = getFieldKey(field);
      const childValue = item && typeof item === "object" ? item[childKey] : "";
      const trimmed = String(childValue ?? "").trim();
      const nestedKey = options.repeatable ? `${options.name}.${index}.${childKey}` : `${options.name}.${childKey}`;

      if (isRequiredField(field) && !trimmed) {
        errors.push(createValidationIssue("FIELD_GROUP_REQUIRED", nestedKey, "Required value is missing"));
      }

      const typeIssue = validateFieldValueType(field, childValue, nestedKey);
      if (typeIssue) {
        errors.push(typeIssue);
      }

      const optionIssue = validateFieldOptionMembership(field, childValue, nestedKey);
      if (optionIssue) {
        errors.push(optionIssue);
      }

      if (typeof childValue === "string") {
        if (field?.minlength != null && childValue.length < Number(field.minlength)) {
          errors.push(createValidationIssue("FIELD_GROUP_STRING_TOO_SHORT", nestedKey, `Value must contain at least ${field.minlength} characters.`));
        }
        if (field?.maxlength != null && childValue.length > Number(field.maxlength)) {
          errors.push(createValidationIssue("FIELD_GROUP_STRING_TOO_LONG", nestedKey, `Value must contain no more than ${field.maxlength} characters.`));
        }
        if (field?.pattern) {
          try {
            if (!new RegExp(String(field.pattern)).test(childValue)) {
              errors.push(createValidationIssue("FIELD_GROUP_PATTERN_MISMATCH", nestedKey, "Value does not match the required pattern."));
            }
          } catch (_) {
            errors.push(createValidationIssue("FIELD_GROUP_PATTERN_INVALID", nestedKey, "Configured validation pattern is invalid."));
          }
        }
      }

      if (isNumberFieldType(field) && trimmed) {
        const numeric = Number(trimmed);
        if (!Number.isFinite(numeric)) {
          errors.push(createValidationIssue("FIELD_GROUP_NUMBER_INVALID", nestedKey, "Value must be a valid number"));
        } else {
          if (field?.min !== null && field?.min !== undefined && field?.min !== "" && numeric < Number(field.min)) {
            errors.push(createValidationIssue("FIELD_GROUP_NUMBER_BELOW_MIN", nestedKey, `Value must be >= ${field.min}`));
          }
          if (field?.max !== null && field?.max !== undefined && field?.max !== "" && numeric > Number(field.max)) {
            errors.push(createValidationIssue("FIELD_GROUP_NUMBER_ABOVE_MAX", nestedKey, `Value must be <= ${field.max}`));
          }
        }
      }
    });
    safeArray(options.validations).forEach((rule) => {
      if (!shouldEvaluateValidationRule(rule, item, options, index)) {
        return;
      }
      const result = evaluateValidationRule(rule, item, options, index);
      if (!result) {
        return;
      }
      if (result.severity === "error") {
        errors.push(createValidationIssue(result.code || "FIELD_GROUP_RULE_FAILED", result.field_key, result.message, result.related_fields));
      } else {
        warnings.push({
          ...createValidationIssue(result.code || "FIELD_GROUP_RULE_WARNING", result.field_key, result.message, result.related_fields),
          severity: "warning",
          message: result.message,
        });
      }
    });
  });

  return {
    status: errors.length === 0,
    errors,
    warnings,
  };
}

function normalizeOptions(options = {}) {
  const name = getFieldKey(options) || String(options.name || "");
  const config = getFieldConfig(options);
  const preset = resolvePresetOptions(options, config);
  const candidateFields = Object.prototype.hasOwnProperty.call(options, "rawFields") ? options.rawFields : options.fields;
  const rawFields = hasUsableFields(candidateFields) ? candidateFields : preset?.fields ?? candidateFields;
  const fieldRows = normalizeChildFieldRows({ fields: rawFields });
  const fields = flattenFieldRows(fieldRows);
  const strictSchema = parseBoolean(options?.strictSchema ?? options?.strict_schema ?? config?.strictSchema ?? config?.strict_schema ?? preset?.strictSchema ?? false);
  const itemBoundsConfigured = Object.prototype.hasOwnProperty.call(options, "itemBoundsConfigured")
    ? Boolean(options.itemBoundsConfigured)
    : [options, config, preset].some((source) => source && ["minItems", "min_items"].some((key) => Object.prototype.hasOwnProperty.call(source, key)));
  const minItems = normalizeItemBound(options?.minItems ?? options?.min_items ?? config?.minItems ?? config?.min_items ?? preset?.minItems ?? DEFAULT_OPTIONS.minItems, DEFAULT_OPTIONS.minItems);
  const maxItems = normalizeItemBound(options?.maxItems ?? options?.max_items ?? config?.maxItems ?? config?.max_items ?? preset?.maxItems ?? DEFAULT_OPTIONS.maxItems, null);
  const normalized = {
    ...DEFAULT_OPTIONS,
    ...(preset || {}),
    ...(options || {}),
    name,
    label: getFieldLabel(options, config?.preset_label ?? preset?.label ?? (name || "Group")),
    repeatable: Boolean(options?.repeatable ?? options?.multiple ?? config?.repeatable ?? preset?.repeatable),
    required: isRequiredField(options),
    chrome: options?.chrome !== false,
    fieldLayoutDensity: (options?.fieldLayoutDensity ?? config?.fieldLayoutDensity ?? preset?.fieldLayoutDensity) === "compact" ? "compact" : "standard",
    fieldLayout: (options?.fieldLayout ?? config?.fieldLayout ?? preset?.fieldLayout) === "horizontal" ? "horizontal" : "stacked",
    autoValidate: parseBoolean(options?.autoValidate ?? options?.validateOnChange ?? config?.autoValidate ?? config?.validateOnChange ?? preset?.autoValidate ?? true),
    entryKey: String(options?.entryKey ?? options?.entry_key ?? config?.entryKey ?? config?.entry_key ?? preset?.entryKey ?? "").trim(),
    preserveEntryKeys: parseBoolean(options?.preserveEntryKeys ?? options?.preserve_entry_keys ?? config?.preserveEntryKeys ?? config?.preserve_entry_keys ?? preset?.preserveEntryKeys ?? false),
    createEntryKey: typeof options?.createEntryKey === "function" ? options.createEntryKey : typeof options?.entryKeyFactory === "function" ? options.entryKeyFactory : null,
    minItems,
    itemBoundsConfigured,
    maxItems: maxItems == null ? null : Math.max(minItems, maxItems),
    allowRemove: parseBoolean(options?.allowRemove ?? options?.allow_remove ?? config?.allowRemove ?? config?.allow_remove ?? preset?.allowRemove ?? true),
    allowReorder: parseBoolean(options?.allowReorder ?? options?.allow_reorder ?? config?.allowReorder ?? config?.allow_reorder ?? preset?.allowReorder ?? false),
    strictSchema,
    rawFields: cloneFieldDefinitions(rawFields),
    fieldRows,
    fields: flattenFieldDefinitions(fields),
    validations: cloneValidations(options?.validations ?? preset?.validations ?? config?.validations ?? []),
  };
  if (strictSchema) {
    const schemaValidation = validateFieldGroupSchema({
      repeatable: normalized.repeatable,
      ...(normalized.entryKey ? { entryKey: normalized.entryKey } : {}),
      minItems: normalized.minItems,
      maxItems: normalized.maxItems,
      fields: normalized.rawFields,
      validations: normalized.validations,
    }, { allowPersistence: false });
    if (!schemaValidation.status) {
      throw new FieldGroupSchemaError(
        `Invalid Field Group schema: ${schemaValidation.errors[0]?.message || "schema validation failed"}`,
        schemaValidation.errors
      );
    }
  }
  return normalized;
}

function evaluateValidationRule(rule, item, options, index) {
  if (!rule || typeof rule !== "object") {
    return null;
  }
  const type = String(rule.type || "").toLowerCase();
  const relatedFields = safeArray(rule.related_fields ?? rule.relatedFields);
  const field = String(rule.field || rule.key || "").trim();
  const fields = safeArray(rule.fields).map((key) => String(key || "").trim()).filter(Boolean);
  const targetField = field || fields[0] || String(rule.maxField || rule.max_field || "").trim();
  const fieldKey = buildNestedFieldKey(options, index, targetField || options.name);
  const severity = String(rule.severity || "warning").toLowerCase() === "error" ? "error" : "warning";
  const when = rule.when ?? rule.visibleWhen ?? rule.visible_when;
  if (when && !matchesVisibleWhen(when, item)) {
    return null;
  }

  if (type === "required" || type === "required_when") {
    const value = getItemValue(item, field);
    if (!field || !isEmptyFieldValue(value)) {
      return null;
    }
    return {
      field_key: fieldKey,
      message: rule.message || `${getHumanFieldLabel(options, field)} is required.`,
      related_fields: [...new Set([field, ...Object.keys(when || {}), ...relatedFields].filter(Boolean))],
      severity,
      code: "FIELD_GROUP_REQUIRED_WHEN",
    };
  }

  if (type === "empty" || type === "empty_when" || type === "forbidden_when") {
    const value = getItemValue(item, field);
    if (!field || isEmptyFieldValue(value)) {
      return null;
    }
    return {
      field_key: fieldKey,
      message: rule.message || `${getHumanFieldLabel(options, field)} should be empty.`,
      related_fields: [...new Set([field, ...Object.keys(when || {}), ...relatedFields].filter(Boolean))],
      severity,
      code: "FIELD_GROUP_FORBIDDEN_WHEN",
    };
  }

  if (type === "lte" || type === "max") {
    const value = getNumericItemValue(item, field);
    const max = getRuleMax(rule, item);
    if (!field || max == null || value <= max) {
      return null;
    }
    return {
      field_key: fieldKey,
      message: rule.message || `${getHumanFieldLabel(options, field)} should not exceed ${getRuleMaxLabel(rule, options)}.`,
      related_fields: [...new Set([field, String(rule.maxField || rule.max_field || "").trim(), ...relatedFields].filter(Boolean))],
      severity,
      code: "FIELD_GROUP_NUMBER_RELATION_INVALID",
    };
  }

  if (type === "sum_lte" || type === "sum_max") {
    const sum = fields.reduce((total, key) => total + getNumericItemValue(item, key), 0);
    const max = getRuleMax(rule, item);
    if (!fields.length || max == null || sum <= max) {
      return null;
    }
    return {
      field_key: fieldKey,
      message: rule.message || `${fields.map((key) => getHumanFieldLabel(options, key)).join(" + ")} should not exceed ${getRuleMaxLabel(rule, options)}.`,
      related_fields: [...new Set([...fields, String(rule.maxField || rule.max_field || "").trim(), ...relatedFields].filter(Boolean))],
      severity,
      code: "FIELD_GROUP_SUM_ABOVE_MAX",
    };
  }

  if (type === "sum_eq" || type === "sum_equals") {
    const sum = fields.reduce((total, key) => total + getNumericItemValue(item, key), 0);
    const max = getRuleMax(rule, item);
    if (!fields.length || max == null || sum === max) {
      return null;
    }
    return {
      field_key: fieldKey,
      message: rule.message || `${fields.map((key) => getHumanFieldLabel(options, key)).join(" + ")} should equal ${getRuleMaxLabel(rule, options)}.`,
      related_fields: [...new Set([...fields, String(rule.maxField || rule.max_field || "").trim(), ...relatedFields].filter(Boolean))],
      severity,
      code: "FIELD_GROUP_SUM_NOT_EQUAL",
    };
  }

  if (type === "min_lte_max") {
    const minField = String(rule.minField ?? rule.min_field ?? fields[0] ?? "").trim();
    const maxField = String(rule.maxField ?? rule.max_field ?? fields[1] ?? "").trim();
    const minValue = getItemValue(item, minField);
    const maxValue = getItemValue(item, maxField);
    if (!minField || !maxField || isEmptyFieldValue(minValue) || isEmptyFieldValue(maxValue) || Number(minValue) <= Number(maxValue)) {
      return null;
    }
    return {
      field_key: buildNestedFieldKey(options, index, maxField),
      message: rule.message || `${getHumanFieldLabel(options, maxField)} must be greater than or equal to ${getHumanFieldLabel(options, minField)}.`,
      related_fields: [minField, maxField],
      severity,
      code: "FIELD_GROUP_MIN_MAX_RELATION_INVALID",
    };
  }

  return null;
}

function getValidationRuleMessage(rule, options) {
  if (rule?.message) {
    return String(rule.message);
  }
  const type = String(rule?.type || "").toLowerCase();
  const field = String(rule?.field || rule?.key || "").trim();
  const fields = safeArray(rule?.fields).map((key) => String(key || "").trim()).filter(Boolean);
  if (type === "lte" || type === "max") {
    return `${getHumanFieldLabel(options, field)} should not exceed ${getRuleMaxLabel(rule, options)}.`;
  }
  if (type === "required" || type === "required_when") {
    return `${getHumanFieldLabel(options, field)} is required.`;
  }
  if (type === "empty" || type === "empty_when" || type === "forbidden_when") {
    return `${getHumanFieldLabel(options, field)} should be empty.`;
  }
  if (type === "sum_eq" || type === "sum_equals") {
    return `${fields.map((key) => getHumanFieldLabel(options, key)).join(" + ")} should equal ${getRuleMaxLabel(rule, options)}.`;
  }
  if (type === "sum_lte" || type === "sum_max") {
    return `${fields.map((key) => getHumanFieldLabel(options, key)).join(" + ")} should not exceed ${getRuleMaxLabel(rule, options)}.`;
  }
  return "Check this breakdown.";
}

function shouldEvaluateValidationRule(rule, item, options, index) {
  const breakdown = getRuleBreakdownContext(rule, options);
  if (!breakdown) {
    return true;
  }
  const stateKey = `${index}:${breakdown.parentKey}`;
  if (options.enabledBreakdowns?.has?.(stateKey)) {
    return true;
  }
  if (breakdown.defaultOpen && !options.collapsedBreakdowns?.has?.(stateKey)) {
    return true;
  }
  return false;
}

function getRuleBreakdownContext(rule, options) {
  const keys = getValidationRuleKeys(rule);
  if (!keys.length) {
    return null;
  }
  for (const field of safeArray(options.fieldRows).flatMap((row) => safeArray(row))) {
    const parentKey = getFieldKey(field);
    const breakdown = normalizeBreakdown(field);
    if (!parentKey || !breakdown) {
      continue;
    }
    const breakdownKeys = getBreakdownFieldKeys(breakdown);
    const matchedKeys = keys.filter((key) => breakdownKeys.includes(key));
    if (matchedKeys.length) {
      return {
        parentKey,
        defaultOpen: Boolean(breakdown.defaultOpen),
        keys: matchedKeys,
      };
    }
  }
  return null;
}

function getValidationRuleKeys(rule) {
  return [
    String(rule?.field || rule?.key || "").trim(),
    ...safeArray(rule?.fields).map((key) => String(key || "").trim()),
    String(rule?.maxField || rule?.max_field || "").trim(),
    ...safeArray(rule?.related_fields ?? rule?.relatedFields).map((key) => String(key || "").trim()),
  ].filter(Boolean);
}

function getRuleMax(rule, item) {
  const maxField = String(rule.maxField || rule.max_field || "").trim();
  if (maxField) {
    return getNumericItemValue(item, maxField);
  }
  if (rule.max !== null && rule.max !== undefined && rule.max !== "") {
    const max = Number(rule.max);
    return Number.isFinite(max) ? max : null;
  }
  return null;
}

function getRuleMaxLabel(rule, options) {
  const maxField = String(rule.maxField || rule.max_field || "").trim();
  return maxField ? getHumanFieldLabel(options, maxField) : String(rule.max);
}

function getNumericItemValue(item, key) {
  const number = Number(item && typeof item === "object" ? item[key] ?? 0 : 0);
  return Number.isFinite(number) ? number : 0;
}

function getItemValue(item, key) {
  if (!item || typeof item !== "object") {
    return "";
  }
  return item[key];
}

function isEmptyFieldValue(value) {
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (value && typeof value === "object") {
    return Object.keys(value).length === 0;
  }
  return String(value ?? "").trim() === "";
}

function getHumanFieldLabel(options, key) {
  const field = safeArray(options.fields).find((candidate) => getFieldKey(candidate) === key);
  return field ? getFieldLabel(field, key) : String(key || "value").replace(/_/g, " ");
}

function buildNestedFieldKey(options, index, key) {
  if (!options.name) {
    return options.repeatable ? `${index}.${key}` : String(key);
  }
  return options.repeatable ? `${options.name}.${index}.${key}` : `${options.name}.${key}`;
}

function getItemPathPrefix(options, index) {
  if (!options.name) {
    return options.repeatable ? `${index}.` : "";
  }
  return options.repeatable ? `${options.name}.${index}.` : `${options.name}.`;
}

function getLastPathSegment(path) {
  const parts = String(path || "").split(".");
  return parts[parts.length - 1] || "";
}

function cssEscape(value) {
  if (globalThis.CSS && typeof globalThis.CSS.escape === "function") {
    return globalThis.CSS.escape(String(value));
  }
  return String(value).replace(/["\\]/g, "\\$&");
}

function getBreakdownFieldKeys(breakdown) {
  return flattenFieldDefinitions(flattenFieldRows(normalizeChildFieldRows({ fields: breakdown?.fields }))).map(getFieldKey).filter(Boolean);
}

function renderIssueBadge(issues) {
  if (!safeArray(issues).length) {
    return null;
  }
  const hasErrors = safeArray(issues).some((issue) => issue.severity === "error");
  const badge = document.createElement("span");
  badge.className = [
    "ui-field-group-warning-badge",
    hasErrors ? "is-error" : "",
  ].filter(Boolean).join(" ");
  badge.textContent = "!";
  badge.title = safeArray(issues).map((warning) => warning.message || warning.warning || warning.error).filter(Boolean).join("\n");
  return badge;
}

function cloneValidations(validations) {
  return safeArray(validations).map((rule) => (rule && typeof rule === "object" && !Array.isArray(rule) ? { ...rule } : null)).filter(Boolean);
}

function validationIssueSignature(validation) {
  return JSON.stringify({
    errors: safeArray(validation?.errors).map((item) => ({
      field_key: item?.field_key || "",
      message: item?.message || item?.error || "",
      related_fields: safeArray(item?.related_fields).join("|"),
    })),
    warnings: safeArray(validation?.warnings).map((item) => ({
      field_key: item?.field_key || "",
      message: item?.message || item?.warning || "",
      related_fields: safeArray(item?.related_fields).join("|"),
    })),
  });
}

function normalizeValidationIssues(validation) {
  return [
    ...safeArray(validation?.errors).map((item) => ({
      ...item,
      message: item?.message || item?.error || "",
      severity: "error",
    })),
    ...safeArray(validation?.warnings).map((item) => ({
      ...item,
      message: item?.message || item?.warning || "",
      severity: "warning",
    })),
  ];
}

function resolvePresetOptions(options = {}, config = {}) {
  const presetName = String(options?.preset ?? options?.field_preset ?? config?.preset ?? "").trim();
  const presetFactory = presetName ? fieldGroupPresets[presetName] : null;
  if (typeof presetFactory !== "function") {
    if (presetName && parseBoolean(options?.strictSchema ?? options?.strict_schema ?? config?.strictSchema ?? config?.strict_schema ?? false)) {
      throw new Error(`Unknown Field Group preset "${presetName}".`);
    }
    return null;
  }

  const overrides = {};
  if (config?.preset_label && !Object.prototype.hasOwnProperty.call(options, "label") && !Object.prototype.hasOwnProperty.call(options, "field_label")) {
    overrides.label = config.preset_label;
  }
  if (
    Object.prototype.hasOwnProperty.call(config, "repeatable")
    && !Object.prototype.hasOwnProperty.call(options, "repeatable")
    && !Object.prototype.hasOwnProperty.call(options, "multiple")
  ) {
    overrides.repeatable = parseBoolean(config.repeatable);
  }

  return presetFactory(overrides);
}

function getFieldConfig(field = {}) {
  const directConfig = field?.config ?? field?.field_config;
  if (directConfig && typeof directConfig === "object" && !Array.isArray(directConfig)) {
    return directConfig;
  }

  const rawConfig = field?.config_json ?? field?.configJson;
  if (rawConfig && typeof rawConfig === "object" && !Array.isArray(rawConfig)) {
    return rawConfig;
  }
  if (typeof rawConfig === "string" && rawConfig.trim()) {
    try {
      const parsed = JSON.parse(rawConfig);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  return {};
}

function hasUsableFields(fields) {
  return safeArray(fields).some((field) => {
    if (Array.isArray(field)) {
      return field.some((child) => child && typeof child === "object" && !Array.isArray(child));
    }
    return field && typeof field === "object";
  });
}

function parseBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  const normalized = String(value ?? "").trim().toLowerCase();
  if (["false", "0", "no", "off"].includes(normalized)) {
    return false;
  }
  if (["true", "1", "yes", "on"].includes(normalized)) {
    return true;
  }
  return Boolean(value);
}

function normalizeValue(rawValue, options, meta = {}) {
  if (options.repeatable) {
    if (Array.isArray(rawValue)) {
      return rawValue.map((item) => normalizeItem(item, options, meta));
    }
    if (rawValue && typeof rawValue === "object") {
      return [normalizeItem(rawValue, options, meta)];
    }
    return [];
  }
  return normalizeItem(rawValue, options, meta);
}

function normalizeItem(rawValue, options, meta = {}) {
  const source = rawValue && typeof rawValue === "object" && !Array.isArray(rawValue) ? rawValue : {};
  const item = options.fields.reduce((acc, field) => {
    const key = getFieldKey(field);
    if (key && !isComputedField(field)) {
      acc[key] = normalizeFieldValue(field, source[key] ?? field?.default_value ?? "", meta);
    }
    return acc;
  }, {});
  if (options.entryKey && options.repeatable) {
    const existingKey = source[options.entryKey];
    item[options.entryKey] = existingKey != null && String(existingKey).trim()
      ? existingKey
      : createRepeatableEntryKey(options);
  }
  applyComputedValues(item, options.fields, "", source);
  return item;
}

function normalizeFieldValue(field, value, meta = {}) {
  const type = getFieldType(field);
  if (type === "number-stepper" || type === "number_stepper") {
    const allowEmpty = field?.allowEmpty ?? !isRequiredField(field);
    if (value == null || value === "") {
      return allowEmpty ? null : Number(field?.min ?? 0);
    }
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return meta.clampNumbers === false ? value : allowEmpty ? null : Number(field?.min ?? 0);
    }
    if (meta.clampNumbers === false) {
      return number;
    }
    let next = number;
    if (field?.min !== null && field?.min !== undefined && field?.min !== "") {
      next = Math.max(next, Number(field.min));
    }
    if (field?.max !== null && field?.max !== undefined && field?.max !== "") {
      next = Math.min(next, Number(field.max));
    }
    return next;
  }
  return value;
}

function applyComputedValues(item, fields, changedKey = "", source = null) {
  if (!item || typeof item !== "object") {
    return false;
  }
  let visibleChanged = false;
  safeArray(fields).filter(isComputedField).forEach((field) => {
    const key = getFieldKey(field);
    if (!key) {
      return;
    }
    const computedKeys = getComputedFieldKeys(field);
    if (changedKey && !computedKeys.includes(changedKey)) {
      return;
    }
    const next = computeFieldValue(field, item, source);
    if (item[key] !== next) {
      item[key] = next;
      if (!isHiddenField(field)) {
        visibleChanged = true;
      }
    }
  });
  return visibleChanged;
}

function isComputedField(field) {
  return Boolean(field?.computed);
}

function isHiddenField(field) {
  return parseBoolean(field?.hidden ?? field?.is_hidden ?? false);
}

function isFieldVisibleForItem(field, item) {
  if (isHiddenField(field)) {
    return false;
  }
  return matchesVisibleWhen(field?.visibleWhen ?? field?.visible_when, item);
}

function matchesVisibleWhen(rule, item) {
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
    return true;
  }
  if (Object.prototype.hasOwnProperty.call(rule, "all")) {
    return safeArray(rule.all).every((condition) => matchesVisibleWhen(condition, item));
  }
  if (Object.prototype.hasOwnProperty.call(rule, "any")) {
    return safeArray(rule.any).some((condition) => matchesVisibleWhen(condition, item));
  }
  if (Object.prototype.hasOwnProperty.call(rule, "not") && Object.keys(rule).length === 1) {
    return !matchesVisibleWhen(rule.not, item);
  }
  if (Object.prototype.hasOwnProperty.call(rule, "field")) {
    return matchesFieldCondition(rule, item);
  }
  return Object.keys(rule).every((key) => {
    const expected = rule[key];
    const actual = item && typeof item === "object" ? item[key] : undefined;
    if (Array.isArray(expected)) {
      return expected.map(String).includes(String(actual ?? ""));
    }
    if (expected && typeof expected === "object" && !Array.isArray(expected)) {
      if (Object.prototype.hasOwnProperty.call(expected, "not")) {
        const denied = Array.isArray(expected.not) ? expected.not.map(String) : [String(expected.not)];
        return !denied.includes(String(actual ?? ""));
      }
      if (Object.prototype.hasOwnProperty.call(expected, "in")) {
        return safeArray(expected.in).map(String).includes(String(actual ?? ""));
      }
    }
    return String(actual ?? "") === String(expected);
  });
}

function matchesFieldCondition(rule, item) {
  const key = String(rule?.field || "");
  const actual = item && typeof item === "object" ? item[key] : undefined;
  if (Object.prototype.hasOwnProperty.call(rule, "eq")) {
    return String(actual ?? "") === String(rule.eq ?? "");
  }
  if (Object.prototype.hasOwnProperty.call(rule, "in")) {
    return safeArray(rule.in).map(String).includes(String(actual ?? ""));
  }
  if (Object.prototype.hasOwnProperty.call(rule, "notIn")) {
    return !safeArray(rule.notIn).map(String).includes(String(actual ?? ""));
  }
  if (Object.prototype.hasOwnProperty.call(rule, "present")) {
    return Boolean(rule.present) === Object.prototype.hasOwnProperty.call(item || {}, key);
  }
  if (Object.prototype.hasOwnProperty.call(rule, "notEmpty")) {
    return Boolean(rule.notEmpty) === !isEmptyFieldValue(actual);
  }
  return false;
}

function applyHiddenValuePolicy(previousItem, nextItem, fields) {
  safeArray(fields).forEach((field) => {
    const key = getFieldKey(field);
    if (!key || !parseBoolean(field?.clearWhenHidden ?? field?.clear_when_hidden ?? false)) {
      return;
    }
    const wasVisible = isFieldVisibleForItem(field, previousItem);
    const isVisible = isFieldVisibleForItem(field, nextItem);
    if (wasVisible && !isVisible) {
      nextItem[key] = normalizeFieldValue(field, field?.default_value ?? "");
    }
  });
}

function visibilitySignature(item, fieldRows) {
  return safeArray(fieldRows).flatMap((row) => safeArray(row))
    .filter((field) => field && getFieldKey(field))
    .map((field) => `${getFieldKey(field)}:${isFieldVisibleForItem(field, item) ? "1" : "0"}`)
    .join("|");
}

function getComputedFieldKeys(field) {
  const computed = field?.computed;
  const expression = typeof computed === "string" ? computed : computed?.expression;
  const template = typeof computed === "object" && computed ? computed.template : "";
  return String(expression || template || "").match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
}

function computeFieldValue(field, item, source = null) {
  const computed = field?.computed;
  const expression = typeof computed === "string" ? computed : computed?.expression;
  const template = typeof computed === "object" && computed ? computed.template : "";
  if (template) {
    const rendered = String(template).replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (_, key) => String(item[key] ?? "").trim());
    const normalized = normalizeComputedTemplateValue(rendered);
    if (normalized) {
      return normalizeFieldValue(field, normalized);
    }
    const fallbackKey = String(computed.fallbackKey ?? computed.fallback_key ?? "").trim();
    if (fallbackKey && source && typeof source === "object") {
      return normalizeFieldValue(field, source[fallbackKey] ?? "");
    }
    return normalizeFieldValue(field, "");
  }
  if (!expression) {
    return normalizeFieldValue(field, field?.default_value ?? "");
  }
  const total = String(expression).split("+").reduce((sum, token) => {
    const key = token.trim();
    if (!key) {
      return sum;
    }
    const literal = Number(key);
    if (Number.isFinite(literal)) {
      return sum + literal;
    }
    const value = Number(item[key] ?? 0);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
  return normalizeFieldValue(field, total);
}

function normalizeComputedTemplateValue(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/,\s*/g, ", ")
    .replace(/^[,\s]+|[,\s]+$/g, "")
    .trim();
}

function createEmptyItem(options) {
  if (options.emptyItem && typeof options.emptyItem === "object" && !Array.isArray(options.emptyItem)) {
    return normalizeItem(options.emptyItem, options);
  }
  return normalizeItem({}, options);
}

function createRepeatableEntryKey(options) {
  if (typeof options?.createEntryKey === "function") {
    const generated = options.createEntryKey();
    if (generated != null && String(generated).trim()) {
      return generated;
    }
  }
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `entry-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getFieldKey(field) {
  return String(field?.field_key ?? field?.key ?? field?.name ?? "");
}

function getFieldLabel(field, fallback = "Field") {
  return String(field?.field_label ?? field?.label ?? fallback);
}

function getFieldType(field) {
  return String(field?.input_type ?? field?.type ?? field?.input ?? "text").toLowerCase();
}

function isRequiredField(field) {
  return Boolean(field?.is_required ?? field?.required);
}

function normalizeChildFieldRows(field) {
  const rawFields = safeArray(field?.fields);
  const allSingleRows = rawFields.every((child) => !Array.isArray(child));
  const rows = rawFields.map((child, rowIndex) => {
    const sourceFields = Array.isArray(child) ? child : [child];
    return sourceFields
      .map((sourceField) => {
        if (!sourceField || typeof sourceField !== "object" || Array.isArray(sourceField)) {
          return null;
        }
        return sourceField;
      })
      .map((sourceField, columnIndex) => ({
        ...(sourceField || {}),
        sort_order: sourceField?.sort_order ?? rowIndex + 1,
        column_order: sourceField?.column_order ?? columnIndex + 1,
      }))
      .sort((a, b) => Number(a?.column_order || 0) - Number(b?.column_order || 0))
      .map((sourceField) => (getFieldKey(sourceField) ? sourceField : null));
  }).filter((row) => row.some((sourceField) => sourceField && typeof sourceField === "object"));

  if (allSingleRows) {
    return rows.sort((a, b) => Number(a?.find(Boolean)?.sort_order || 0) - Number(b?.find(Boolean)?.sort_order || 0));
  }

  return rows;
}

function flattenFieldRows(rows) {
  return safeArray(rows).flatMap((row) => safeArray(row));
}

function flattenFieldDefinitions(fields) {
  const result = [];
  safeArray(fields).forEach((field) => {
    if (!field || typeof field !== "object" || Array.isArray(field)) {
      return;
    }
    result.push(field);
    const breakdown = normalizeBreakdown(field);
    if (breakdown) {
      result.push(...flattenFieldDefinitions(flattenFieldRows(normalizeChildFieldRows({ fields: breakdown.fields }))));
    }
  });
  return result;
}

function normalizeBreakdown(field) {
  const source = field?.breakdown;
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return null;
  }
  const fields = source.fields;
  if (!hasUsableFields(fields)) {
    return null;
  }
  return {
    ...source,
    label: String(source.label || `${getFieldLabel(field, getFieldKey(field))} breakdown`),
    fields,
    defaultOpen: Boolean(source.defaultOpen),
  };
}

function cloneFieldDefinitions(fields) {
  return safeArray(fields)
    .map((field) => {
      if (Array.isArray(field)) {
        const cloned = field
          .map((child) => (child && typeof child === "object" && !Array.isArray(child) ? { ...child } : null));
        return cloned.some(Boolean) ? cloned : null;
      }
      return field && typeof field === "object" ? { ...field } : null;
    })
    .filter(Boolean);
}

function normalizeOptionsList(options) {
  return safeArray(options).map((option) => {
    if (option == null) {
      return null;
    }
    if (typeof option === "string" || typeof option === "number") {
      const value = String(option);
      return { label: value, value };
    }
    const label = String(option.label ?? option.value ?? "").trim();
    const value = String(option.value ?? option.label ?? "").trim();
    if (!label && !value) {
      return null;
    }
    return { label: label || value, value: value || label };
  }).filter(Boolean);
}

function getControlValue(control, field) {
  if (getFieldType(field) === "multiselect") {
    return safeArray(control.querySelectorAll('input[type="checkbox"]:checked'))
      .map((checkbox) => checkbox.value)
      .join(",");
  }
  if (getFieldType(field) === "checkbox-group") {
    return control.__uiCheckboxGroupInstance?.getValue?.() ?? [];
  }
  if (getFieldType(field) === "checkbox") {
    return control.__uiCheckboxInstance?.getValue?.() ?? false;
  }
  if (["combobox", "suggest", "local-history"].includes(getFieldType(field))) {
    return control.__uiComboboxInstance?.getValue?.() ?? "";
  }
  if (getFieldType(field) === "number-stepper" || getFieldType(field) === "number_stepper") {
    return control.__uiNumberStepperInstance?.getValue?.() ?? "";
  }
  return control.value ?? "";
}

function isNumberFieldType(field) {
  const type = getFieldType(field);
  return type === "number" || type === "number-stepper" || type === "number_stepper";
}

function isSupportedControlType(type) {
  return [
    "text",
    "textarea",
    "number",
    "number-stepper",
    "number_stepper",
    "select",
    "multiselect",
    "checkbox",
    "checkbox-group",
    "combobox",
    "suggest",
    "local-history",
    "notice",
    "message",
  ].includes(String(type || "").toLowerCase());
}

function requiresConfiguredOptions(field) {
  return field?.requiresOptions === true || field?.requires_options === true;
}

function validateFieldValueType(field, value, path) {
  if (value == null || value === "") {
    return null;
  }
  const type = getFieldType(field);
  if (["checkbox-group", "multiselect"].includes(type) && !Array.isArray(value)) {
    return createValidationIssue("FIELD_GROUP_ARRAY_REQUIRED", path, "Value must be an array.");
  }
  if (type === "checkbox" && typeof value !== "boolean" && !Object.prototype.hasOwnProperty.call(field, "checkedValue")) {
    return createValidationIssue("FIELD_GROUP_BOOLEAN_REQUIRED", path, "Value must be a boolean.");
  }
  if (type === "number" && (typeof value === "object" || !Number.isFinite(Number(value)))) {
    return createValidationIssue("FIELD_GROUP_NUMBER_INVALID", path, "Value must be a valid number.");
  }
  if (["text", "textarea", "select", "combobox", "suggest", "local-history"].includes(type) && typeof value === "object") {
    return createValidationIssue("FIELD_GROUP_SCALAR_REQUIRED", path, "Value must be scalar.");
  }
  return null;
}

function validateFieldOptionMembership(field, value, path) {
  const type = getFieldType(field);
  if (!["select", "multiselect", "checkbox-group"].includes(type) || value == null || value === "") {
    return null;
  }
  const allowed = new Set(normalizeOptionsList(field?.options).map((option) => String(option.value)));
  if (!allowed.size) {
    return requiresConfiguredOptions(field)
      ? createValidationIssue("FIELD_GROUP_OPTIONS_REQUIRED", path, "Application-provided choices are required before this field can be used.")
      : null;
  }
  const values = Array.isArray(value) ? value : [value];
  if (values.some((item) => !allowed.has(String(item)))) {
    return createValidationIssue("FIELD_GROUP_OPTION_NOT_ALLOWED", path, "Value must be one of the configured options.");
  }
  if (["multiselect", "checkbox-group"].includes(type)) {
    if (field?.min != null && values.length < Number(field.min)) {
      return createValidationIssue("FIELD_GROUP_SELECTION_BELOW_MIN", path, `Select at least ${field.min} options.`);
    }
    if (field?.max != null && values.length > Number(field.max)) {
      return createValidationIssue("FIELD_GROUP_SELECTION_ABOVE_MAX", path, `Select no more than ${field.max} options.`);
    }
  }
  return null;
}

function createValidationIssue(code, fieldKey, message, relatedFields = undefined) {
  return {
    code,
    path: String(fieldKey || ""),
    field_key: String(fieldKey || ""),
    severity: "error",
    message: String(message || ""),
    error: String(message || ""),
    ...(relatedFields ? { related_fields: relatedFields } : {}),
  };
}

function toValidationIssue(issue, fallbackPath) {
  const path = issue?.path && issue.path !== "$" ? issue.path : fallbackPath;
  return createValidationIssue(
    issue?.code || "FIELD_GROUP_SCHEMA_INVALID",
    path,
    issue?.message || issue?.error || "Field Group schema is invalid."
  );
}

function normalizeItemBound(value, fallback) {
  if (value == null || value === "") {
    return fallback;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.floor(numeric)) : fallback;
}

function applyCommonAttrs(control, field) {
  if (isRequiredField(field)) {
    control.required = true;
  }
  if (field?.disabled) {
    control.disabled = true;
  }
  if (field?.readonly) {
    control.readOnly = true;
  }
  if (field?.placeholder && "placeholder" in control) {
    control.placeholder = String(field.placeholder);
  }
  ["min", "max", "step", "autocomplete", "inputmode", "pattern"].forEach((attr) => {
    if (field?.[attr] !== null && field?.[attr] !== undefined && field?.[attr] !== "") {
      control.setAttribute(attr, String(field[attr]));
    }
  });
}

function isEmptyItem(item, fields) {
  if (!item || typeof item !== "object") {
    return true;
  }
  return fields.filter((field) => isFieldVisibleForItem(field, item)).every((field) => !String(item[getFieldKey(field)] ?? "").trim());
}

function clearNode(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function cloneValue(value) {
  try {
    return structuredClone(value);
  } catch (_) {
    return JSON.parse(JSON.stringify(value));
  }
}
