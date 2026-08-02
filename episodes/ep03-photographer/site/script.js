const form = document.querySelector("#inquiry-form");
const status = document.querySelector("#form-status");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  status.textContent = "";

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  status.textContent = "資料格式已檢查完成。這是課程示意，內容不會送出或保存。";
});
