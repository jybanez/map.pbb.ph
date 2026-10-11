import { createElement, clearNode } from "./ui.dom.js";
import { createIcon } from "./ui.icons.js";
import { captureMedia } from "./ui.media.capture.js?v=0.21.271";

const DEFAULT_OPTIONS = {
  className: "",
  placeholder: "Type a message...",
  helperText: "",
  disabled: false,
  busy: false,
  sendLabel: "Send",
  attachmentLabel: "Attach",
  attachmentPlacement: "leading",
  showAttachmentButton: true,
  accept: "",
  multiple: true,
  capture: null,
  maxLength: null,
  multiline: true,
  submitOnEnter: true,
  onChange: null,
  onSend: null,
  onFilesSelected: null,
  attachmentAdapter: 'native',
  onAttachmentsSelected: null,
  onAttachmentError: null,
  attachments: null,
  attachmentOptions: {},
  getAttachmentPolicy: null,
  allowAttachmentOnly: false,
};

export function createChatComposer(container, data = {}, options = {}) {
  let currentValue = String(data?.value || "");
  let attachmentCount = normalizeAttachmentCount(data?.attachmentCount);
  let currentOptions = { ...DEFAULT_OPTIONS, ...(options || {}) };
  let refs = {};
  let attachmentController = null, attachmentRevision = 0, attachmentBusy = false, destroyed = false;
  let attachmentError = '';
  function fileOptions() { return { ...currentOptions, ...(currentOptions.attachmentOptions?.files || {}) }; }
  function recordingPolicy(kind) {
    const policy = currentOptions.getAttachmentPolicy?.() || {};
    const config = currentOptions.attachmentOptions?.[kind === 'video' ? 'videos' : 'audios'] || {};
    if (Number(policy.attachmentCount || 0) >= Number(policy.maxAttachments ?? Infinity)) throw new Error('Remove an attachment before recording another clip.');
    const maxBytes = Math.min(Number(config.maxBytes ?? 25 * 1024 * 1024), Number(policy.maxFileBytes ?? Infinity), Number(policy.maxTotalBytes ?? Infinity) - Number(policy.usedBytes || 0));
    if (!(maxBytes > 0)) throw new Error('No attachment space remains. Remove an attachment before recording.');
    return { ...config, maxBytes };
  }
  async function openRecording(kind) {
    if (destroyed || isInteractionBlocked() || attachmentBusy) return;
    attachmentError = ''; attachmentBusy = true; attachmentController = new AbortController();
    const signal = attachmentController.signal, token = ++attachmentRevision;
    syncButtons();
    try {
      const file = await captureMedia({ ...recordingPolicy(kind), kind, signal });
      if (!file || destroyed || signal.aborted || token !== attachmentRevision) return;
      if (file.size > recordingPolicy(kind).maxBytes) throw new Error('The recording no longer fits the attachment limit. Free some space and record a shorter clip.');
      if (!matchesAccept(file, recordingPolicy(kind).accept ?? currentOptions.accept)) throw new Error('This recording format is not accepted. Check the allowed attachment formats.');
      emitFilesSelected([file], `record-${kind}`);
    } catch (error) {
      if (!destroyed && !signal.aborted && token === attachmentRevision) {
        attachmentError = error?.message || 'Unable to attach recording. Try again.';
        currentOptions.onAttachmentError?.(error);
      }
    } finally {
      if (!destroyed && token === attachmentRevision) { attachmentBusy = false; attachmentController = null; render(); refs[kind]?.focus(); }
    }
  }
  function adapter() {
    const value = fileOptions().attachmentAdapter;
    return typeof value === 'string' ? {mode:value} : (value || {mode:'native'});
  }
  function attachmentActions() {
    if (Array.isArray(currentOptions.attachments)) return [...new Set(currentOptions.attachments)].filter(kind => ['files', 'video', 'audio'].includes(kind));
    return currentOptions.showAttachmentButton ? ['files'] : [];
  }
  function hasAttachments() { return attachmentActions().includes('files') && adapter().mode !== 'none'; }
  function cancelAttachment() { attachmentRevision++; attachmentController?.abort(); attachmentController = null; attachmentBusy = false; }
  async function openAttachment() {
    if (destroyed || isInteractionBlocked() || attachmentBusy || !hasAttachments()) return;
    if (adapter().mode === 'native') { refs.fileInput?.click(); return; }
    if (adapter().mode !== 'custom' || typeof adapter().open !== 'function') {
      attachmentError = 'Configure a custom attachment picker.'; render(); return;
    }
    attachmentError = ''; attachmentBusy = true; attachmentController = new AbortController();
    const signal = attachmentController.signal, token = ++attachmentRevision, snapshot = currentOptions, selectedFileOptions = fileOptions();
    syncButtons();
    try {
      const records = await adapter().open({signal});
      if (destroyed || signal.aborted || token !== attachmentRevision) return;
      if (records == null || (Array.isArray(records) && !records.length)) return;
      if (!Array.isArray(records) || records.some(record => !record || record.id == null || typeof record.name !== 'string')) throw new TypeError('The picker must return canonical file records.');
      snapshot.onAttachmentsSelected?.(selectedFileOptions.multiple === false ? records.slice(0,1) : records, {kind:'repository',source:'picker'});
    } catch (error) {
      if (!destroyed && !signal.aborted && token === attachmentRevision) {
        attachmentError = `Unable to attach files. ${error?.message || 'Open the picker again.'}`;
        currentOptions.onAttachmentError?.(error);
      }
    } finally {
      if (!destroyed && token === attachmentRevision) { attachmentBusy = false; attachmentController = null; render(); refs.attach?.focus(); }
    }
  }

  function render() {
    if (!container || container.nodeType !== 1) {
      return;
    }

    clearNode(container);
    refs = {};

    const root = createElement("div", {
      className: [
        "ui-chat-composer",
        currentOptions.className || "",
        currentOptions.busy ? "is-busy" : "",
        currentOptions.disabled ? "is-disabled" : "",
      ].filter(Boolean).join(" "),
    });
    root.addEventListener("paste", handlePaste);

    const helperPlacement = Array.isArray(currentOptions.attachments) || currentOptions.attachmentPlacement === "helper";
    const metadata = createElement("div", {className:"ui-chat-composer-metadata"});
    refs.root = root; refs.metadata = metadata;
    {
      for (const kind of attachmentActions().filter(kind => kind !== 'files')) {
        const label = kind === 'video' ? 'Attach Video' : 'Attach Audio';
        const button = createElement('button', { className: 'ui-button ui-action-borderless ui-chat-composer-media-attach', attrs: {type:'button', 'aria-label':label, title:label} });
        button.append(createIcon(kind === 'video' ? 'media.video' : 'media.microphone', { size: 18 }),
          createElement('span', { className: 'ui-chat-composer-attach-label', text: label }));
        button.disabled = isInteractionBlocked() || attachmentBusy;
        button.addEventListener('click', () => void openRecording(kind));
        metadata.appendChild(button); refs[kind] = button;
      }
    }
    const controls = createElement("div", {
      className: [
        "ui-chat-composer-controls",
        hasAttachments() && !helperPlacement ? "" : "is-no-attachment",
      ].filter(Boolean).join(" "),
    });
    const inputWrap = createElement("div", { className: "ui-chat-composer-input-wrap" });
    const input = currentOptions.multiline !== false
      ? createElement("textarea", {
          className: "ui-chat-composer-input",
          attrs: buildInputAttrs(),
        })
      : createElement("input", {
          className: "ui-chat-composer-input",
          attrs: { ...buildInputAttrs(), type: "text" },
        });

    input.value = currentValue;
    input.addEventListener("input", () => {
      currentValue = String(input.value || "");
      currentOptions.onChange?.(currentValue);
      syncButtons();
    });
    input.addEventListener("keydown", handleKeydown);

    inputWrap.appendChild(input);
    refs.input = input;

    if (hasAttachments()) {
      if (adapter().mode === 'native') {
      const fileInput = createElement("input", {
        className: "ui-chat-composer-file-input",
        attrs: buildFileInputAttrs(),
      });
      fileInput.addEventListener("change", () => {
        const files = Array.from(fileInput.files || []);
        if (files.length) {
          emitFilesSelected(files, "picker");
        }
        fileInput.value = "";
      });
      refs.fileInput = fileInput;
      root.appendChild(fileInput);
      }

      const attach = createElement("button", {
        className: "ui-button ui-chat-composer-attach" + (helperPlacement ? " ui-action-borderless is-helper-action" : ""),
        attrs: {
          type: "button",
          title: currentOptions.attachmentLabel,
          "aria-label": currentOptions.attachmentLabel,
          ...((isInteractionBlocked() || attachmentBusy) ? { disabled: "disabled" } : {}),
        },
      });
      const attachIcon = createIcon(helperPlacement ? "actions.attach" : "data.upload", { className: "ui-chat-composer-attach-icon" });
      if (attachIcon) {
        attach.appendChild(attachIcon);
      } else {
        attach.textContent = currentOptions.attachmentLabel;
      }
      if (helperPlacement) {
        attach.replaceChildren(...(attachIcon ? [attachIcon] : []), createElement("span", {className:"ui-chat-composer-attach-label", text:currentOptions.attachmentLabel}));
      }
      attach.addEventListener("click", () => void openAttachment());
      if (helperPlacement) metadata.prepend(attach); else controls.appendChild(attach);
      refs.attach = attach;
    }

    if (helperPlacement) {
      for (const kind of attachmentActions()) {
        const button = kind === 'files' ? refs.attach : refs[kind];
        if (button) metadata.appendChild(button);
      }
    }

    controls.appendChild(inputWrap);

    const send = createElement("button", {
      className: "ui-chat-composer-send",
      text: currentOptions.sendLabel,
      attrs: {
        type: "button",
        ...(isSendDisabled() ? { disabled: "disabled" } : {}),
      },
    });
    send.addEventListener("click", () => void submit());
    controls.appendChild(send);
    refs.send = send;

    root.appendChild(controls);

    if (String(currentOptions.helperText || "").trim()) {
      const helper = createElement("div", {
        className: "ui-chat-composer-helper",
        text: String(currentOptions.helperText).trim(),
      });
      refs.helper = helper;
      (helperPlacement ? metadata : root).appendChild(helper);
    }
    if (metadata.childNodes.length) root.appendChild(metadata);

    container.appendChild(root);
    if (attachmentError) {
      root.appendChild(createElement('p', {text:attachmentError, attrs:{role:'alert'}}));
    }
  }

  function buildInputAttrs() {
    const attrs = {
      placeholder: currentOptions.placeholder,
      ...(currentOptions.maxLength != null ? { maxlength: String(currentOptions.maxLength) } : {}),
      ...(isInteractionBlocked() ? { disabled: "disabled" } : {}),
    };
    return attrs;
  }

  function buildFileInputAttrs() {
    const config = fileOptions();
    return {
      type: "file",
      tabindex: "-1",
      hidden: "hidden",
      ...(config.accept ? { accept: String(config.accept) } : {}),
      ...(config.multiple !== false ? { multiple: "multiple" } : {}),
      ...(config.capture ? { capture: String(config.capture) } : {}),
      ...(isInteractionBlocked() ? { disabled: "disabled" } : {}),
    };
  }

  function handleKeydown(event) {
    if (currentOptions.multiline === false) {
      if (event.key === "Enter") {
        event.preventDefault();
        void submit();
      }
      return;
    }

    if (currentOptions.submitOnEnter !== false && event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  }

  function handlePaste(event) {
    if (!hasAttachments() || adapter().mode !== 'native' || isInteractionBlocked()) {
      return;
    }
    const files = getClipboardFiles(event.clipboardData);
    if (!files.length) {
      return;
    }
    const acceptedFiles = normalizeSelectedFiles(files, fileOptions());
    if (!acceptedFiles.length) {
      return;
    }
    event.preventDefault();
    emitFilesSelected(acceptedFiles, "paste");
  }

  function emitFilesSelected(files, source) {
    const config = source.startsWith('record-')
      ? { accept: recordingPolicy(source.slice(7)).accept ?? currentOptions.accept, multiple: false }
      : fileOptions();
    const selectedFiles = normalizeSelectedFiles(files, config);
    if (!selectedFiles.length) {
      return;
    }
    currentOptions.onFilesSelected?.(selectedFiles, { source });
    currentOptions.onAttachmentsSelected?.(selectedFiles, { kind:'native', source });
  }

  async function submit() {
    if (isSendDisabled()) {
      return;
    }
    const text = String(currentValue || "");
    await currentOptions.onSend?.({ text });
  }

  function update(nextData = {}, nextOptions = {}) {
    if (destroyed) return;
    cancelAttachment(); attachmentError = '';
    if (Object.prototype.hasOwnProperty.call(nextData || {}, "value")) {
      currentValue = String(nextData.value || "");
    }
    if (Object.prototype.hasOwnProperty.call(nextData || {}, "attachmentCount")) {
      attachmentCount = normalizeAttachmentCount(nextData.attachmentCount);
    }
    currentOptions = { ...currentOptions, ...(nextOptions || {}) };
    render();
  }

  function destroy() {
    destroyed = true; cancelAttachment();
    refs = {};
    clearNode(container);
  }

  function setValue(value) {
    currentValue = String(value || "");
    if (refs.input) {
      refs.input.value = currentValue;
    }
    syncButtons();
  }

  function getValue() {
    return String(currentValue || "");
  }

  function clear() {
    setValue("");
  }

  function focus() {
    refs.input?.focus?.();
  }

  function setBusy(busy) {
    if (destroyed) return;
    if (busy) cancelAttachment();
    currentOptions = { ...currentOptions, busy: Boolean(busy) };
    render();
  }

  function getState() {
    return {
      value: getValue(),
      attachmentCount,
      options: { ...currentOptions },
    };
  }

  function syncButtons() {
    if (refs.send) {
      refs.send.disabled = isSendDisabled();
    }
    if (refs.attach) {
      refs.attach.disabled = isInteractionBlocked() || attachmentBusy;
    }
    if (refs.fileInput) {
      refs.fileInput.disabled = isInteractionBlocked();
    }
    for (const kind of ['audio','video']) if (refs[kind]) refs[kind].disabled = isInteractionBlocked() || attachmentBusy;
  }

  function isInteractionBlocked() {
    return Boolean(currentOptions.disabled || currentOptions.busy);
  }

  function isSendDisabled() {
    return destroyed || isInteractionBlocked() || attachmentBusy ||
      (!String(currentValue || "").trim() && !(currentOptions.allowAttachmentOnly && attachmentCount > 0));
  }

  // The app owns and validates its queue. Updating its count must not cancel capture or lose focus.
  function setAttachmentCount(count) {
    if (destroyed) return;
    attachmentCount = normalizeAttachmentCount(count);
    syncButtons();
  }

  render();
  return { update, destroy, setValue, getValue, clear, focus, setBusy, setAttachmentCount, getState, get refs() { return {...refs}; } };
}

function normalizeAttachmentCount(count) {
  const value = Number(count);
  return Number.isSafeInteger(value) && value > 0 ? value : 0;
}

function getClipboardFiles(clipboardData) {
  const files = [];
  const items = Array.from(clipboardData?.items || []);
  items.forEach((item) => {
    if (item?.kind !== "file" || typeof item.getAsFile !== "function") {
      return;
    }
    const file = item.getAsFile();
    if (file) {
      files.push(file);
    }
  });
  if (files.length) {
    return files;
  }
  return Array.from(clipboardData?.files || []).filter(Boolean);
}

function normalizeSelectedFiles(files, currentOptions = {}) {
  return Array.from(files || [])
    .filter(Boolean)
    .filter((file) => matchesAccept(file, currentOptions?.accept))
    .slice(0, currentOptions?.multiple === false ? 1 : undefined);
}

function matchesAccept(file, accept) {
  const tokens = String(accept || "")
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (!tokens.length) {
    return true;
  }
  const name = String(file?.name || "").toLowerCase();
  const type = String(file?.type || "").toLowerCase();
  return tokens.some((token) => {
    if (token.endsWith("/*")) {
      return Boolean(type) && type.startsWith(token.slice(0, -1));
    }
    if (token.startsWith(".")) {
      return name.endsWith(token);
    }
    return Boolean(type) && type === token;
  });
}
