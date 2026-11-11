"""将已采集的官网前端、素材和数据整理为可本地运行的项目。"""
import json
import re
import shutil
import subprocess
from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / 'site'
PUBLIC = SITE / 'public'
CACHE = ROOT / '.capture/assets'
PUBLIC.mkdir(exist_ok=True)

def localize(text):
    text = re.sub(r'https://web\.hycdn\.cn/[^\s"\'<>\\]+\.mp4', '/local-preview.mp4', text)
    text = text.replace('https://web.hycdn.cn/hg_web_sdk/lib/sdk.entry.js', '/local-runtime.js')
    text = text.replace('https://web.hycdn.cn', '/vendor')
    return text

count = 0
for file in CACHE.rglob('*'):
    if not file.is_file() or ('hg_web_sdk' in file.parts and file.suffix == '.js'):
        continue
    destination = PUBLIC / 'vendor' / file.relative_to(CACHE)
    destination.parent.mkdir(parents=True, exist_ok=True)
    if file.suffix in ('.html', '.js', '.css', '.m3u8', '.json', '.svg'):
        text = localize(file.read_text(encoding='utf-8'))
        if file.name.startswith('main-app-'):
            # 本地展示无需向原站发送错误、性能或会话记录。
            text, hits = re.subn(r'94680:function\(e,t,n\)\{.*?\},89217:', '94680:function(){},89217:', text, count=1)
            assert hits == 1, '未找到预期的原站监测初始化模块'
        destination.write_text(text, encoding='utf-8', newline='')
    else:
        shutil.copyfile(file, destination)
    count += 1

html = localize((ROOT / 'source.html').read_text(encoding='utf-8'))
html = html.replace('<head>', '<head><script src="/local-runtime.js"></script>', 1)
# 同步清理首屏 HTML 与客户端组件，避免水合前闪现服务入口。
document = BeautifulSoup(html, 'html.parser')
for selector in ['._e32dd037', '._d16ac76f', '._6b41422f', '._b9c239f0', 'a._638366ab']:
    for element in document.select(selector):
        element.decompose()
for element in document.select('._c684c97a, ._b6f1b9e5'):
    element.name = 'div'
    for attribute in ['href', 'target']:
        element.attrs.pop(attribute, None)
for element in document.select('._149a6e98 > ._950ab946'):
    if '_e6c9defd' in element.get('class', []):
        element['aria-label'] = element['title'] = '背景音乐'
    else:
        element.decompose()
for index, element in enumerate(document.select('._0efc3f45 > ._c73a26d4')):
    if index in (0, 2):
        element.decompose()
for element in document.select('._7409d88d > ._7d8e81d6'):
    if element.get_text(strip=True) in ('MONSTER SIREN', 'OPERATOR'):
        element.decompose()
style = document.new_tag('link', rel='stylesheet', href='/frontend-only.css')
document.head.append(style)
html = str(document)
(SITE / 'index.html').write_text(html, encoding='utf-8', newline='')
shutil.copyfile(SITE / 'src/local-runtime.js', PUBLIC / 'local-runtime.js')
shutil.copyfile(SITE / 'src/frontend-only.css', PUBLIC / 'frontend-only.css')
subprocess.run(['node', str(ROOT / '.capture/frontend-only.mjs')], cwd=ROOT, check=True)

# 页脚只保留静态素材署名，不再加载 SDK 的服务与站外链接。
shutil.copyfile(SITE / 'src/footer.html', PUBLIC / 'footer.html')

snapshots = json.loads((ROOT / '.capture/evidence/api-snapshots.json').read_text(encoding='utf-8'))
for snapshot in snapshots:
    if '/api/archive/video' in snapshot['url']:
        target = PUBLIC / 'data/videos.json'
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(localize(snapshot['body']), encoding='utf-8')
old_snapshot = PUBLIC / 'api/archive/video'
if old_snapshot.is_file():
    old_snapshot.unlink()

preview = PUBLIC / 'local-preview.mp4'
if not preview.exists():
    source = CACHE / 'arknights/official/home_videos/PV04_landscape-00001.ts'
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(source), '-t', '12', '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '25', '-vf', 'scale=1280:-2', '-movflags', '+faststart', str(preview)], check=True)

pkg_path = SITE / 'package.json'
pkg = json.loads(pkg_path.read_text(encoding='utf-8'))
pkg['name'] = 'arknights-local-replica'
pkg['scripts']['dev'] = 'vite --host 127.0.0.1 --port 4173'
pkg_path.write_text(json.dumps(pkg, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'copied': count, 'preview_bytes': preview.stat().st_size}, ensure_ascii=False))
