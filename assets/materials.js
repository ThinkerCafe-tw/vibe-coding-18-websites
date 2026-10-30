(() => {
  const node = document.getElementById('lesson-material-data');
  if (!node) return;
  const data = JSON.parse(node.textContent);
  const materials = new Map(data.materials.map(item => [item.id, item]));

  async function copy(text) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch { /* file:// and denied clipboard permission use a local fallback. */ }
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('aria-label', '待複製的完整內容');
    Object.assign(area.style, {position: 'fixed', left: '0', top: '0', opacity: '0'});
    document.body.append(area);
    area.focus();
    area.select();
    area.setSelectionRange(0, text.length);
    let success = false;
    try { success = document.execCommand('copy'); } catch { /* Manual fallback below. */ }
    area.remove();
    return success;
  }

  document.querySelectorAll('[data-copy-material]').forEach(button => {
    button.disabled = false;
    button.addEventListener('click', async () => {
      const item = materials.get(button.dataset.copyMaterial);
      const text = button.dataset.copyField === 'file' ? data.fileTexts[item.id] : item[button.dataset.copyField];
      const card = button.closest('.material-card');
      const status = card.querySelector('.copy-status');
      const success = await copy(text);
      card.querySelector('.copy-manual')?.remove();
      if (success) {
        status.textContent = '已複製完整內容，可以貼上了。';
        button.focus({preventScroll: true});
      } else {
        status.textContent = '瀏覽器未允許自動複製。請在下方全選並複製完整內容。';
        const area = document.createElement('textarea');
        area.className = 'copy-manual';
        area.readOnly = true;
        area.value = text;
        area.setAttribute('aria-label', item.label + '：手動複製全文');
        status.after(area);
        area.focus();
        area.select();
      }
    });
  });
})();
