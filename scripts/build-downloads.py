"""Rebuild the 18 standalone downloads from the current lesson sources."""
from pathlib import Path
import html
import json
import re
import zipfile

ROOT = Path(__file__).resolve().parent.parent


def offline_lesson(data):
    """Keep links usable when the learner opens the ZIP with file://."""
    data = data.replace(b'href="../../"', b'href="../../index.html"')
    data = data.replace(b'href="site/"', b'href="site/index.html"')
    return re.sub(rb'<a href="../../downloads/[^"]+" download>.*?</a>', b'', data)


def build(episode):
    slug = episode['slug']
    title = html.escape(f"EP{episode['number']} {episode['title']}")
    entry = f'''<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>{title}</title>
<link rel="icon" href="data:,"></head>
<body style="max-width:800px;margin:40px auto;padding:20px;font:20px/1.8 sans-serif">
<h1>{title}</h1><p><a href="episodes/{slug}/site/index.html">開啟網站</a></p>
<p><a href="episodes/{slug}/index.html">閱讀規格、對話提示卡與驗收清單</a></p>
<p>本套件可直接開檔使用。互動為課程示意；請使用虛構練習資料。</p></body></html>'''
    files = {p.relative_to(ROOT).as_posix(): p.read_bytes()
             for p in (ROOT / 'episodes' / slug).rglob('*') if p.is_file()}
    for name in ['LICENSE', 'LICENSE-CONTENT', 'assets/teaching.css', 'assets/teaching.js']:
        files[name] = (ROOT / name).read_bytes()
    if b'assets/demo-records.js' in files[f'episodes/{slug}/site/index.html']:
        files['assets/demo-records.js'] = (ROOT / 'assets/demo-records.js').read_bytes()
    lesson = f'episodes/{slug}/index.html'
    files[lesson] = offline_lesson(files[lesson])
    files['index.html'] = entry.encode()
    output = ROOT / episode['downloadUrl']
    with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as bundle:
        for name, data in sorted(files.items()):
            info = zipfile.ZipInfo(name, (2026, 10, 24, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            bundle.writestr(info, data)
    print(f'已重建 {output.relative_to(ROOT)}')


if __name__ == '__main__':
    for episode in json.loads((ROOT / 'episodes/manifest.json').read_text()):
        build(episode)
