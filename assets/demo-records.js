/* 頁內教學紀錄由各講自己的資料陣列提供；這裡只負責呈現，不另存一份狀態。 */
window.renderDemoRecords = function (anchorId, records) {
  const id = anchorId + "-records";
  let panel = document.getElementById(id);
  if (!panel) {
    panel = document.createElement("section");
    panel.id = id;
    panel.className = "demo-records";
    panel.style.cssText = "margin-top:24px;padding:16px;border:1px solid currentColor;max-width:100%;overflow-wrap:anywhere";
    panel.setAttribute("aria-label", "本頁紀錄");
    document.getElementById(anchorId).insertAdjacentElement("afterend", panel);
  }
  const opened = new Set([...panel.querySelectorAll("details[open]")].map(el => el.dataset.demoRecordId));
  panel.replaceChildren();
  const title = document.createElement("h3");
  title.textContent = "本頁紀錄（" + records.length + " 筆）";
  panel.appendChild(title);
  const note = document.createElement("p");
  note.textContent = "點編號可查閱先前資料。紀錄只保留在目前頁面，重新整理會清空本頁新增紀錄並還原名額。";
  panel.appendChild(note);
  records.forEach(record => {
    const item = document.createElement("details");
    item.dataset.demoRecordId = record.id;
    item.open = opened.has(record.id);
    const summary = document.createElement("summary");
    summary.textContent = record.id + "｜" + record.title;
    item.appendChild(summary);
    const list = document.createElement("dl");
    for (const [label, value] of record.fields) {
      const term = document.createElement("dt"), description = document.createElement("dd");
      term.textContent = label;
      description.textContent = String(value || "（未填）");
      description.style.margin = "0 0 12px";
      list.append(term, description);
    }
    item.appendChild(list);
    panel.appendChild(item);
  });
};
