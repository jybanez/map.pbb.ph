import { setFieldError } from "./ui.field.error.js?v=0.21.195";
import { createElement, clearNode } from "./ui.dom.js";
import { createActionModal } from "./ui.modal.js?v=0.21.235";
import { createNumberStepper } from "./ui.number.stepper.js";
import { createPasswordField } from "./ui.password.js?v=0.21.64";
import { createSelect } from "./ui.select.js";
import { createToggleGroup } from "./ui.toggle.group.js";
import { createDatepicker } from "./ui.datepicker.js?v=0.21.197";
import { createTreeSelect } from "./ui.tree.select.js";

const FORM_MODAL_STYLE_PATHS = [
  "../../css/ui/ui.tokens.css",
  "../../css/ui/ui.field.error.css?v=0.21.195",
  "../../css/ui/ui.components.css",
  "../../css/ui/ui.modal.css",
  "../../css/ui/ui.form.modal.css?v=0.21.200",
  "../../css/ui/ui.number.stepper.css",
  "../../css/ui/ui.select.css",
  "../../css/ui/ui.tree.select.css",
  "../../css/ui/ui.password.css",
  "../../css/ui/ui.calendar.css",
  "../../css/ui/ui.datepicker.css",
  "../../css/ui/ui.toggle.css?v=0.21.193",
];
const FORM_MODAL_STYLE_HREFS = FORM_MODAL_STYLE_PATHS.map((path) => new URL(path, import.meta.url).href);

const DEFAULT_OPTIONS = {
  title: "",
  size: "sm",
  className: "",
  ariaLabel: "Form dialog",
  context: null,
  rows: [],
  columns: 2,
  initialValues: null,
  mode: "",
  extraActions: [],
  extraActionsPlacement: "end",
  submitLabel: "Submit",
  cancelLabel: "Cancel",
  showCancelButton: true,
  submitVariant: "primary",
  submitIcon: "",
  cancelIcon: "",
  closeOnSuccess: true,
  busyMessage: "Saving...",
  manageBusyOnSubmit: true,
  onSubmit: null,
  onInvalid: null,
  validate: null,
  onChange: null,
  onClose: null,
};

export function createFormModal(options = {}) {
  let reportingInvalid = false;
  const currentOptions = normalizeOptions(options);
  ensureFormModalStyles(resolveTargetDocument(currentOptions.parent));
  const refs = {
    shell: createElement("div", { className: "ui-form-modal" }),
    form: createElement("form", {
      className: "ui-form-modal-form",
      attrs: { novalidate: "novalidate" },
    }),
    context: createElement("div", {
      className: "ui-form-modal-context",
      attrs: { hidden: "hidden" },
    }),
    rows: createElement("div", { className: "ui-form-modal-rows" }),
    hiddenFields: createElement("div", {
      className: "ui-form-modal-hidden-fields",
      attrs: { hidden: "hidden", "aria-hidden": "true" },
    }),
    formError: createElement("p", {
      className: "ui-form-error ui-form-modal-form-error",
      attrs: { hidden: "hidden" },
    }),
    submitProxy: createElement("button", {
      className: "ui-form-modal-submit-proxy",
      text: "Submit",
      attrs: { type: "submit", tabindex: "-1", "aria-hidden": "true" },
    }),
  };
  refs.form.append(refs.context, refs.rows, refs.hiddenFields, refs.formError, refs.submitProxy);
  refs.shell.appendChild(refs.form);

  const fields = new Map();
  const displays = new Map();
  const valueStore = {};
  let destroyed = false;
  let rendering = false;
  let modal = null;
  let lastVisibilitySignature = "";

  seedStoredValuesFromInitialOptions();

  function destroyHostedFieldInstances() {
    fields.forEach((field) => {
      if (field?.type === "ui.toggle.group") {
        field.control?.__uiToggleGroupInstance?.destroy?.();
      } else if (field?.type === "ui.datepicker") {
        field.control?.__uiDatepickerInstance?.destroy?.();
      } else if (field?.type === "ui.select") {
        field.control?.__uiSelectInstance?.destroy?.();
      } else if (field?.type === "ui.treeselect") {
        field.control?.__uiTreeSelectInstance?.destroy?.();
      } else if (field?.type === "number-stepper") {
        field.control?.__uiNumberStepperInstance?.destroy?.();
      } else if (field?.type === "avatar") {
        field.control?.__uiAvatarFieldInstance?.destroy?.();
      } else if (field?.type === "input") {
        field.control?.__uiPasswordInstance?.destroy?.();
      }
    });
  }

  function resolveItemConfig(item, values = valueStore) {
    if (!item || typeof item !== "object") {
      return item;
    }
    const next = { ...item };
    const mode = currentOptions.mode;
    next.type = normalizeItemType(next.type);
    next.span = normalizeSpan(next.span);
    next._initialValues = currentOptions.initialValues || {};
    next.required = Boolean(next.required) || resolveModeFlag(next.requiredOn, mode);
    if (resolveModeFlag(next.optionalOn, mode)) {
      next.required = false;
    }
    next.readonly = Boolean(next.readonly) || resolveModeFlag(next.readonlyOn, mode);
    next._values = values;
    next._hiddenByRule = resolveModeFlag(next.hiddenOn, mode) || !matchesVisibleWhen(next.visibleWhen, values);
    return next;
  }

  function render(syncBeforeRender = true) {
    rendering = true;
    if (syncBeforeRender) {
      syncValueStoreFromRenderedFields();
    }
    destroyHostedFieldInstances();
    renderContext();
    clearNode(refs.rows);
    clearNode(refs.hiddenFields);
    fields.clear();
    displays.clear();

    normalizeRows(currentOptions.rows).forEach((row, rowIndex) => {
      const resolvedRow = row.map((item) => resolveItemConfig(item, valueStore));
      const visibleItems = resolvedRow.filter((item) => isVisibleRenderableItem(item));
      if (!visibleItems.length) {
        resolvedRow.forEach((item, itemIndex) => {
          if (!item || item._hiddenByRule || item.type !== "hidden") {
            return;
          }
          const hiddenEl = renderItem(item, rowIndex, itemIndex);
          if (hiddenEl) {
            refs.hiddenFields.appendChild(hiddenEl);
          }
        });
        return;
      }
      const maxColumns = currentOptions.columns;
      const rowColumnCount = resolveRowColumnCount(visibleItems, maxColumns);
      const rowEl = createElement("div", {
        className: `ui-form-modal-row is-items-${rowColumnCount}`,
      });
      let warned = false;
      let renderedVisibleCount = 0;

      resolvedRow.forEach((item, itemIndex) => {
        if (!item || item._hiddenByRule) {
          return;
        }
        if (item.type === "hidden") {
          const hiddenEl = renderItem(item, rowIndex, itemIndex);
          if (hiddenEl) {
            refs.hiddenFields.appendChild(hiddenEl);
          }
          return;
        }
        const isVisible = true;
        if (isVisible) {
          renderedVisibleCount += 1;
          if (renderedVisibleCount > maxColumns) {
            if (!warned) {
              console.warn(`[createFormModal] Row ${rowIndex + 1} has ${visibleItems.length} visible items; current options allow at most ${maxColumns}. Rendering first ${maxColumns} visible items only.`);
              warned = true;
            }
            return;
          }
        }
        const itemEl = renderItem(item, rowIndex, itemIndex);
        if (itemEl) {
          rowEl.appendChild(itemEl);
        }
      });

      if (rowEl.childNodes.length) {
        refs.rows.appendChild(rowEl);
      }
    });
    rendering = false;
    lastVisibilitySignature = computeVisibilitySignature();
    if (modal?.isBusy?.()) setBusy(true);
  }

  function renderItem(item, rowIndex, itemIndex) {
    if (!item || typeof item !== "object") {
      return null;
    }
    const type = String(item.type || "").trim().toLowerCase();
    if (type === "text") {
      return createElement("p", {
        className: getItemClassName("ui-form-modal-text", item),
        text: String(item.content || ""),
      });
    }
    if (type === "alert") {
      return createElement("div", {
        className: getItemClassName(`ui-form-modal-alert is-${normalizeTone(item.tone)}`, item),
        text: String(item.content || ""),
        attrs: { role: "alert" },
      });
    }
    if (type === "divider") {
      return createElement("hr", {
        className: getItemClassName("ui-form-modal-divider", item),
      });
    }
    if (type === "branding") {
      return renderBrandingItem(item);
    }
    if (type === "display") {
      return renderDisplayItem(item);
    }
    if (type === "hidden" || type === "input" || type === "textarea" || type === "select" || type === "checkbox" || type === "ui.select" || type === "ui.treeselect" || type === "ui.datepicker" || type === "ui.toggle.group" || type === "number-stepper" || type === "avatar") {
      return renderField(item, type, rowIndex, itemIndex);
    }
    console.warn(`[createFormModal] Unsupported item type "${type}".`);
    return null;
  }

  function renderBrandingItem(item) {
    const mediaUrl = String(item.mediaUrl || "").trim();
    const backgroundImageUrl = String(item.backgroundImageUrl || "").trim();
    const backgroundImageAlt = String(item.backgroundImageAlt || "").trim();
    const tone = normalizeBrandingTone(item.backgroundTone);
    const wrapper = createElement("div", {
      className: getItemClassName(`ui-form-modal-branding is-tone-${tone}`, item),
    });
    if (backgroundImageUrl) {
      const backgroundAttrs = {
        src: backgroundImageUrl,
        alt: backgroundImageAlt,
        loading: "lazy",
        decoding: "async",
      };
      if (!backgroundImageAlt) {
        backgroundAttrs["aria-hidden"] = "true";
      }
      wrapper.appendChild(createElement("img", {
        className: "ui-form-modal-branding-bg",
        attrs: backgroundAttrs,
      }));
    }
    const content = createElement("div", { className: "ui-form-modal-branding-content" });
    if (mediaUrl) {
      content.appendChild(createElement("img", {
        className: "ui-form-modal-branding-media",
        attrs: {
          src: mediaUrl,
          alt: String(item.mediaAlt || ""),
          loading: "lazy",
          decoding: "async",
        },
      }));
    }
    if (backgroundImageAlt && !mediaUrl) {
      content.appendChild(createElement("span", {
        className: "ui-form-modal-branding-alt",
        text: backgroundImageAlt,
      }));
    }
    wrapper.appendChild(content);
    return wrapper;
  }

  function renderDisplayItem(item) {
    const wrapper = createElement("div", {
      className: getItemClassName(`ui-field ui-form-modal-field is-${normalizeTypeClass("display")}`, item),
    });
    const name = String(item.name || "").trim();
    const labelText = String(item.label || "").trim();
    const helpText = String(item.help || "").trim();
    const displayValue = resolveItemValue(item);
    if (labelText) {
      wrapper.appendChild(createElement("label", {
        className: "ui-label",
        text: labelText,
      }));
    }
    const valueEl = createElement("div", {
      className: "ui-form-modal-display-value",
      text: displayValue == null || displayValue === "" ? String(item.emptyText || "-") : String(displayValue),
    });
    wrapper.appendChild(valueEl);
    if (helpText) {
      wrapper.appendChild(createElement("p", {
        className: "ui-form-modal-help",
        text: helpText,
      }));
    }
    if (name) {
      displays.set(name, {
        name,
        valueEl,
        config: { ...item },
      });
    }
    return wrapper;
  }

  function renderContext() {
    clearNode(refs.context);
    const context = normalizeContext(currentOptions.context);
    if (!context) {
      refs.context.hidden = true;
      return;
    }
    refs.context.hidden = false;
    refs.context.className = `ui-form-modal-context is-${context.kind}`;
    if (context.badge) {
      refs.context.appendChild(createElement("span", {
        className: "ui-form-modal-context-badge",
        text: context.badge,
      }));
    }
    if (context.summary) {
      refs.context.appendChild(createElement("span", {
        className: "ui-form-modal-context-summary",
        text: context.summary,
      }));
    }
  }

  function renderField(item, type, rowIndex, itemIndex) {
    const name = String(item.name || "").trim();
    if (!name) {
      console.warn(`[createFormModal] Field item at row ${rowIndex + 1}, index ${itemIndex + 1} is missing "name".`);
      return null;
    }
    const id = `ui-form-modal-${name}-${rowIndex}-${itemIndex}`;
    const wrapper = createElement("div", {
      className: getItemClassName(`ui-field ui-form-modal-field is-${normalizeTypeClass(type)}`, item),
      attrs: type === "hidden" ? { hidden: "hidden" } : {},
    });
    const label = createElement("label", {
      className: type === "checkbox" ? "ui-form-modal-checkbox" : "ui-label",
      attrs: type === "checkbox" || type === "hidden" ? {} : { for: id },
    });
    const labelText = String(item.label || "").trim();
    const helpText = String(item.help || "").trim();
    const errorEl = type === "hidden"
      ? null
      : createElement("p", {
        className: "ui-form-error ui-form-modal-field-error",
        attrs: { hidden: "hidden", id: `${id}-error` },
      });

    const value = resolveItemValue(item);
    const control = createControl(type, id, name, item, value, errorEl);
    const constraintTarget = getFieldAriaTarget({ type, control });
    for (const [key, attr] of Object.entries({minLength:"minlength",maxLength:"maxlength",min:"min",max:"max",step:"step",pattern:"pattern"})) {
      if (item[key] != null && constraintTarget?.matches?.("input,textarea,select")) constraintTarget.setAttribute(attr, String(item[key]));
    }
    if (!control) {
      return null;
    }

    if (type === "hidden") {
      fields.set(name, {
        name,
        type,
        config: { ...item },
        wrapper: null,
        control,
        errorEl: null,
      });
      return control;
    } else if (type === "ui.select" || type === "ui.treeselect" || type === "ui.datepicker" || type === "ui.toggle.group" || type === "number-stepper") {
      if (labelText) {
        label.textContent = labelText;
        wrapper.appendChild(label);
      }
      wrapper.appendChild(control);
    } else if (type === "avatar") {
      wrapper.appendChild(control);
    } else if (type === "checkbox") {
      label.append(control, createElement("span", {
        className: "ui-form-modal-checkbox-label",
        text: labelText,
      }));
      wrapper.appendChild(label);
    } else {
      if (labelText) {
        label.textContent = labelText;
        wrapper.appendChild(label);
      }
      wrapper.appendChild(control);
    }

    if (helpText && type !== "hidden") {
      const helpEl = createElement("p", {
        className: "ui-form-modal-help",
        text: helpText,
        attrs: { id: `${id}-help` },
      });
      wrapper.appendChild(helpEl);
      appendDescribedBy(getFieldAriaTarget({ type, control }), helpEl.id);
    }

    if ((type === "ui.select" || type === "ui.treeselect" || type === "ui.datepicker" || type === "ui.toggle.group" || type === "number-stepper") && errorEl) {
      appendDescribedBy(getFieldAriaTarget({ type, control }), errorEl.id);
    }

    if (errorEl) {
      wrapper.appendChild(errorEl);
    }

    fields.set(name, {
      name,
      type,
      config: { ...item },
      wrapper,
      control,
      errorEl,
    });
    return wrapper;
  }

  function createControl(type, id, name, item, value, errorEl) {
    const describedBy = errorEl?.id || null;
    const commonAttrs = {
      id,
      name,
      ...(item.required ? { required: "required" } : {}),
      ...(item.disabled ? { disabled: "disabled" } : {}),
      ...(item.autocomplete ? { autocomplete: String(item.autocomplete) } : {}),
      ...(item.min != null ? { min: String(item.min) } : {}),
      ...(item.max != null ? { max: String(item.max) } : {}),
      ...(item.step != null ? { step: String(item.step) } : {}),
      ...(item.pattern ? { pattern: String(item.pattern) } : {}),
      ...(item.inputmode ? { inputmode: String(item.inputmode) } : {}),
      ...(describedBy ? { "aria-describedby": describedBy } : {}),
    };
    let control = null;

    if (type === "hidden") {
      control = createElement("input", {
        attrs: {
          id,
          name,
          type: "hidden",
          value: value == null ? "" : String(value),
        },
      });
      return control;
    }

    if (type === "ui.toggle.group") {
      const host = createElement("div", {
        className: "ui-form-modal-toggle-group-host",
        attrs: { id, role: "group", "aria-label": item.ariaLabel || item.label || name },
      });
      const items = normalizeOptionsList(item.items || item.options || []).map((option) => ({
        id: String(option.value), label: option.label, disabled: Boolean(option.disabled),
        pressed: value != null && String(value) === String(option.value),
      }));
      host.__uiToggleGroupInstance = createToggleGroup(host, {
        items, multi: false, allowNone: true,
        variant: item.variant || "pill",
        name: item.ariaLabel || item.label || name,
        disabled: Boolean(item.disabled || item.readonly),
        onChange() { handleFieldChange(name); },
      });
      return host;
    }

    if (type === "ui.datepicker") {
      const host = createElement("div", {
        className: "ui-form-modal-datepicker-host",
        attrs: { id, role: "group", "aria-label": item.ariaLabel || item.label || name },
      });
      host.__uiDatepickerInstance = createDatepicker(host, {
        value, valueMode: item.valueMode || "instant", showTime: Boolean(item.showTime), timePrecision: item.timePrecision ?? "auto",
        ariaLabel: item.ariaLabel || item.label || name,
        placeholder: item.placeholder || "Select date", locale: item.locale || "en-US",
        min: item.min, max: item.max, disabledDates: item.disabledDates,
        weekStartsOn: item.weekStartsOn, yearRangePast: item.yearRangePast,
        yearRangeFuture: item.yearRangeFuture,
        disabled: Boolean(item.disabled || item.readonly || modal?.isBusy?.()),
        closeOnSelect: item.closeOnSelect ?? !item.showTime,
        onChange() { handleFieldChange(name); },
      });
      return host;
    }

    if (type === "ui.select") {
      const host = createElement("div", {
        className: "ui-form-modal-select-host",
        attrs: { id },
      });
      const selectInstance = createSelect(host, item.items || item.options || [], {
        ariaLabel: item.ariaLabel || item.label || name,
        placeholder: item.placeholder || "Select...",
        emptyText: item.emptyText || "No options found.",
        searchable: item.searchable !== false,
        multiple: Boolean(item.multiple),
        closeOnSelect: item.closeOnSelect !== false,
        selectOnTab: Boolean(item.selectOnTab),
        clearable: item.clearable !== false,
        selected: value,
        onChange() {
          handleFieldChange(name);
        },
      });
      host.__uiSelectInstance = selectInstance;
      control = host;
      return control;
    }

    if (type === "ui.treeselect") {
      const host = createElement("div", {
        className: "ui-form-modal-select-host",
        attrs: { id },
      });
      const treeSelectInstance = createTreeSelect(host, item.items || item.options || [], {
        ariaLabel: item.ariaLabel || item.label || name,
        placeholder: item.placeholder || "Select...",
        emptyText: item.emptyText || "No options found.",
        searchable: item.searchable !== false,
        closeOnSelect: item.closeOnSelect !== false,
        selectOnTab: Boolean(item.selectOnTab),
        clearable: item.clearable !== false,
        defaultExpanded: Boolean(item.defaultExpanded),
        selected: value,
        onChange() {
          handleFieldChange(name);
        },
      });
      host.__uiTreeSelectInstance = treeSelectInstance;
      control = host;
      return control;
    }

    if (type === "number-stepper") {
      const host = createElement("div", {
        className: "ui-form-modal-number-stepper-host",
        attrs: { id: `${id}-host` },
      });
      const stepperInstance = createNumberStepper(host, {
        id,
        name,
        value,
        min: item.min,
        max: item.max,
        step: item.step,
        decimals: item.decimals,
        placeholder: item.placeholder ? String(item.placeholder) : "",
        required: Boolean(item.required),
        disabled: Boolean(item.disabled),
        readonly: Boolean(item.readonly),
        allowEmpty: Boolean(item.allowEmpty),
        prefixText: item.prefixText == null ? "" : String(item.prefixText),
        suffixText: item.suffixText == null ? "" : String(item.suffixText),
        decrementLabel: item.decrementLabel == null ? "Decrease value" : String(item.decrementLabel),
        incrementLabel: item.incrementLabel == null ? "Increase value" : String(item.incrementLabel),
        ariaLabel: item.ariaLabel || item.label || name,
        describedBy,
        onChange() {
          handleFieldChange(name);
        },
      });
      host.__uiNumberStepperInstance = stepperInstance;
      control = host;
      return control;
    }

    if (type === "avatar") {
      const host = createElement("div", {
        className: "ui-form-modal-avatar-host",
      });
      const trigger = createElement("button", {
        className: "ui-form-modal-avatar-picker",
        attrs: {
          id,
          type: "button",
          ...(item.disabled ? { disabled: "disabled" } : {}),
          ...(describedBy ? { "aria-describedby": describedBy } : {}),
          "aria-label": String(item.ariaLabel || item.label || "Choose profile photo"),
        },
      });
      const circle = createElement("span", {
        className: "ui-form-modal-avatar-circle",
      });
      const image = createElement("img", {
        className: "ui-form-modal-avatar-image",
        attrs: {
          alt: String(item.previewAlt || item.label || "Selected profile photo"),
          hidden: "hidden",
        },
      });
      const placeholder = createElement("span", {
        className: "ui-form-modal-avatar-placeholder",
        text: String(item.placeholderText || "Photo"),
      });
      const caption = createElement("span", {
        className: "ui-form-modal-avatar-caption",
      });
      const meta = createElement("span", {
        className: "ui-form-modal-avatar-meta",
      });
      const input = createElement("input", {
        className: "ui-form-modal-avatar-input",
        attrs: {
          type: "file",
          tabindex: "-1",
          hidden: "hidden",
          ...(item.accept ? { accept: String(item.accept) } : { accept: "image/*" }),
          ...(item.capture ? { capture: String(item.capture) } : {}),
        },
      });

      let currentFile = value instanceof File ? value : null;
      let currentPreviewUrl = currentFile ? "" : normalizeAvatarPreviewUrl(item.previewUrl || item.src || "");
      let objectUrl = "";
      let pendingPreviewSrc = "";

      circle.append(image, placeholder);
      trigger.append(circle, caption, meta);
      host.append(trigger, input);

      function revokeObjectUrl() {
        if (!objectUrl) {
          return;
        }
        URL.revokeObjectURL(objectUrl);
        objectUrl = "";
      }

      function showLoadedImage() {
        if (!pendingPreviewSrc) {
          return;
        }
        image.hidden = false;
        placeholder.hidden = true;
        caption.textContent = String(item.changeLabel || "Change photo");
        meta.textContent = currentFile?.name || String(item.previewText || "Current profile photo");
        trigger.dataset.state = currentFile ? "selected" : "preview";
      }

      function showPlaceholderState() {
        image.removeAttribute("src");
        image.hidden = true;
        placeholder.hidden = false;
        caption.textContent = String(item.selectLabel || "Choose photo");
        meta.textContent = String(item.emptyText || "Click to choose a profile photo.");
        trigger.dataset.state = "empty";
      }

      function syncPreview() {
        revokeObjectUrl();
        pendingPreviewSrc = "";
        let previewSrc = "";
        if (currentFile instanceof File) {
          objectUrl = URL.createObjectURL(currentFile);
          previewSrc = objectUrl;
        } else if (currentPreviewUrl) {
          previewSrc = currentPreviewUrl;
        }
        if (previewSrc) {
          pendingPreviewSrc = previewSrc;
          image.src = previewSrc;
          image.hidden = true;
          placeholder.hidden = false;
          caption.textContent = currentFile?.name ? String(item.changeLabel || "Change photo") : String(item.previewLoadingText || "Loading photo...");
          meta.textContent = currentFile?.name || String(item.previewText || "Current profile photo");
          trigger.dataset.state = "loading";
        } else {
          showPlaceholderState();
        }
      }

      const avatarInstance = {
        input,
        trigger,
        getValue() {
          return currentFile;
        },
        setValue(nextValue) {
          if (nextValue instanceof File) {
            currentFile = nextValue;
          } else {
            currentFile = null;
            if (typeof nextValue === "string") {
              currentPreviewUrl = normalizeAvatarPreviewUrl(nextValue);
            }
          }
          input.value = "";
          syncPreview();
        },
        hasPreview() {
          return Boolean(currentFile || currentPreviewUrl);
        },
        destroy() {
          revokeObjectUrl();
          input.value = "";
        },
      };

      trigger.addEventListener("click", () => {
        if (item.disabled || item.readonly) {
          return;
        }
        input.value = "";
        input.click();
      });
      image.addEventListener("load", () => {
        showLoadedImage();
      });
      image.addEventListener("error", () => {
        pendingPreviewSrc = "";
        if (!(currentFile instanceof File)) {
          currentPreviewUrl = "";
        }
        showPlaceholderState();
      });
      input.addEventListener("change", () => {
        currentFile = input.files?.[0] || null;
        syncPreview();
        handleFieldChange(name);
      });

      host.__uiAvatarFieldInstance = avatarInstance;
      syncPreview();
      return host;
    }

    if (type === "input") {
      if (normalizeInputType(item.input) === "password") {
        const host = createElement("div", {
          className: "ui-form-modal-password-host",
        });
        const passwordInstance = createPasswordField(host, {
          id,
          name,
          value: value == null ? "" : String(value),
          placeholder: item.placeholder ? String(item.placeholder) : "",
          autocomplete: item.autocomplete ? String(item.autocomplete) : "",
          required: Boolean(item.required),
          disabled: Boolean(item.disabled),
          readonly: Boolean(item.readonly),
          ariaLabel: item.ariaLabel || item.label || name,
          describedBy,
          onChange() {
            handleFieldChange(name);
          },
        });
        host.__uiPasswordInstance = passwordInstance;
        control = host;
        return control;
      }
      control = createElement("input", {
        className: "ui-input",
        attrs: {
          ...commonAttrs,
          ...(item.readonly ? { readonly: "readonly" } : {}),
          type: normalizeInputType(item.input),
          value: value == null ? "" : String(value),
          ...(item.placeholder ? { placeholder: String(item.placeholder) } : {}),
        },
      });
    } else if (type === "textarea") {
      control = createElement("textarea", {
        className: "ui-input",
        text: value == null ? "" : String(value),
        attrs: {
          ...commonAttrs,
          ...(item.readonly ? { readonly: "readonly" } : {}),
          ...(item.placeholder ? { placeholder: String(item.placeholder) } : {}),
        },
      });
    } else if (type === "select") {
      control = createElement("select", {
        className: "ui-input",
        attrs: {
          ...commonAttrs,
          ...(item.readonly ? { disabled: "disabled" } : {}),
        },
      });
      const appendOption = (parent, option) => {
        const optionEl = createElement("option", {
          text: option.label,
          attrs: { value: option.value },
        });
        optionEl.disabled = Boolean(option.disabled);
        if (String(option.value) === String(value ?? "")) {
          optionEl.selected = true;
        }
        parent.appendChild(optionEl);
      };
      (Array.isArray(item.options) ? item.options : []).forEach((entry) => {
        if (entry && Array.isArray(entry.options)) {
          const group = createElement("optgroup", { attrs: { label: String(entry.label ?? "") } });
          group.disabled = Boolean(entry.disabled);
          // Native optgroups are one level deep; ignore nested groups.
          normalizeOptionsList(entry.options.filter(child => !Array.isArray(child?.options)))
            .forEach(option => appendOption(group, option));
          control.appendChild(group);
        } else {
          normalizeOptionsList([entry]).forEach(option => appendOption(control, option));
        }
      });
    } else if (type === "checkbox") {
      control = createElement("input", {
        className: "ui-form-modal-checkbox-input",
        attrs: {
          ...commonAttrs,
          type: "checkbox",
          ...(item.readonly ? { disabled: "disabled" } : {}),
          ...(value ? { checked: "checked" } : {}),
        },
      });
      control.checked = Boolean(value);
    }

    if (!control) {
      return null;
    }
    control.addEventListener("input", () => handleFieldChange(name));
    control.addEventListener("change", () => handleFieldChange(name));
    return control;
  }

  function handleFieldChange(name) {
    if (rendering || destroyed) return;
    syncValueStoreFromRenderedFields();
    const nextVisibilitySignature = computeVisibilitySignature();
    if (nextVisibilitySignature !== lastVisibilitySignature) {
      render(false);
    }
    clearFieldError(name);
    if (refs.formError.textContent) {
      clearFormError();
    }
    if (typeof currentOptions.onChange === "function") {
      currentOptions.onChange(getValues(), createContext(name));
    }
  }

  async function handleSubmit(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (destroyed || reportingInvalid || modal.isBusy()) {
      return false;
    }
    clearErrors();
    clearFormError();
    const validation = validate();
    if (!validation.valid) {
      applyErrors(validation.errors);
      reportingInvalid = true;
      const invalidField = fields.get(validation.firstInvalidField);
      focusFirstInvalid(validation.firstInvalidField);
      try {
        if (typeof currentOptions.onInvalid === "function") {
          await currentOptions.onInvalid({ ...validation, values: getValues() }, createContext(null));
        }
      } finally {
        reportingInvalid = false;
        requestInvalidFocus(validation.firstInvalidField, invalidField);
      }
      return false;
    }
    if (typeof currentOptions.onSubmit !== "function") {
      return true;
    }
    if (currentOptions.manageBusyOnSubmit !== false) {
      setBusy(true, { message: currentOptions.busyMessage });
    }
    try {
      const result = await currentOptions.onSubmit(getValues(), createContext(null));
      if (result) {
        return currentOptions.closeOnSuccess !== false;
      }
      return false;
    } catch (_error) {
      return false;
    } finally {
      if (currentOptions.manageBusyOnSubmit !== false && modal.getState().open) {
        setBusy(false);
      }
    }
  }

  function validate() {
    const errors = {};
    let firstInvalidField = null;
    fields.forEach((field, name) => {
      if (field.type === "hidden" || field.config.disabled || field.config.readonly) {
        return;
      }
      const control = field.control;
      if (!(control instanceof HTMLElement)) {
        return;
      }
      const label = String(field.config.label || field.config.ariaLabel || name);
      let message = "";
      if (field.type === "checkbox") {
        if (field.config.required && !control.checked) {
          message = `Please provide ${label}; this field is required.`;
        }
      } else if (field.type === "ui.select" || field.type === "ui.treeselect" || field.type === "ui.datepicker" || field.type === "ui.toggle.group" || field.type === "number-stepper") {
        const value = getFieldValue(field);
        const isEmpty = Array.isArray(value) ? value.length === 0 : value == null || value === "";
        if (field.config.required && isEmpty) {
          message = `Please provide ${label}; this field is required.`;
        }
      } else if (field.type === "avatar") {
        const value = getFieldValue(field);
        const hasPreview = field.control?.__uiAvatarFieldInstance?.hasPreview?.() === true;
        if (field.config.required && !value && !hasPreview) {
          message = `Choose a photo for ${label}.`;
        }
      } else if (field.config.required && (getFieldValue(field) == null ||
        (field.type === "input" && normalizeInputType(field.config.input) === "password"
          ? String(getFieldValue(field)) === "" : String(getFieldValue(field)).trim() === ""))) {
        message = `Please provide ${label}; this field is required.`;
      } else {
        const validationTarget = getFieldAriaTarget(field);
        if (typeof validationTarget?.checkValidity === "function" && !validationTarget.checkValidity()) {
          message = `${label}: ${validationTarget.validationMessage || "Enter a valid value."}`;
        }
      }
      const validationTarget = getFieldAriaTarget(field);
      if (!message && typeof validationTarget?.checkValidity === "function" && !validationTarget.checkValidity()) {
        message = `${label}: ${validationTarget.validationMessage || "Enter a valid value."}`;
      }
      const value = getFieldValue(field);
      const text = value == null ? "" : String(value);
      // Explicit checks also validate programmatically populated values (native
      // minlength/maxlength validity applies only to user-edited strings).
      if (!message && text && ["input", "textarea"].includes(field.type)) {
        if (field.config.minLength != null && text.length < Number(field.config.minLength)) message = `${label} must contain at least ${field.config.minLength} characters.`;
        if (field.config.maxLength != null && text.length > Number(field.config.maxLength)) message = `${label} must contain no more than ${field.config.maxLength} characters.`;
      }
      if (message && field.config.validationMessage) message = String(field.config.validationMessage);
      if (message) {
        errors[name] = message;
        if (!firstInvalidField) {
          firstInvalidField = name;
        }
      }
    });
    if (typeof currentOptions.validate === "function") {
      const custom = currentOptions.validate(getValues(), createContext(null)) || {};
      if (typeof custom.then === "function") throw new TypeError("Form validate must synchronously return a field-error map.");
      for (const [name, message] of Object.entries(custom)) {
        const field = resolveErrorField(name);
        if (message && field && field.type !== "hidden" && !field.config.disabled && !field.config.readonly) {
          errors[name] = String(message);
          if (!firstInvalidField) firstInvalidField = field.name;
        }
      }
    }
    return {
      valid: !Object.keys(errors).length,
      errors,
      firstInvalidField,
    };
  }

  function resolveErrorField(name) {
    if (!name || typeof name !== "string") {
      return null;
    }
    const direct = fields.get(name);
    if (direct) {
      return direct;
    }
    if (!name.includes(".")) {
      return null;
    }
    return fields.get(name.split(".")[0]) || null;
  }

  function focusFirstInvalid(name) {
    if (!name) {
      return;
    }
    const field = fields.get(name);
    if (field?.type === "hidden") {
      return;
    }
    if (field?.type === "ui.datepicker" || field?.type === "ui.toggle.group") {
      field.control?.querySelector("button:not(:disabled)")?.focus();
      return;
    }
    if (field?.type === "number-stepper" && typeof field.control?.__uiNumberStepperInstance?.focus === "function") {
      field.control.__uiNumberStepperInstance.focus();
      return;
    }
    const focusTarget = field?.type === "ui.select" || field?.type === "ui.treeselect" || field?.type === "number-stepper" || field?.type === "avatar"
      ? getFieldAriaTarget(field)
      : getFieldAriaTarget(field) || field?.control;
    if (focusTarget && typeof focusTarget.focus === "function") {
      focusTarget.focus();
    }
  }

  function requestInvalidFocus(name, expectedField = fields.get(name)) {
    if (!name) {
      return;
    }
    const schedule = typeof window !== "undefined" && typeof window.requestAnimationFrame === "function"
      ? window.requestAnimationFrame.bind(window)
      : (callback) => setTimeout(callback, 0);
    schedule(() => {
      const field = fields.get(name);
      const target = getFieldAriaTarget(field || {});
      if (destroyed || !modal?.getState?.().open || field !== expectedField ||
          !target?.isConnected || target.getAttribute("aria-invalid") !== "true" ||
          field?.config.disabled || field?.config.readonly) {
        return;
      }
      focusFirstInvalid(name);
    });
  }

  function applyErrors(errors = {}) {
    Object.keys(errors || {}).forEach((name) => {
      const field = resolveErrorField(name);
      if (!field || !field.errorEl) {
        return;
      }
      setFieldError(getFieldAriaTarget(field), field.errorEl, errors[name]);
    });
  }

  function clearFieldError(name) {
    const field = resolveErrorField(name);
    if (!field || !field.errorEl) {
      return;
    }
    setFieldError(getFieldAriaTarget(field), field.errorEl, "");
  }

  function clearErrors() {
    fields.forEach((_field, name) => clearFieldError(name));
  }

  function setFormError(message) {
    const text = String(message || "").trim();
    refs.formError.textContent = text;
    refs.formError.hidden = !text;
  }

  function clearFormError() {
    setFormError("");
  }

  function getValues() {
    syncValueStoreFromRenderedFields();
    const values = {};
    fields.forEach((_field, name) => {
      if (Object.prototype.hasOwnProperty.call(valueStore, name)) {
        values[name] = valueStore[name];
      }
    });
    return values;
  }

  function setValues(nextValues = {}) {
    syncValueStoreFromRenderedFields();
    const nextStoredValues = {
      ...valueStore,
      ...(nextValues && typeof nextValues === "object" ? nextValues : {}),
    };
    replaceStoredValues(nextStoredValues);
    const nextVisibilitySignature = computeVisibilitySignature();
    if (nextVisibilitySignature !== lastVisibilitySignature) {
      render(false);
    }
    Object.keys(nextValues || {}).forEach((name) => {
      const field = fields.get(name);
      if (field) {
        setFieldValue(field, nextValues[name]);
        clearFieldError(name);
      }
      const display = displays.get(name);
      if (display) {
        display.valueEl.textContent = nextValues[name] == null || nextValues[name] === ""
          ? String(display.config.emptyText || "-")
          : String(nextValues[name]);
      }
    });
    syncValueStoreFromRenderedFields();
    if (modal?.isBusy?.()) setBusy(true);
  }

  function applyApiErrors(response) {
    const mapped = normalizeApiErrors(response);
    if (Object.keys(mapped.fieldErrors).length) {
      setErrors(mapped.fieldErrors);
    } else {
      clearErrors();
    }
    if (mapped.formError) {
      setFormError(mapped.formError);
    }
    return mapped;
  }

  function createContext(changedFieldName) {
    return {
      modal,
      mode: currentOptions.mode,
      setErrors,
      clearErrors,
      setFormError,
      clearFormError,
      applyApiErrors,
      setBusy: (...args) => setBusy(...args),
      isBusy: () => modal.isBusy(),
      changedFieldName,
    };
  }

  function createActionContext(action, event) {
    return {
      ...createContext(null),
      action,
      actionId: action?.id || "",
      event: event || null,
      getValues,
      setValues,
      getState,
    };
  }

  function setErrors(fieldErrors = {}) {
    clearErrors();
    applyErrors(fieldErrors);
  }

  function setBusy(busy, options = {}) {
    fields.forEach(field => {
      if (field.type === "ui.datepicker") {
        field.control.__uiDatepickerInstance.setDisabled(Boolean(busy || field.config.disabled || field.config.readonly));
      }
    });
    modal.setBusy(busy, options);
  }

  function buildModalConfig() {
    const extraActions = currentOptions.extraActions.map((action, index, list) => {
      const isSplitStart = currentOptions.extraActionsPlacement === "start" && index === list.length - 1;
      return {
        ...action,
        className: [action.className || "", isSplitStart ? "is-footer-split-start" : ""].filter(Boolean).join(" "),
        closeOnClick: action.closeOnClick === true,
        async onClick(eventContext) {
          if (typeof action.onClick !== "function") {
            return false;
          }
          return action.onClick(getValues(), createActionContext(action, eventContext?.event), action.id || "");
        },
      };
    });

    return {
      ...currentOptions,
      className: ["ui-form-modal-shell", currentOptions.className || ""].filter(Boolean).join(" "),
      content: refs.shell,
      autoBusy: false,
      actions: [
        ...extraActions,
        ...(currentOptions.showCancelButton ? [{
          id: "cancel",
          label: currentOptions.cancelLabel,
          variant: "ghost",
          icon: currentOptions.cancelIcon || "",
        }] : []),
        {
          id: "submit",
          label: currentOptions.submitLabel,
          variant: currentOptions.submitVariant,
          icon: currentOptions.submitIcon || "",
          autoFocus: true,
          closeOnClick: false,
          async onClick(eventContext) {
            const shouldClose = await handleSubmit(eventContext.event);
            if (shouldClose) {
              await modal.close({
                reason: "submit",
                actionId: "submit",
                result: true,
              });
            }
            return false;
          },
        },
      ],
    };
  }

  function update(nextOptions = {}) {
    syncValueStoreFromRenderedFields();
    const previousValues = { ...valueStore };
    const merged = normalizeOptions({
      ...currentOptions,
      ...(nextOptions || {}),
      rows: Object.prototype.hasOwnProperty.call(nextOptions, "rows") ? nextOptions.rows : currentOptions.rows,
      initialValues: Object.prototype.hasOwnProperty.call(nextOptions, "initialValues") ? nextOptions.initialValues : currentOptions.initialValues,
    });
    Object.assign(currentOptions, merged);
    if (Object.prototype.hasOwnProperty.call(nextOptions, "initialValues")) {
      seedStoredValuesFromInitialOptions();
    }
    ensureFormModalStyles(resolveTargetDocument(currentOptions.parent));
    replaceStoredValues({
      ...(currentOptions.initialValues || {}),
      ...previousValues,
      ...((nextOptions.initialValues && typeof nextOptions.initialValues === "object") ? nextOptions.initialValues : {}),
    });
    render(false);
    syncValueStoreFromRenderedFields();
    modal.update(buildModalConfig());
  }

  function getState() {
    return {
      ...modal.getState(),
      mode: currentOptions.mode,
      columns: currentOptions.columns,
      values: getValues(),
    };
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    destroyHostedFieldInstances();
    modal.destroy();
  }

  refs.form.addEventListener("submit", async (event) => {
      const shouldClose = await handleSubmit(event);
      if (shouldClose) {
        await modal.close({
          reason: "submit",
          actionId: "submit",
          result: true,
        });
      }
    });
  render();

  modal = createActionModal({
    ...buildModalConfig(),
    onClose(meta) {
      currentOptions.onClose?.(meta);
      destroy();
    },
  });

  syncValueStoreFromRenderedFields();

  return {
    ...modal,
    destroy,
    setBusy,
    update,
    getState,
    getValues,
    setValues,
    setErrors,
    clearErrors,
    setFormError,
    clearFormError,
    applyApiErrors,
    refs: {
      ...modal.refs,
      shell: refs.shell,
      form: refs.form,
      rows: refs.rows,
      hiddenFields: refs.hiddenFields,
      formError: refs.formError,
      fields,
      displays,
    },
  };

  function syncValueStoreFromRenderedFields() {
    fields.forEach((field, name) => {
      valueStore[name] = getFieldValue(field);
    });
  }

  function replaceStoredValues(nextValues = {}) {
    Object.keys(valueStore).forEach((name) => {
      delete valueStore[name];
    });
    Object.keys(nextValues || {}).forEach((name) => {
      valueStore[name] = nextValues[name];
    });
  }

  function seedStoredValuesFromInitialOptions() {
    normalizeRows(currentOptions.rows).forEach((row) => {
      row.forEach((item) => {
        if (!item || typeof item !== "object") {
          return;
        }
        const name = String(item.name || "").trim();
        if (!name || Object.prototype.hasOwnProperty.call(valueStore, name)) {
          return;
        }
        if (Object.prototype.hasOwnProperty.call(item, "value")) {
          valueStore[name] = item.value;
        }
      });
    });
    Object.assign(valueStore, currentOptions.initialValues || {});
  }

  function computeVisibilitySignature() {
    return normalizeRows(currentOptions.rows)
      .flatMap((row, rowIndex) => row.map((item, itemIndex) => {
        const resolved = resolveItemConfig(item, valueStore);
        return `${rowIndex}:${itemIndex}:${resolved && !resolved._hiddenByRule ? "1" : "0"}`;
      }))
      .join("|");
  }
}

function resolveTargetDocument(parent) {
  if (parent && typeof parent === "object" && parent.ownerDocument) {
    return parent.ownerDocument;
  }
  return document;
}

function ensureFormModalStyles(targetDocument) {
  const doc = targetDocument && typeof targetDocument.querySelector === "function" ? targetDocument : document;
  const head = doc.head || doc.documentElement;
  if (!head) {
    return;
  }
  if (doc.querySelector('link[data-ui-bundle="ui"]')) {
    return;
  }
  FORM_MODAL_STYLE_HREFS.forEach((href) => {
    if (doc.querySelector(`link[data-ui-loader-href="${escapeCssAttribute(href)}"]`)) {
      return;
    }
    const link = doc.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.uiLoaderHref = href;
    head.appendChild(link);
  });
}

function escapeCssAttribute(value) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return String(value).replace(/["\\]/g, "\\$&");
}

function normalizeOptions(options = {}) {
  return {
    ...DEFAULT_OPTIONS,
    ...(options || {}),
    rows: normalizeRows(options.rows),
    columns: normalizeColumns(options.columns),
    initialValues: options.initialValues && typeof options.initialValues === "object" ? { ...options.initialValues } : null,
    context: options.context ?? null,
    mode: String(options.mode || "").trim(),
    extraActions: normalizeExtraActions(options.extraActions),
    extraActionsPlacement: normalizeExtraActionsPlacement(options.extraActionsPlacement),
    submitLabel: String(options.submitLabel || DEFAULT_OPTIONS.submitLabel),
    cancelLabel: String(options.cancelLabel || DEFAULT_OPTIONS.cancelLabel),
    showCancelButton: options.showCancelButton !== false,
    submitVariant: normalizeSubmitVariant(options.submitVariant),
    busyMessage: String(options.busyMessage || DEFAULT_OPTIONS.busyMessage),
    manageBusyOnSubmit: options.manageBusyOnSubmit !== false,
  };
}

function normalizeExtraActions(actions) {
  if (!Array.isArray(actions)) {
    return [];
  }
  return actions
    .map((action, index) => {
      if (!action || typeof action !== "object") {
        return null;
      }
      const label = String(action.label ?? "").trim();
      if (!label) {
        return null;
      }
      const id = String(action.id ?? `extra-action-${index}`);
      if (id === "cancel" || id === "submit") {
        console.warn(`[createFormModal] extraActions does not allow reserved id "${id}". Use helper-owned cancel/submit options instead.`);
        return null;
      }
      return {
        id,
        label,
        variant: String(action.variant || "default"),
        className: String(action.className || "").trim(),
        icon: action.icon ? String(action.icon) : "",
        iconPosition: String(action.iconPosition || "start").toLowerCase() === "end" ? "end" : "start",
        iconOnly: Boolean(action.iconOnly),
        ariaLabel: String(action.ariaLabel || "").trim(),
        busyMessage: String(action.busyMessage || "").trim(),
        onClick: typeof action.onClick === "function" ? action.onClick : null,
        closeOnClick: action.closeOnClick === true,
        disabled: Boolean(action.disabled),
        autoFocus: Boolean(action.autoFocus),
      };
    })
    .filter(Boolean);
}

function normalizeExtraActionsPlacement(value) {
  const normalized = String(value || DEFAULT_OPTIONS.extraActionsPlacement).trim().toLowerCase();
  return normalized === "start" ? "start" : "end";
}

function normalizeRows(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows
    .map((row) => (Array.isArray(row) ? row.filter(Boolean) : []))
    .filter((row) => row.length);
}

function resolveRowColumnCount(items, maxColumns) {
  const visibleCount = Array.isArray(items) ? items.length : 0;
  const largestSpan = Math.max(1, ...(items || []).map((item) => normalizeSpan(item?.span)));
  const totalSpan = (items || []).reduce((sum, item) => sum + normalizeSpan(item?.span), 0);
  return Math.min(Math.max(visibleCount, largestSpan, Math.min(totalSpan || 1, maxColumns)), maxColumns);
}

function normalizeColumns(value) {
  const columns = Number(value);
  if (columns === 1 || columns === 2 || columns === 3) {
    return columns;
  }
  return DEFAULT_OPTIONS.columns;
}

function normalizeOptionsList(options) {
  if (!Array.isArray(options)) {
    return [];
  }
  return options
    .map((option) => {
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
      return { label: label || value, value, disabled: Boolean(option.disabled) };
    })
    .filter(Boolean);
}

function normalizeContext(value) {
  if (!value || typeof value !== "object") {
    return null;
  }
  const kind = String(value.kind || "badge-summary").trim().toLowerCase();
  const badge = String(value.badge || "").trim();
  const summary = String(value.summary || "").trim();
  if (!badge && !summary) {
    return null;
  }
  return {
    kind,
    badge,
    summary,
  };
}

function normalizeSubmitVariant(value) {
  const variant = String(value || "primary").trim().toLowerCase();
  return variant === "danger" ? "danger" : "primary";
}

function normalizeInputType(value) {
  const input = String(value || "text").trim().toLowerCase();
  if (["text", "email", "password", "number", "date", "url", "search"].includes(input)) {
    return input;
  }
  return "text";
}

function normalizeAvatarPreviewUrl(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeTone(value) {
  const tone = String(value || "info").trim().toLowerCase();
  if (tone === "danger" || tone === "warning" || tone === "success" || tone === "info") {
    return tone;
  }
  return "info";
}

function normalizeBrandingTone(value) {
  const tone = String(value || "auto").trim().toLowerCase();
  if (tone === "auto" || tone === "dark" || tone === "light" || tone === "none") {
    return tone;
  }
  return "auto";
}

function normalizeSpan(value) {
  const span = Number(value);
  if (span === 2 || span === 3) {
    return span;
  }
  return 1;
}

function normalizeTypeClass(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function normalizeModeList(value) {
  if (value == null) {
    return [];
  }
  const list = Array.isArray(value) ? value : [value];
  return list
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function resolveModeFlag(list, mode) {
  const normalized = normalizeModeList(list);
  if (!normalized.length) {
    return false;
  }
  return normalized.includes(String(mode || "").trim());
}

function isVisibleRenderableItem(item) {
  return Boolean(item && !item._hiddenByRule && item.type !== "hidden");
}

function getItemClassName(baseClassName, item) {
  const classes = [baseClassName];
  if (normalizeSpan(item?.span) === 2) {
    classes.push("is-span-2");
  }
  if (normalizeSpan(item?.span) === 3) {
    classes.push("is-span-3");
  }
  if (item?.rowClassName) {
    classes.push(String(item.rowClassName).trim());
  }
  if (item?.className) {
    classes.push(String(item.className).trim());
  }
  return classes.filter(Boolean).join(" ");
}

function resolveItemValue(item) {
  const values = item?._values;
  if (values && typeof values === "object" && Object.prototype.hasOwnProperty.call(values, item.name)) {
    return values[item.name];
  }
  if (Object.prototype.hasOwnProperty.call(item, "value")) {
    return item.value;
  }
  const initialValues = item?._initialValues;
  if (initialValues && typeof initialValues === "object" && Object.prototype.hasOwnProperty.call(initialValues, item.name)) {
    return initialValues[item.name];
  }
  return item.type === "checkbox" ? false : "";
}

function appendDescribedBy(control, id) {
  if (!control) {
    return;
  }
  const current = String(control.getAttribute("aria-describedby") || "").trim();
  const next = [current, id].filter(Boolean).join(" ");
  control.setAttribute("aria-describedby", next);
}

function normalizeItemType(type) {
  const value = String(type || "").trim().toLowerCase();
  if (value === "toggle-group") return "ui.toggle.group";
  if (value === "datepicker") return "ui.datepicker";
  if (value === "ui.treeselect" || value === "ui.tree.select") {
    return "ui.treeselect";
  }
  if (value === "number_stepper" || value === "ui.number.stepper" || value === "ui.number-stepper") {
    return "number-stepper";
  }
  return value;
}

function matchesVisibleWhen(rule, values) {
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
    return true;
  }
  return Object.entries(rule).every(([name, expected]) => matchesVisibleWhenEntry(values?.[name], expected));
}

function matchesVisibleWhenEntry(actualValue, expectedValue) {
  if (Array.isArray(expectedValue)) {
    return expectedValue.some((item) => isSameValue(actualValue, item));
  }
  return isSameValue(actualValue, expectedValue);
}

function getFieldValue(field) {
  if (field.type === "ui.toggle.group") return field.control.__uiToggleGroupInstance.getValue();
  if (field.type === "ui.datepicker") return field.control.__uiDatepickerInstance.getValue();
  if (field.type === "ui.select") {
    return field.control?.__uiSelectInstance?.getValue?.() ?? (field.config.multiple ? [] : null);
  }
  if (field.type === "ui.treeselect") {
    return field.control?.__uiTreeSelectInstance?.getValue?.() ?? null;
  }
  if (field.type === "number-stepper") {
    return field.control?.__uiNumberStepperInstance?.getValue?.() ?? null;
  }
  if (field.type === "avatar") {
    return field.control?.__uiAvatarFieldInstance?.getValue?.() ?? null;
  }
  if (field.type === "input" && field.control?.__uiPasswordInstance) {
    return field.control.__uiPasswordInstance.getValue();
  }
  if (field.type === "checkbox") {
    return Boolean(field.control.checked);
  }
  return field.control.value;
}

function setFieldValue(field, value) {
  if (field.type === "ui.toggle.group") {
    const instance = field.control.__uiToggleGroupInstance;
    instance.setItems(instance.getItems().map((item) => ({
      ...item, pressed: value != null && String(value) === item.id,
    })));
    return;
  }

  if (field.type === "ui.datepicker") {
    field.control.__uiDatepickerInstance.setValue(value, false);
    return;
  }
  if (field.type === "ui.select") {
    const currentValue = field.control?.__uiSelectInstance?.getValue?.();
    if (isSameValue(currentValue, value)) {
      return;
    }
    field.control?.__uiSelectInstance?.setValue?.(value);
    return;
  }
  if (field.type === "ui.treeselect") {
    const currentValue = field.control?.__uiTreeSelectInstance?.getValue?.();
    if (isSameValue(currentValue, value)) {
      return;
    }
    field.control?.__uiTreeSelectInstance?.setValue?.(value);
    return;
  }
  if (field.type === "number-stepper") {
    const currentValue = field.control?.__uiNumberStepperInstance?.getValue?.();
    if (isSameValue(currentValue, value)) {
      return;
    }
    field.control?.__uiNumberStepperInstance?.setValue?.(value);
    return;
  }
  if (field.type === "avatar") {
    field.control?.__uiAvatarFieldInstance?.setValue?.(value);
    return;
  }
  if (field.type === "input" && field.control?.__uiPasswordInstance) {
    field.control.__uiPasswordInstance.setValue(value == null ? "" : String(value));
    return;
  }
  if (field.type === "checkbox") {
    field.control.checked = Boolean(value);
    return;
  }
  field.control.value = value == null ? "" : String(value);
}

function getFieldAriaTarget(field) {
  if (!field) {
    return null;
  }
  if (field.type === "ui.toggle.group") return field.control;
  if (field.type === "ui.datepicker") return field.control;
  if (field.type === "ui.select") {
    return field.control?.querySelector?.(".ui-select-trigger") || null;
  }
  if (field.type === "ui.treeselect") {
    return field.control?.querySelector?.(".ui-tree-select-trigger") || null;
  }
  if (field.type === "number-stepper") {
    return field.control?.__uiNumberStepperInstance?.input || field.control?.querySelector?.(".ui-number-stepper-input") || null;
  }
  if (field.type === "avatar") {
    return field.control?.querySelector?.(".ui-form-modal-avatar-picker") || null;
  }
  if (field.type === "input" && field.control?.__uiPasswordInstance) {
    return field.control.__uiPasswordInstance.input || null;
  }
  return field.control || null;
}

function isSameValue(left, right) {
  if (Array.isArray(left) || Array.isArray(right)) {
    const a = Array.isArray(left) ? left.map(String) : [];
    const b = Array.isArray(right) ? right.map(String) : [];
    if (a.length !== b.length) {
      return false;
    }
    return a.every((value, index) => value === b[index]);
  }
  return String(left ?? "") === String(right ?? "");
}

function normalizeApiErrors(response) {
  const source = response?.data && typeof response.data === "object" ? response.data : response;
  const fieldErrors = {};
  let formError = "";

  const candidates = [
    source?.errors,
    source?.fieldErrors,
    source?.validation?.errors,
  ];

  candidates.forEach((candidate) => {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      return;
    }
    Object.keys(candidate).forEach((key) => {
      const value = candidate[key];
      const message = Array.isArray(value) ? String(value[0] || "").trim() : String(value || "").trim();
      if (!message) {
        return;
      }
      if (key === "_form" || key === "form" || key === "non_field_errors") {
        if (!formError) {
          formError = message;
        }
        return;
      }
      fieldErrors[key] = message;
    });
  });

  if (!formError && source && typeof source === "object") {
    formError = String(source.formError || source.error || source.message || "").trim();
  } else if (!formError && typeof source === "string") {
    formError = source.trim();
  }

  return { fieldErrors, formError };
}





