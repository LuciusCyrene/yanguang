#!/usr/bin/env python3
"""Download attributed, local art/artefact reproductions for world culture."""
from pathlib import Path
import json,urllib.request,urllib.parse,re,html,hashlib
from concurrent.futures import ThreadPoolExecutor
from PIL import Image,ImageOps
ROOT=Path(__file__).resolve().parents[1];CACHE=ROOT/'.cache/culture-images';OUT=ROOT/'dist/assets/culture'
SPECS=[
('school-athens','Sanzio 01.jpg','拉斐尔《雅典学园》','约1509—1511年壁画；这是十六世纪对古典哲学家的再现，不是古希腊学校的现场合影。','文艺复兴壁画复制图'),
('primavera','Botticelli-primavera.jpg','波提切利《春》','约1480—1485年绘画；神话人物组合和完整寓意存在不同研究解释。','文艺复兴绘画复制图'),
('vitruvian','Da Vinci Vitruve Luc Viatour.jpg','列奥纳多《维特鲁威人》','约1490—1492年素描；身体与几何的研究表达，不是现代人体统计标准。','文艺复兴手稿复制图'),
('copernicus-book','De revolutionibus 1543.png','《天体运行论》题名页','1543年版题名页的复制图；出版年份与理论最初形成的时间不同。','早期印本复制图'),
('creation-adam','Creation of Adam.jpg','米开朗琪罗《创造亚当》','约1511年壁画局部；本复制图展示天顶修复前的色彩状态，不能当作今天现场色彩的记录。','文艺复兴壁画复制图'),
('plato-bust','Plato Silanion Musei Capitolini MC1377.jpg','柏拉图头像','古代柏拉图肖像摹本的现代照片；不是哲学家本人在世时的照片。摄影Marie-Lan Nguyen。','古代雕像的现代照片')]
def main():
 CACHE.mkdir(parents=True,exist_ok=True);OUT.mkdir(parents=True,exist_ok=True);meta=CACHE/'metadata.json';pages={}
 if meta.exists():pages={p['title']:p for p in json.loads(meta.read_text())['query']['pages'].values()}
 missing=['File:'+s[1] for s in SPECS if 'File:'+s[1] not in pages]
 if missing:
  q=urllib.parse.urlencode(dict(action='query',format='json',prop='imageinfo',iiprop='url|extmetadata',iiurlwidth=640,titles='|'.join(missing)))
  r=json.load(urllib.request.urlopen(urllib.request.Request('https://commons.wikimedia.org/w/api.php?'+q,headers={'User-Agent':'YanguangCulture/1.0'}),timeout=40))
  for p in r['query']['pages'].values():pages[p['title']]=p
  meta.write_text(json.dumps({'query':{'pages':{str(i):p for i,p in enumerate(pages.values())}}}))
 def download(spec):
  id,title,label,caption,kind=spec;p=pages['File:'+title];info=p['imageinfo'][0];md=info['extmetadata'];path=OUT/(id+'.webp')
  if not path.exists():
   url=info.get('thumburl',info['url']).replace('https://thumb.wikimedia.org/','https://upload.wikimedia.org/').split('?')[0]
   req=urllib.request.Request(url,headers={'User-Agent':'YanguangCulture/1.0'})
   original=CACHE/(id+'.original');original.write_bytes(urllib.request.urlopen(req,timeout=45).read());im=ImageOps.exif_transpose(Image.open(original)).convert('RGB');im.thumbnail((1200,1000));im.save(path,'WEBP',quality=87);print('Saved '+id,flush=True)
  clean=lambda v:html.unescape(re.sub('<[^>]+>','',v)).strip()
  return dict(id=id,title=label,caption=caption,imageKind=kind,image='assets/culture/'+path.name,credit=clean(md.get('Artist',{}).get('value','作者未详')),license=md['LicenseShortName']['value'],licenseUrl=(md.get('LicenseUrl',{}).get('value') or 'https://creativecommons.org/publicdomain/mark/1.0/').replace('http://','https://'),imageSource=info['descriptionurl'],originalUrl=info['url'],transform='缩小并转换为WebP，保留完整源图构图',sha256=hashlib.sha256(path.read_bytes()).hexdigest())
 with ThreadPoolExecutor(max_workers=3) as pool:items=list(pool.map(download,SPECS))
 (ROOT/'dist/data/culture-images.json').write_text(json.dumps(items,ensure_ascii=False,indent=2)+'\n')
 lines=['# 世界文化图像来源','','图像制作年代、所表现时代与现代拍摄日期分开；全部本地提供，署名和许可同时显示在图像详情中。','']
 for i in items:lines.extend(['## '+i['title'],'',i['caption'],'',f"- 作者／摄影：{i['credit']}",f"- 许可：[{i['license']}]({i['licenseUrl']})",f"- [来源文件页]({i['imageSource']})",f"- 本地文件：{i['image']}",''])
 (ROOT/'dist/data/CULTURE-IMAGES.md').write_text('\n'.join(lines));print('6 attributed local culture images')
if __name__=='__main__':main()
