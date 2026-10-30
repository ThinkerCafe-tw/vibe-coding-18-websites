import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const safePath = value => typeof value === 'string' && /^(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+$/.test(value) && !value.split('/').some(p => p === '.' || p === '..');

export async function validateMaterials(root, report) {
  const missingReferences = new Map();
  const episodes = JSON.parse(await fs.readFile(path.join(root, 'episodes/manifest.json'), 'utf8'));
  for (const episode of episodes) {
    const directory = path.join(root, 'episodes', episode.slug);
    const prefix = `${episode.slug}/materials.json`;
    try {
      const data = JSON.parse(await fs.readFile(path.join(directory, 'materials.json'), 'utf8'));
      if (data.schemaVersion !== 1 || data.episode !== episode.slug || !Array.isArray(data.materials) || !Array.isArray(data.missing)) throw new Error('頂層格式不符 v1');
      if (Number(episode.number) >= 13 && data.materials.length === 0) report(`${prefix} EP13–18 必須提供素材。`);
      const ids = new Set();
      const files = {};
      for (const item of data.materials) {
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id) || ids.has(item.id)) throw new Error(`id 缺少或重複：${item.id}`);
        ids.add(item.id);
        if (!item.label || !['prompt', 'image', 'starter-html', 'other'].includes(item.kind)) throw new Error(`${item.id} 名稱或種類無效`);
        if (!Array.isArray(item.usedInVideoAt) || !item.usedInVideoAt.length || item.usedInVideoAt.some(c => !/^\d{3}[a-z]?$/.test(c))) throw new Error(`${item.id} 缺少有效影片段落`);
        const hasText = typeof item.text === 'string', hasFile = typeof item.file === 'string';
        if (hasText === hasFile || (hasText && !item.text)) throw new Error(`${item.id} 需提供 text 或 file，且只能擇一`);
        if (item.kind === 'prompt' && !hasText) throw new Error(`${item.id} 提示詞需提供全文 text`);
        if (['image', 'starter-html'].includes(item.kind) && !hasFile) throw new Error(`${item.id} 需提供 file`);
        if (item.kind === 'image' && !item.imagePrompt?.includes('示意圖，待換店家照片')) throw new Error(`${item.id} 缺少圖片生成建議或示意標示`);
        if (hasFile && !safePath(item.file)) throw new Error(`${item.id} 檔案路徑不安全`);
        const bytes = hasText ? Buffer.from(item.text, 'utf8') : await fs.readFile(path.join(directory, item.file));
        if (!/^[a-f0-9]{64}$/.test(item.sha256) || hash(bytes) !== item.sha256) throw new Error(`${item.id} SHA-256 不一致`);
        if (item.kind === 'starter-html') files[item.id] = bytes.toString('utf8');
        for (const missing of item.missingDependencies || []) {
          if (item.kind !== 'starter-html' || !safePath(missing.file) || !missing.reason || !data.missing.some(m => m.reason === missing.reason)) throw new Error(`${item.id} 缺件必須在頂層明確揭露`);
          const htmlPath = path.join(directory, item.file);
          try { await fs.access(path.resolve(path.dirname(htmlPath), missing.file)); throw new Error(`${item.id} 已存在的檔案不可列為缺件`); }
          catch (error) { if (error.code !== 'ENOENT') throw error; }
          const list = missingReferences.get(htmlPath) || new Set();
          list.add(missing.file);
          missingReferences.set(htmlPath, list);
        }
      }
      for (const missing of data.missing) if (!missing.id || !missing.label || !missing.reason || !Array.isArray(missing.usedInVideoAt)) throw new Error('缺件說明格式錯誤');
      const html = await fs.readFile(path.join(directory, 'index.html'), 'utf8');
      const embedded = html.match(/<script type="application\/json" id="lesson-material-data">([\s\S]*?)<\/script>/);
      if (!embedded) throw new Error('本講頁缺少素材資料');
      const payload = JSON.parse(embedded[1]);
      if (JSON.stringify(payload.materials) !== JSON.stringify(data.materials)) throw new Error('頁面素材與 JSON 不一致，請重建');
      if (JSON.stringify(payload.fileTexts) !== JSON.stringify(files)) throw new Error('頁面 HTML 複製內容與檔案不一致，請重建');
      if ((html.match(/class="material-card"/g) || []).length !== data.materials.length) throw new Error('素材卡片數量不一致');
    } catch (error) { report(`${prefix}：${error.message}`); }
  }
  return missingReferences;
}
