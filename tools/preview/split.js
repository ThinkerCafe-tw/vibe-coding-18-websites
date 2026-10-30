(() => {
/** Assemble only the explicit placeholders in the supplied HTML skeleton. */
function assembleParts(html, css, script) {
  for (const [name, value] of [['第一段 HTML', html], ['第二段 CSS', css], ['第三段 JavaScript', script]]) {
    if (typeof value !== 'string' || !value.trim()) {throw new Error(`請先貼入${name}。`);}
    if (/^\s*```/.test(value)) {throw new Error(`${name}請貼程式碼本身，不要包含外面的三個反引號。`);}
  }
  if (!/^\s*<!doctype\s+html\s*>/i.test(html) || !/<\/html\s*>\s*$/i.test(html)) {throw new Error('第一段需要從 <!doctype html> 到 </html> 的完整骨架，請確認沒有截斷。');}
  if (/<\/?style(?:\s|>)/i.test(css)) {throw new Error('第二段只需要 CSS 內容，請移除外面的 style 標籤。');}
  if (/<\/?script(?:\s|>)/i.test(script)) {throw new Error('第三段只需要 JavaScript 內容，請移除外面的 script 標籤；若程式字串包含此標籤，請請 AI 改成安全寫法。');}
  const cssSlot = /(<style\b[^>]*>\s*)\/\*\s*第二段貼這裡\s*\*\/(\s*<\/style\s*>)/gi;
  const jsSlot = /(<script\b[^>]*>\s*)\/\*\s*第三段貼這裡\s*\*\/(\s*<\/script\s*>)/gi;
  if ([...html.matchAll(cssSlot)].length !== 1 || [...html.matchAll(jsSlot)].length !== 1) {throw new Error('第一段需各保留一個「第二段貼這裡」和「第三段貼這裡」；這份格式不同，請請 AI 按教材的三段格式重給骨架。');}
  return html.replace(cssSlot, (_match, open, close) => open + css + close)
    .replace(jsSlot, (_match, open, close) => open + script + close);
}


const fields = ['part-html', 'part-css', 'part-js'].map(id => document.getElementById(id));
const status = document.getElementById('assembly-status');
const storageKey = 'cts-student-preview:three-parts:v1';
let splitPending = false;
let writingAssembly = false;
const completeInput = document.getElementById('html-input');
const saveButtons = ['save-button', 'replace-button'].map(id => document.getElementById(id));
// A failed or edited assembly must never save the previous complete HTML silently.
for (const button of saveButtons) {button.addEventListener('click', event => {
  if (!splitPending) return;
  event.preventDefault();event.stopImmediatePropagation();
  status.classList.add('error');
  status.textContent = '三段內容已變更。請先按「組成完整網頁」，看到成功訊息後再儲存。';
  status.scrollIntoView({ block: 'center', behavior: 'auto' });
}, { capture: true });}
completeInput.addEventListener('input', () => {
  if (writingAssembly) {return;}
  splitPending = false;
  status.classList.remove('error');
  status.textContent = '你正在直接編輯下方的完整 HTML。儲存時會使用下方這一份內容。';
});
try { const draft = JSON.parse(localStorage.getItem(storageKey) || 'null');if (Array.isArray(draft)) {fields.forEach((field, index) => { field.value = typeof draft[index] === 'string' ? draft[index] : ''; });} }
catch { status.textContent = '這台瀏覽器無法讀取分段草稿，仍可直接貼入操作。'; }
for (const field of fields) {field.addEventListener('input', () => {
  splitPending = true;status.classList.remove('error');
  status.textContent = '三段內容已變更，請重新按「組成完整網頁」再看結果。';
  try { localStorage.setItem(storageKey, JSON.stringify(fields.map(item => item.value))); }
  catch { status.textContent = '草稿備援不可用，關閉前請先保留程式碼。'; }
});}
document.getElementById('assemble-parts').addEventListener('click', () => {
  try {
    const combined = assembleParts(...fields.map(field => field.value));
    const input = completeInput;input.value = combined;
    splitPending = false;writingAssembly = true;
    try { input.dispatchEvent(new Event('input', { bubbles: true })); }
    finally { writingAssembly = false; }
    status.classList.remove('error');status.textContent = '三段已組成完整 HTML，原標籤保留。請在下方按「儲存並預覽」看畫面。';
    input.focus();input.scrollIntoView({ block: 'center', behavior: 'auto' });
  } catch (error) { splitPending = true;status.classList.add('error');status.textContent = error.message; }
});

})();
