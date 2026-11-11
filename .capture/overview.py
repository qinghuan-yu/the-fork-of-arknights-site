import json
import re
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw

root = Path(__file__).resolve().parent
images = list((root / 'evidence').glob('source-*-desktop.png'))
sheet = Image.new('RGB', (1440, 3 * 490), '#151515')
for i, file in enumerate(images):
    image = Image.open(file)
    image.thumbnail((710, 450))
    x, y = (i % 2) * 720, (i // 2) * 490
    sheet.paste(image, (x, y + 30))
    ImageDraw.Draw(sheet).text((x + 8, y + 8), file.stem, fill='white')
sheet.save(root / 'evidence' / 'source-overview.jpg')
for file in (root / 'assets').rglob('*.js'):
    if file.name.startswith(('page-', 'layout-', 'webpack-')):
        text = file.read_text(encoding='utf-8')
        print('\nFILE', file.name)
        if file.name.startswith('webpack-'):
            print(text[:12000])
        else:
            values = set(re.findall(r'"([^"\n]{3,240})"', text))
            print('\n'.join(sorted(v for v in values if any(t in v for t in ('https:', '.mp4', '.mp3', '.glb', '/api/', 'static/media')))))
