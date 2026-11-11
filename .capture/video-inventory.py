import re,json
from pathlib import Path
root=Path(__file__).resolve().parent.parent
text=(root/'source.html').read_text(encoding='utf-8').replace('\\"','"')
for snap in json.loads((root/'.capture/evidence/api-snapshots.json').read_text(encoding='utf-8')):
    text += snap['body']
data = {url:int(size) for url,size in re.findall(r'"url":"(https://web.hycdn.cn/[^" ]+\.mp4)","size":(\d+)',text)}
print(json.dumps({'count':len(data),'total_gb':round(sum(data.values())/1e9,2),'videos':data},indent=2))
(root/'.capture/videos.json').write_text(json.dumps(data,indent=2),encoding='utf-8')
