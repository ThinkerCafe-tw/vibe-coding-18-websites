/* 先驗證必填文字與明示格式，再交給各講建立紀錄；保留姓名中的空格。 */
(() => {
  const message = "請填寫內容，不能只輸入空白。";
  const errors = new Map();
  const selector = 'input[required], textarea[required], [data-contact-kind], [data-age-format]';
  const textTypes = new Set(["text", "tel", "email", "url", "search"]);

  function validationMessage(field) {
    const value = field.value.trim();
    if (!value) return field.required ? message : "";
    if (field.dataset.contactKind) {
      // Accept common Taiwan phone separators and +886, without stripping letters.
      const phone = /^[+0-9()\s-]+$/.test(value) ? value.replace(/[()\s-]/g, "").replace(/^\+886/, "0") : "";
      const mobile = /^09[0-9]{8}$/.test(phone);
      if (field.dataset.contactKind === "email-or-mobile") {
        return mobile || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "請填有效 Email 或 09 開頭的十碼手機（也可用 +886）。";
      }
      return mobile || /^0[2-8][0-9]{7,8}$/.test(phone) ? "" : "請填有效的台灣手機或市話，可含空格、括號、連字號或 +886。";
    }
    if (field.dataset.ageFormat === "pet") {
      const years = /^(\d+)(?:歲(?:\s*(\d+)(?:個)?月)?)?$/.exec(value);
      const months = /^(\d+)(?:個)?月$/.exec(value);
      const validYears = years && Number.isSafeInteger(Number(years[1])) && (!years[2] || Number(years[2]) < 12);
      const validMonths = months && Number.isSafeInteger(Number(months[1]));
      return validYears || validMonths ? "" : "請填非負整數年齡，例如 3歲、0歲3個月或3歲6個月；歲後的月份須為 0 至 11。";
    }
    return "";
  }

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
    if (field.validationMessage === error.textContent) field.setCustomValidity("");
    field.removeAttribute("aria-invalid");
    const describedBy = (field.getAttribute("aria-describedby") || "")
      .split(/\s+/).filter(id => id && id !== error.id).join(" ");
    if (describedBy) field.setAttribute("aria-describedby", describedBy);
    else field.removeAttribute("aria-describedby");
    error.remove();
    errors.delete(field);
  }

  function show(field, text) {
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
    error.textContent = text;
    field.setCustomValidity(text);
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
      const error = validationMessage(field);
      if (error) {
        show(field, error);
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
      // Keep forms with an existing error summary consistent with inline errors.
      const feedback = document.getElementById(event.target.dataset.formFeedback || "");
      if (feedback) feedback.textContent = !firstInvalid.value.trim()
        ? event.target.dataset.requiredTextMessage || firstInvalid.validationMessage
        : firstInvalid.validationMessage;
    }
  }, true);

  document.addEventListener("input", event => {
    if (!errors.has(event.target)) return;
    const error = validationMessage(event.target);
    if (error) show(event.target, error);
    else clear(event.target);
  }, true);
  document.addEventListener("reset", event => {
    for (const field of event.target.querySelectorAll(selector)) clear(field);
  }, true);
})();
