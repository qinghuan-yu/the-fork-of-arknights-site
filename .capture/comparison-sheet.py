from pathlib import Path
from PIL import Image, ImageDraw
root=Path(__file__).resolve().parent/'evidence'
sections=['operator','information','media','more']
sheet=Image.new('RGB',(1440,480*len(sections)),'#151515')
for i,section in enumerate(sections):
    for j,label in enumerate(['source','local']):
        image=Image.open(root/f'qa-{section}-{label}.png').convert('RGB')
        image.thumbnail((720,450))
        x,y=j*720,i*480
        sheet.paste(image,(x,y+30))
        ImageDraw.Draw(sheet).text((x+8,y+8),f'{section} / {label}',fill='white')
sheet.save(root/'qa-desktop-comparison.jpg',quality=93)
mobile=Image.new('RGB',(780,874),'#151515')
for j,label in enumerate(['source','local']):
    mobile.paste(Image.open(root/f'qa-mobile-{label}.png').convert('RGB'),(390*j,30))
    ImageDraw.Draw(mobile).text((390*j+8,8),label,fill='white')
mobile.save(root/'qa-mobile-comparison.jpg',quality=95)
detail=Image.new('RGB',(1100,800),'#151515')
for j,label in enumerate(['source','local']):
    im=Image.open(root/f'qa-operator-{label}.png').convert('RGB')
    detail.paste(im.crop((70,280,620,780)),(550*j,30))
    detail.paste(im.crop((560,0,1110,150)),(550*j,550))
    ImageDraw.Draw(detail).text((550*j+8,8),label,fill='white')
detail.save(root/'qa-detail-comparison.jpg',quality=95)
