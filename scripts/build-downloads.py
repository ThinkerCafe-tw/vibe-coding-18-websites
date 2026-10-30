"""Rebuild the 18 standalone downloads from the current lesson sources."""
from pathlib import Path
import html
import json
import re
import zipfile
import sys
from importlib.util import spec_from_file_location, module_from_spec

ROOT = Path(__file__).resolve().parent.parent


def offline_lesson(data):
    """Keep links usable when the learner opens the ZIP with file://."""
    data = data.replace(b'href="../../"', b'href="../../index.html"')
    data = data.replace(b'href="site/"', b'href="site/index.html"')
    return re.sub(rb'<a href="../../downloads/[^"]+" download>.*?</a>', b'', data)


def build(episode):
    slug = episode['slug']
    title = html.escape(f"EP{episode['number']} {episode['title']}")
    has_home = slug == 'ep18-review' and (ROOT / 'episodes' / slug / 'materials/home/index.html').is_file()
    website = 'materials/home/index.html' if has_home else 'site/index.html'
    website_label = '開啟我的接案首頁參考版' if has_home else '開啟網站'
    textbook_link = (f'<p><a href="episodes/{slug}/site/index.html">對照課本原提示詞的總複習工作台</a></p>'
                     if has_home else '')
    entry = f'''<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>{title}</title>
<link rel="icon" href="data:,"></head>
<body style="max-width:800px;margin:40px auto;padding:20px;font:20px/1.8 sans-serif">
<h1>{title}</h1><p><a href="episodes/{slug}/{website}">{website_label}</a></p>
{textbook_link}
<p><a href="episodes/{slug}/index.html">閱讀規格、對話提示卡與驗收清單</a></p>
<p>本套件可直接開檔使用。互動為課程示意；請使用虛構練習資料。</p></body></html>'''
    files = {p.relative_to(ROOT).as_posix(): p.read_bytes()
             for p in (ROOT / 'episodes' / slug).rglob('*') if p.is_file()}
    for name in ['LICENSE', 'LICENSE-CONTENT', 'assets/teaching.css', 'assets/teaching.js', 'assets/materials.js']:
        files[name] = (ROOT / name).read_bytes()
    for p in (ROOT / 'tools' / 'preview').rglob('*'):
        if p.is_file():
            files[p.relative_to(ROOT).as_posix()] = p.read_bytes()
    if slug == 'ep18-review':
        # The opening studio links to these two lesson examples. Reference their
        # canonical files so its links also work in the standalone archive.
        for name in ['episodes/ep16-event/materials/index-after.html',
                     'episodes/ep17-consultant/materials/index-before.html']:
            files[name] = (ROOT / name).read_bytes()
    if b'assets/demo-records.js' in files[f'episodes/{slug}/site/index.html']:
        files['assets/demo-records.js'] = (ROOT / 'assets/demo-records.js').read_bytes()
    if b'assets/form-validation.js' in files[f'episodes/{slug}/site/index.html']:
        files['assets/form-validation.js'] = (ROOT / 'assets/form-validation.js').read_bytes()
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
    sys.dont_write_bytecode = True
    # Keep every ZIP's offline view synchronized with its canonical JSON.
    spec = spec_from_file_location('build_materials', ROOT / 'scripts/build-materials.py')
    materials = module_from_spec(spec)
    spec.loader.exec_module(materials)
    materials.build()
    for episode in json.loads((ROOT / 'episodes/manifest.json').read_text()):
        build(episode)
