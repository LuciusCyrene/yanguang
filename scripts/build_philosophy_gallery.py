#!/usr/bin/env python3
"""Build attributed local philosopher portraits and early printed work images."""
from pathlib import Path
import json,urllib.request,urllib.parse,html,re,hashlib
from concurrent.futures import ThreadPoolExecutor
from PIL import Image,ImageOps
from media_rights import apply_photo_rights
ROOT=Path(__file__).resolve().parents[1];CACHE=ROOT/'.cache/philosophy-gallery';OUT=ROOT/'dist/assets/philosophy'
SPECS=[
('portrait-socrates','Socrates Louvre.jpg','苏格拉底雕像头像','古代雕像的现代照片；约公元一世纪的罗马肖像摹本，不能作为苏格拉底在世容貌的直接记录。','古代肖像摹本的现代照片',['socrates'],[]),
('portrait-aristotle','Aristotle Altemps Inv8575.jpg','亚里士多德雕像头像','阿尔滕普斯宫藏罗马时期肖像摹本，依约公元前330年的希腊原型；衣饰有后世增补。原型、摹本与现代拍摄是不同时间层次。','古代肖像摹本的现代照片',['aristotle'],[]),
('portrait-descartes','Frans Hals, Portrait of René Descartes.jpg','笛卡尔肖像','卢浮宫藏笛卡尔肖像；馆方归为依弗兰斯·哈尔斯之作的摹作。不是笛卡尔本人的照片，也不在此断定为哈尔斯亲笔写生。','历史油画复制图',['descartes'],[]),
('portrait-kant','Immanuel Kant (painted portrait).jpg','康德肖像','约1790年的康德绘画肖像复制图；作者归属有不确定性，用于辨认思想史人物；绘画呈现不等于未经处理的实际容貌记录。','历史绘画复制图',['kant'],[]),
('portrait-hegel','Georg Wilhelm Friedrich Hegel00.jpg','黑格尔肖像','黑格尔的历史肖像复制图，具体制作年代未详；这是人物图像传统的材料，不作为其思想或具体事件的证据。','历史肖像复制图',['hegel'],[]),
('book-discourse','Descartes Discours de la Methode.jpg','《方法谈》1637年版题名页','《方法谈》1637年初版题名页复制图。此书与1641年的《第一哲学沉思集》是不同作品。','早期印本复制图',['descartes'],[]),
('book-organum','Novum Organum.jpg','培根1620年刊本卷首图','弗朗西斯·培根1620年刊本卷首复制图，题为 Instauratio magna（《大复兴》），与《新工具》的出版相关。海船与界柱是印本图像，不能作为实际航行的记录。','早期印本复制图',['bacon'],['work-novum-organum']),
('book-kant','Kant-KdrV-1781.png','《纯粹理性批判》1781年版题名页','康德《纯粹理性批判》1781年初版题名页；1787年第二版有重要改写，不能仅凭这张图替代版本比较。','历史印本复制图',['kant'],[])]
def main():
 CACHE.mkdir(parents=True,exist_ok=True);OUT.mkdir(parents=True,exist_ok=True);pages={}
 discovery=CACHE/'discovery.json'
 if discovery.exists():
  for group in json.loads(discovery.read_text()).values():
   for p in group.get('query',{}).get('pages',{}).values():
    if p.get('imageinfo'):pages[p['title']]=p
 metadata=CACHE/'gallery-metadata.json'
 if metadata.exists():pages.update(json.loads(metadata.read_text()))
 missing=['File:'+s[1] for s in SPECS if 'File:'+s[1] not in pages]
 if missing:
  q=urllib.parse.urlencode(dict(action='query',format='json',prop='imageinfo',iiprop='url|extmetadata',iiurlwidth=640,titles='|'.join(missing)))
  res=json.load(urllib.request.urlopen(urllib.request.Request('https://commons.wikimedia.org/w/api.php?'+q,headers={'User-Agent':'YanguangHistory/1.0'}),timeout=45))
  for p in res['query']['pages'].values():pages[p['title']]=p
 metadata.write_text(json.dumps(pages,ensure_ascii=False,indent=2))
 def build(s):
  id,file,title,caption,kind,people,works=s;i=pages['File:'+file]['imageinfo'][0];md=i['extmetadata'];clean=lambda k:html.unescape(re.sub('<[^>]+>','',md.get(k,{}).get('value',''))).strip();license=clean('LicenseShortName');assert license, file
  credit=clean('Artist') or '作者未详，见原始文件页'
  if not credit.replace('Unknown author','').strip():credit='作者未详（图源未署名）'
  original=CACHE/(id+'.original');target=OUT/(id+'.webp')
  if not original.exists():
   u=i.get('thumburl',i['url']).replace('https://thumb.wikimedia.org/','https://upload.wikimedia.org/').split('?')[0]
   try:raw=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'YanguangHistory/1.0'}),timeout=60).read()
   except urllib.error.HTTPError:raw=urllib.request.urlopen(urllib.request.Request(i['url'].split('?')[0],headers={'User-Agent':'YanguangHistory/1.0'}),timeout=60).read()
   original.write_bytes(raw)
  image=ImageOps.exif_transpose(Image.open(original)).convert('RGB');image.thumbnail((1100,1100));image.save(target,'WEBP',quality=90)
  item=dict(id=id,title=title,caption=caption,imageKind=kind,personIds=people,workIds=works,image='assets/philosophy/'+target.name,credit=credit,license=license,licenseUrl=(clean('LicenseUrl') or 'https://creativecommons.org/publicdomain/mark/1.0/').replace('http://','https://'),imageSource=i['descriptionurl'],originalUrl=i['url'],sourceDate=clean('DateTimeOriginal') or '见源文件页',transform='保持完整构图，缩小并转为 WebP',sha256=hashlib.sha256(target.read_bytes()).hexdigest(),width=image.width,height=image.height)
  if id=='portrait-descartes':item['catalogueUrl']='https://collections.louvre.fr/ark:/53355/cl010062106'
  print('Saved '+id,flush=True);return apply_photo_rights(item)
 with ThreadPoolExecutor(max_workers=1) as pool:images=list(pool.map(build,SPECS))
 (ROOT/'dist/data/philosophy-gallery.json').write_text(json.dumps(images,ensure_ascii=False,indent=2)+'\n')
 lines=['# 哲学人物与经典图像','','全部本地加载；图像年代与人物／著作的年代分别标示。','']
 for i in images:lines.extend(['## '+i['title'],'',i['caption'],'',f"- 作者／图像署名：{i['credit']}",f"- 许可：[{i['license']}]({i['licenseUrl']})",f"- [图源]({i['imageSource']})",f"- 文件：{i['image']}",''])
 (ROOT/'dist/data/PHILOSOPHY-IMAGES.md').write_text('\n'.join(lines))
if __name__=='__main__':main()
