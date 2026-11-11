import re
from pathlib import Path
root=Path(__file__).resolve().parent
for file in (root/'assets').rglob('*.js'):
    text=file.read_text(encoding='utf-8')
    if 'homeVideo:' in text:
        print(file.name)
        for m in re.finditer('homeVideo:|m3u8',text):
            print(text[max(0,m.start()-100):m.end()+550])
for page in ['operator','world','media','more']:
    from bs4 import BeautifulSoup
    soup=BeautifulSoup((root/'evidence'/f'source-{page}.html').read_text(encoding='utf-8'),'html.parser')
    print('PAGE',page)
    targets={'operator':['凯尔希','阿米娅','日笠阳子'], 'world':['源石','罗德岛'], 'media':['GALLERY','VIDEO','OPERATOR'], 'more':['集成战略','生息演算']}[page]
    for s in soup.find_all(string=lambda s: s and s.strip() in targets):
        print(str(s.parent.parent)[:1200])
