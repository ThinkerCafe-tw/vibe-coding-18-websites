/* 必填文字先去除首尾空白，再交給各講的送出流程；保留姓名中的空格。 */
(() => {
  const message = "請填寫內容，不能只輸入空白。";
  const errors = new Map();
  const selector = 'input[required], textarea[required]';
  const textTypes = new Set(["text", "tel", "email", "url", "search"]);

  // A confirmation belongs to the last submission, not the next draft.
  // Only opt-in transient results are cleared; numbered records stay visible.
  function clearConfirmation(form) {
    const result = document.getElementById(form.dataset.successResult || "");
    if (result) result.hidden = true;
    const feedback = document.getElementById(form.dataset.formFeedback || "");
    if (feedback) feedback.textContent = "";
  }

  for (const type of ["input", "change", "invalid", "reset"]) {
    document.addEventListener(type, event => {
      const form = event.target instanceof HTMLFormElement ? event.target : event.target.form;
      if (form) clearConfirmation(form);
    }, true);
  }

  function isText(field) {
    return !field.disabled && !field.readOnly &&
      (field.tagName === "TEXTAREA" || textTypes.has(field.type));
  }

  function clear(field) {
    const error = errors.get(field);
    if (!error) return;
    if (field.validationMessage === message) field.setCustomValidity("");
    field.removeAttribute("aria-invalid");
    const describedBy = (field.getAttribute("aria-describedby") || "")
      .split(/\s+/).filter(id => id && id !== error.id).join(" ");
    if (describedBy) field.setAttribute("aria-describedby", describedBy);
    else field.removeAttribute("aria-describedby");
    error.remove();
    errors.delete(field);
  }

  function show(field) {
    let error = errors.get(field);
    if (!error) {
      error = document.createElement("p");
      error.id = "required-text-error-" + (field.id || field.name);
      error.className = "required-text-error";
      error.style.cssText = "margin:6px 0;font-size:14px;color:#a32929";
      error.setAttribute("role", "alert");
      field.insertAdjacentElement("afterend", error);
      errors.set(field, error);
      field.setAttribute("aria-describedby",
        ((field.getAttribute("aria-describedby") || "") + " " + error.id).trim());
    }
    error.textContent = message;
    field.setCustomValidity(message);
    field.setAttribute("aria-invalid", "true");
  }

  // Capture before any booking handler can create a record or reserve capacity.
  document.addEventListener("submit", event => {
    if (!(event.target instanceof HTMLFormElement)) return;
    clearConfirmation(event.target);
    let firstInvalid;
    for (const field of event.target.querySelectorAll(selector)) {
      if (!isText(field)) continue;
      const value = field.value.trim();
      if (!value) {
        show(field);
        firstInvalid ||= field;
      } else {
        clear(field);
        field.value = value;
      }
    }
    if (firstInvalid) {
      event.preventDefault();
      event.stopImmediatePropagation();
      firstInvalid.focus();
      firstInvalid.reportValidity();
    }
  }, true);

  document.addEventListener("input", event => {
    if (errors.has(event.target) && event.target.value.trim()) clear(event.target);
  }, true);
  document.addEventListener("reset", event => {
    for (const field of event.target.querySelectorAll(selector)) clear(field);
  }, true);
})();
