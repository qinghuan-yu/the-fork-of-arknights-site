"""采集公开页面引用的前端资源，保留原始目录结构。"""
import concurrent.futures
import html
import gzip
import json
import re
import subprocess
from pathlib import Path
from urllib.parse import urlparse, urljoin

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / '.capture' / 'assets'
HOST = 'https://web.hycdn.cn'
BASE = HOST + '/arknights/official/_next/'
ASSET_EXT = re.compile(r'\.(?:js|css|png|jpe?g|webp|gif|svg|ico|woff2?|ttf|otf|mp3|wav|ogg|mp4|webm|glb|gltf|bin|m3u8|ts)(?:\?|$)', re.I)

def extract(text, base):
    text = html.unescape(text).replace('\\/', '/').replace('\\"', '"')
    values = re.findall(r'https://[^\s"\'<>\\)]+', text)
    values += [urljoin(base, x) for x in re.findall(r'(?:src|href)=["\']([^"\']+)', text)]
    values += [urljoin(base, x.strip('"\'')) for x in re.findall(r'url\(([^)]+)\)', text)]
    values += [BASE + x for x in re.findall(r'["\'](static/(?:media|chunks)/[^"\'\\]+)["\']', text)]
    if '.m3u8' in base:
        values += [urljoin(base, line.strip()) for line in text.splitlines() if line.strip() and not line.startswith('#')]
    if 'webpack-' in base:
        chunk_part = text.split('__webpack_require__.u=function(e)', 1)[1].split('__webpack_require__.miniCssF', 1)[0]
        tables = re.findall(r'\{([^{}]+)\}', chunk_part)
        if len(tables) >= 2:
            aliases = dict(re.findall(r'(\d+):"([a-f0-9]+)"', tables[0]))
            hashes = dict(re.findall(r'(\d+):"([a-f0-9]+)"', tables[1]))
            values += [BASE + f'static/chunks/{aliases.get(key,key)}.{value}.js' for key,value in hashes.items()]
        css_part = text.split('__webpack_require__.miniCssF=function(e)', 1)[1].split('__webpack_require__.g', 1)[0]
        values += [BASE + f'static/css/{value}.css' for value in re.findall(r'\d+:"([a-f0-9]+)"', css_part)]
    return {u.split('?')[0] for u in values if urlparse(u).netloc == 'web.hycdn.cn' and ASSET_EXT.search(u)}

def fetch(url):
    target = CACHE / urlparse(url).path.lstrip('/')
    target.parent.mkdir(parents=True, exist_ok=True)
    if not target.exists():
        p = subprocess.run(['curl.exe', '-L', '--compressed', '--fail', '--silent', '--show-error', '--max-time', '90', '--retry', '2', url, '-o', str(target)], capture_output=True)
        if p.returncode:
            target.unlink(missing_ok=True)
            return {'url': url, 'error': p.stderr.decode('utf-8', errors='replace')[:200]}
    data = target.read_bytes()
    if data[:2] == b'\x1f\x8b':
        target.write_bytes(gzip.decompress(data))
    return {'url': url, 'path': str(target.relative_to(ROOT)), 'size': target.stat().st_size}

def main():
    urls = extract((ROOT / 'source.html').read_text(encoding='utf-8'), 'https://ak.hypergryph.com/')
    inventory = ROOT / '.capture/evidence/resource-urls.json'
    if inventory.exists():
        urls.update(u.split('?')[0] for u in json.loads(inventory.read_text(encoding='utf-8')) if ASSET_EXT.search(u))
    api_file = ROOT / '.capture/evidence/api-snapshots.json'
    if api_file.exists():
        urls.update(extract(api_file.read_text(encoding='utf-8'), 'https://ak.hypergryph.com/'))
    # 长篇宣传片稍后按实际控件核对；先采集页面脚本、图片和样式。
    urls = {u for u in urls if not re.search(r'\.(mp4|webm)$', u)}
    seen, records = set(), []
    for round_id in range(5):
        pending = sorted(urls - seen)
        if not pending:
            break
        print(f'Round {round_id + 1}: {len(pending)} assets', flush=True)
        seen.update(pending)
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            for record in pool.map(fetch, pending):
                records.append(record)
                if 'error' in record:
                    print(json.dumps(record), flush=True)
                    continue
                path = ROOT / record['path']
                if path.suffix in ('.css', '.js', '.m3u8'):
                    urls.update(extract(path.read_text(encoding='utf-8'), record['url']))
        (ROOT / '.capture' / 'manifest.json').write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'files': len(records), 'bytes': sum(r.get('size', 0) for r in records), 'failures': sum('error' in r for r in records)}), flush=True)

if __name__ == '__main__':
    main()
