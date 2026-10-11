let nextErrorId = 0;

// Associate feedback with an existing canonical control; never replace its DOM.
export function setFieldError(target, errorElement, message = "") {
  if (!target || !errorElement) return;
  if (!errorElement.id) errorElement.id = `ui-field-error-${++nextErrorId}`;
  const ids = new Set((target.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean));
  ids.add(errorElement.id);
  target.setAttribute("aria-describedby", [...ids].join(" "));
  target.classList.add("ui-field-error-target");
  const text = String(message || "").trim();
  errorElement.classList.add("ui-form-error");
  errorElement.textContent = text;
  errorElement.hidden = !text;
  if (text) target.setAttribute("aria-invalid", "true");
  else target.removeAttribute("aria-invalid");
}

export function createFieldErrorAdapter(container, options = {}) {
  const target = options.target || container;
  if (!target?.setAttribute || !container?.appendChild) throw new TypeError("A field container and accessible control target are required.");
  const originalDescription = target.getAttribute("aria-describedby");
  const originalInvalid = target.getAttribute("aria-invalid");
  const hadClass = target.classList.contains("ui-field-error-target");
  const error = container.ownerDocument.createElement("p");
  container.appendChild(error);
  let destroyed = false;
  const setError = message => { if (!destroyed) setFieldError(target, error, message); };
  const clear = () => setError("");
  const changed = () => {
    if (!error.hidden) setError(typeof options.validate === "function" ? options.validate() : "");
  };
  container.addEventListener("input", changed);
  container.addEventListener("change", changed);
  clear();
  return {
    setError, clear,
    focus() { if (!destroyed) target.focus?.(); },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      container.removeEventListener("input", changed);
      container.removeEventListener("change", changed);
      error.remove();
      if (originalDescription == null) target.removeAttribute("aria-describedby");
      else target.setAttribute("aria-describedby", originalDescription);
      if (originalInvalid == null) target.removeAttribute("aria-invalid");
      else target.setAttribute("aria-invalid", originalInvalid);
      if (!hadClass) target.classList.remove("ui-field-error-target");
    },
  };
}
