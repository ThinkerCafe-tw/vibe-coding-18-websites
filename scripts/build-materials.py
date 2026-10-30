"""Render lesson materials from canonical JSON, including offline copy payloads."""
from pathlib import Path
import argparse
import html
import json
import re

ROOT = Path(__file__).resolve().parent.parent
START = '<!-- materials:start -->'
END = '<!-- materials:end -->'


def escaped(value):
    return html.escape(str(value), quote=True)


def escaped_pre(value):
    # Preserve original whitespace in the DOM without trailing source whitespace
    # in generated HTML. Clipboard content comes from the unmodified JSON payload.
    return re.sub(r'[ \t]+(?=\n|$)', lambda m: ''.join('&#32;' if c == ' ' else '&#9;' for c in m[0]), escaped(value))


def render(directory):
    data = json.loads((directory / 'materials.json').read_text())
    payload = {'materials': data['materials'], 'fileTexts': {}}
    parts = [START, '<section id="materials" aria-labelledby="materials-title">',
             '<p class="materials-eyebrow">先備齊素材，再開始實作</p>',
             '<h2 id="materials-title">跟著影片做</h2>',
             '<p>依影片順序取用完整提示詞、圖片與網頁。提示詞已含影片貼入的全文；AI 回覆可能不同，要對照影片練習時，請選下方指定的範例版本。</p>',
             '<div class="material-actions"><a class="source" href="../../tools/preview/index.html" target="_blank" rel="noopener">開啟貼上預覽工具</a>',
             '<a class="source" href="materials.json" download>下載本講素材清單</a></div>',
             '<p class="materials-help">本區與下載套件可離線使用。按鈕若無法寫入剪貼簿，會顯示可手動複製的全文。圖片生成提示是另附的練習建議，原圖以下載檔為準。</p>']
    if not data['materials']:
        parts.append('<p class="materials-empty">本講影片素材尚在整理。可先使用下方的規格、對話提示卡、驗收清單與完成版網站。</p>')
    else:
        parts.append('<ol class="materials-list">')
        for index, item in enumerate(data['materials']):
            mid = escaped(item['id'])
            cues = item['usedInVideoAt']
            cue_label = '、'.join(cues) if len(cues) < 6 else f'{cues[0]} 起，依旁白順序'
            parts.extend([f'<li class="material-card" id="material-{mid}">',
                          f'<p class="material-step">素材 {index + 1:02d} · 影片段落 {escaped(cue_label)}</p>',
                          f'<h3>{escaped(item["label"])}</h3>',
                          f'<p>{escaped(item.get("description", ""))}</p>'])
            if item['kind'] == 'image':
                parts.append(f'<figure><img src="{escaped(item["file"])}" alt="{escaped(item["label"])}" loading="lazy"><figcaption>示意圖，待換店家照片</figcaption></figure>')
            parts.append('<div class="material-actions">')
            if 'file' in item:
                parts.append(f'<a class="source" href="{escaped(item["file"])}" download>下載 {escaped(Path(item["file"]).name)}</a>')
                if item['kind'] == 'starter-html':
                    payload['fileTexts'][item['id']] = (directory / item['file']).read_bytes().decode('utf-8')
                    parts.append(f'<button type="button" data-copy-material="{mid}" data-copy-field="file" disabled>複製全文</button>')
                    parts.append(f'<a class="source" href="{escaped(item["file"])}" target="_blank" rel="noopener">開啟此版本</a>')
            if 'text' in item:
                label = '一鍵複製' if item['kind'] == 'prompt' else '複製操作順序'
                parts.append(f'<button type="button" data-copy-material="{mid}" data-copy-field="text" disabled>{label}</button>')
            if item['kind'] == 'image':
                parts.append(f'<button type="button" data-copy-material="{mid}" data-copy-field="imagePrompt" disabled>複製圖片提示詞</button>')
            parts.append('</div><p class="copy-status" role="status" aria-live="polite"></p>')
            text = item.get('text', payload['fileTexts'].get(item['id'], item.get('imagePrompt', '')))
            if text:
                title = '展開圖片提示詞' if item['kind'] == 'image' else '展開全文'
                parts.append(f'<details class="material-full"><summary>{title}</summary><pre>{escaped_pre(text)}</pre></details>')
            parts.append(f'<details class="material-hash"><summary>檔案核對碼（SHA-256）</summary><code>{item["sha256"]}</code></details></li>')
        parts.append('</ol>')
    if data.get('missing'):
        parts.append('<aside class="materials-missing" aria-label="來源缺件說明"><h3>來源缺件說明</h3><ul>')
        for missing in data['missing']:
            parts.append(f'<li><strong>{escaped(missing["label"])}</strong>：{escaped(missing["reason"])}</li>')
        parts.append('</ul></aside>')
    parts.append('<noscript><p>瀏覽器未啟用 JavaScript，請展開全文手動複製，或按下載取得檔案。</p></noscript>')
    # JSON script data is never executable; escape all HTML delimiters, including closing script tags in examples.
    safe = json.dumps(payload, ensure_ascii=False, separators=(',', ':')).replace('&', '\\u0026').replace('<', '\\u003c').replace('>', '\\u003e').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
    parts.append(f'<script type="application/json" id="lesson-material-data">{safe}</script>')
    parts.extend(['</section>', END])
    return '\n'.join(parts)


def build(check=False):
    failed = []
    for ep in json.loads((ROOT / 'episodes/manifest.json').read_text()):
        directory = ROOT / 'episodes' / ep['slug']
        entry = directory / 'index.html'
        old = entry.read_text()
        new = re.sub(r'<!-- materials:start -->[\s\S]*?<!-- materials:end -->', lambda _: render(directory), old) if START in old else old.replace('<main>', '<main>\n' + render(directory) + '\n', 1)
        if 'assets/materials.js' not in new:
            new = new.replace('</head>', '<script src="../../assets/materials.js" defer></script></head>', 1)
        if new != old:
            if check:
                failed.append(str(entry.relative_to(ROOT)))
            else:
                entry.write_text(new)
    if failed:
        raise SystemExit('素材頁尚未重建：' + ', '.join(failed))
    print('18 講素材頁' + ('與 JSON 一致。' if check else '已重建。'))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    build(parser.parse_args().check)
