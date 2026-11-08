#!/usr/bin/env python3
"""Build locally served, attributed historical illustration cards (no runtime hotlinks)."""
from pathlib import Path
import json, urllib.request, urllib.parse, re, html, time, hashlib
from concurrent.futures import ThreadPoolExecutor
ROOT=Path(__file__).resolve().parents[1]
CACHE=ROOT/'.cache/historical-media'
OUT=ROOT/'dist/assets/history'
OUT.mkdir(parents=True,exist_ok=True)
# History dates are separate from the creation dates of the pictures.
cards=[]
def card(id,side,span,title,person,file,kind,caption,summary,facts,source):
 cards.append(dict(id=id,side=side,range=span,title=title,person=person,fileTitle='File:'+file,imageKind=kind,caption=caption,summary=summary,facts=[dict(year=y,text=t,eventId=e) for y,t,e in facts],historySource=source))
card('pentecost','west',[30,44],'耶路撒冷：群体的开始','彼得 · 耶路撒冷信徒','El Greco 006.jpg','后世宗教绘画','格列柯《五旬节》，约1600年；表达宗教主题，并非公元30年的现场记录。','使徒行传从耶路撒冷的聚集、讲道与群体生活展开；初期活动处在罗马帝国与犹太地方社会之中。',[(30,'五旬节：门徒讲道与群体形成，年代为推定编年。','acts-001'),(33,'司提反事件与教会四散，叙事随后转向撒马利亚及更广地区。','acts-002')],'https://www.biblegateway.com/passage/?search=Acts+2-8&version=CUVS')
card('paul','west',[45,69],'地中海：跨城的福音网络','保罗 · 巴拿巴 · 西拉','Rembrandt Harmensz. van Rijn 163.jpg','后世想象画像','伦勃朗《使徒保罗》，约1633年（作品断代存疑）；不代表保罗的真实相貌。','港口、罗马道路、会堂与家庭，为跨语言的传播提供不同空间。保罗的书信与使徒行传应区分文类、互相参读。',[(46,'安提阿差遣巴拿巴与扫罗；使徒行传进入海路宣教叙事。','acts-013'),(49,'耶路撒冷的讨论涉及外邦信徒与律法实践（约年）。',None),(62,'使徒行传以保罗在罗马的传讲结束，未叙述他的死亡。','acts-073')],'https://www.biblegateway.com/passage/?search=Acts+13-28&version=CUVS')
card('titus','west',[70,311],'圣殿被毁之后：多地教会与帝国','提多 · 游斯丁 · 爱任纽','Arch of Titus Menorah 22.jpg','古代浮雕的现代复制品照片','贝特哈特福措特博物馆展出的提多凯旋门浮雕复制品；罗马原作约公元81年，纪念70年战争，不是战场照片。','70年耶路撒冷被罗马军攻陷。此后的基督徒群体分布于多个城市，面对身份界定、神学争论和并不连续的地方或帝国迫害。',[(70,'耶路撒冷与圣殿的毁坏，改变犹太社会及基督徒群体的处境。',None),(150,'游斯丁以护教写作向帝国社会解释基督徒信仰。','church-009'),(303,'戴克里先时期的大迫害开始，地区执行情况有差异。','church-023')],'https://www.ccel.org/ccel/schaff/npnf201.html')
card('constantine','west',[312,493],'帝国承认与信仰争论','君士坦丁 · 亚他那修 · 奥古斯丁','Head of Colossus of Constantine, Aug 24 2021.jpg','古代雕像残件的现代照片','君士坦丁巨像头像，4世纪原作；现存于罗马卡比托利欧博物馆。','皇帝的支持扩大了教会的公共空间，也使教义、城市主教和帝国政治更深地交织；这不是一条没有分歧的胜利进程。',[(312,'米尔维安桥之战后，君士坦丁的政治地位与宗教政策发生转折。','church-025'),(325,'尼西亚会议讨论基督论争议；会议后争论仍持续。','church-029'),(451,'迦克墩会议的定义与接受问题，影响此后不同教会传统。','church-046')],'https://www.ccel.org/ccel/schaff/npnf201.html')
card('justinian','west',[494,799],'东罗马与跨亚洲的教会','查士丁尼一世 · 阿罗本','Justinian mosaic, San Vitale, consecrated 547, Ravenna, Italy.jpg','同时代镶嵌画的现代照片','拉文纳圣维塔莱教堂查士丁尼镶嵌画，6世纪；是皇帝与礼仪权威的图像表达。','东罗马延续帝国与教会的制度；波斯及更东方的教会有自己的语言、礼仪与组织网络，不能仅用拉丁西欧的线索概括。',[(537,'君士坦丁堡圣索菲亚教堂落成，展现帝国礼仪与建筑资源。','world-004'),(635,'阿罗本来华的年代见于781年景教碑的回顾记述。','world-010'),(781,'景教碑记录唐代教会的自我表述及其政治语言。','world-014')],'https://sourcebooks.fordham.edu/source/781nestorian.asp')
card('charlemagne','west',[800,1208],'拉丁西欧：皇权、修院与改革','查理曼 · 修院群体','Charlemagne-by-Durer.jpg','后世想象画像','丢勒《查理曼》，1512年；距800年加冕约七百年，图中徽号也带有后世观念。','加冕、修院改革、教权与王权冲突，以及十字军运动，构成不同的历史过程。西欧的制度变化不等于整个世界教会的共同经验。',[(800,'查理曼在罗马受加冕，西方帝国权威得到新的表达。',None),(910,'克吕尼修院的建立开启长时段改革网络。','world-020'),(1099,'十字军攻占耶路撒冷，伴随严重宗教暴力。','world-026')],'https://sourcebooks.fordham.edu/basis/einhard.asp')
card('francis','west',[1209,1454],'城市、托钵团与晚期中世纪','方济各 · 托钵团体','Cimabue - Madonna Enthroned with the Child, St Francis and Four Angels - WGA04920.jpg','13世纪宗教壁画','契马布埃《圣母与圣婴、方济各及四位天使》，约1278—1280年；方济各是右侧站立人物，绘于其去世后数十年。','城市社会催生贫穷实践、讲道、大学神学和新的宗教团体；教宗分裂与改革呼声也在这一时期积累。',[(1209,'方济各团体早期获口头认可，确切程序与叙述须区分后来的传记传统。',None),(1215,'第四次拉特朗会议处理教义、牧养与制度问题。','world-032'),(1378,'拉丁教会进入多位教宗竞争的分裂局面。','world-039')],'https://sourcebooks.fordham.edu/source/stfran-rule.asp')
card('print','west',[1455,1516],'印刷与改革前夕','古登堡 · 读者与印刷工匠','Gutenberg Bible, Lenox Copy, New York Public Library, 2009. Pic 01.jpg','15世纪印本的现代照片','纽约公共图书馆藏古登堡圣经，约1455年印行；照片由Kevin Eng拍摄。','金属活字印刷扩大了文本复制的规模。它推动宗教讨论的传播，但改革还涉及教会治理、社会关系和地方政治。',[(1455,'古登堡圣经约在此时完成，成为欧洲早期活字印刷的重要实物。','world-045')],'https://www.nypl.org/events/exhibitions/gutenberg-bible')
card('luther','west',[1517,1535],'改革争论进入公共领域','马丁·路德 · 梅兰希顿','1529MartinLuther.jpg','同时代肖像','老克拉纳赫工作室，路德像，1529年；与1517年事件相隔十二年。','赎罪、称义、教会权威和礼仪成为公开争论；路德宗、改革宗、再洗礼派与英国改革的发展不能混为一条路线。',[(1517,'九十五条论纲围绕赎罪实践展开争论；“钉门”细节有史料讨论。','world-048'),(1525,'再洗礼群体强调信仰告白、自愿群体与洗礼实践。','world-051'),(1530,'奥格斯堡信纲成为路德宗信仰表达的重要文本。','world-054')],'https://bookofconcord.org/augsburg-confession/')
card('calvin','west',[1536,1581],'多种改革与跨洲传播','加尔文 · 天主教改革者','John Calvin Titian B.jpg','16世纪肖像传统','依克里斯托法诺·德尔·阿尔蒂西莫作品绘制的加尔文肖像，约1563—1600年。','日内瓦改革、英国的制度变化、特伦托会议和耶稣会形成并行而有冲突的历史。欧洲以外的教会也继续发展。',[(1540,'耶稣会获得教宗批准，参与教育与跨洲传教。','world-057'),(1555,'奥格斯堡和约给予特定帝国等级有限的宗教安排。','world-062'),(1563,'特伦托会议结束；法令的落实仍依地方条件而异。','world-065')],'https://history.hanover.edu/texts/trent.html')
card('ricci-west','west',[1582,1648],'翻译、跨文化交往与战争','利玛窦 · 徐光启 · 汤若望','Matteo Ricci and Xu Guangqi from Athanasius Kircher (3756759) (cropped).jpg','后世版画','基歇尔《中国图说》中的利玛窦与徐光启，1667年；出版晚于本项目1648年的时间终点。','跨洲交往涉及语言学习、数学与历法翻译，也涉及礼仪与政治秩序。欧洲同时经历三十年战争，并在1648年达成一组和平协议。',[(1582,'利玛窦抵达澳门，开始进入中国的准备。','world-081'),(1607,'徐光启与利玛窦合作刊行《几何原本》前六卷。','world-084'),(1644,'汤若望呈进历法成果；采用与施行须区分1644、1645年。','world-086')],'https://www.loc.gov/item/2010585650/')
card('han','china',[30,183],'东汉：重建与知识传播','刘秀（在位25—57）· 蔡伦','Liu Xiu (Emperor Guangwu of Han).png','后世想象画像','《圣君贤臣全身像册》中的汉光武帝，作者与具体年代未详；非同时代肖像。','新约时代的中国处于东汉。洛阳的政治重建、经学与书写材料的变化，可与地中海的道路和书信网络比较，但不能据此推定双方已有教会往来。',[(25,'刘秀称帝，东汉以洛阳为都；这是当前时间轴起点之前的背景。',None),(36,'公孙述政权覆亡，东汉结束主要的统一战争。',None),(105,'《后汉书》记蔡伦上奏造纸成果；不应表述为此年才首次出现纸。',None)],'https://ctext.org/hou-han-shu/zh')
card('cao','china',[184,316],'汉末至西晋：战争与统一','曹操 · 曹丕 · 司马炎','Cao Cao Portrait ROTK.jpg','后世文学插图','清代《三国演义》版本中的曹操像，带有文学人物塑造，不是历史实录肖像。','汉末政治秩序瓦解后，魏、蜀、吴各自建立制度。西晋的短期统一之后，北方战争与人口迁徙改变了文化和宗教传播的空间。',[(184,'黄巾起事，汉末政治与地方军事局势进一步变化。',None),(220,'曹丕代汉建立魏；曹操本人没有称帝。',None),(280,'西晋灭吴，完成阶段性的统一。',None)],'https://ctext.org/sanguozhi/zh')
card('wang','china',[317,580],'东晋南北朝：迁徙与多种思想','王羲之 · 士族与僧侣','Wang Xizhi.jpg','后世想象画像','王羲之后世画像，原画作者与年代未详；仅作人物识别辅助。','东晋及南北朝时期，南北政权、士族文化与佛教译经网络并存。书法、清谈与宗教讨论体现了不同的公共和私人交往空间。',[(317,'司马睿在建康建立晋政权，东晋时期开始。',None),(353,'王羲之主持兰亭雅集，相关诗文成为后世文化记忆。',None),(386,'北魏建立；北方的政治整合与宗教赞助继续发展。',None)],'https://fairbank.fas.harvard.edu/research/blog/toward-a-view-of-unofficial-friendships-in-fourth-century-china/')
card('sui','china',[581,617],'隋：重新统一与制度整合','隋文帝杨坚 · 隋炀帝杨广','Sui Wendi Tang.jpg','后世宫廷绘画','《历代帝王图》传统中的隋文帝，7世纪作品，传统归于阎立本。','隋的统一结束长期南北分立；行政、交通和征役政策连接不同区域，也产生沉重社会负担。隋亡以后，唐继承并调整其中许多制度。',[(581,'杨坚建立隋朝，史称隋文帝。',None),(589,'隋灭陈，结束南北长期分立。',None),(605,'隋炀帝时期的大规模运河工程展开，水路交通与征役并行。',None)],'https://www.metmuseum.org/essays/imperial-china-the-art-of-the-sui-581-618-and-tang-618-907-dynasties')
card('tang','china',[618,780],'唐前期：长安与外来宗教','唐太宗李世民（在位626—649）· 阿罗本','TangTaizongP.jpg','后世宫廷画像','明代绘制的唐太宗像，非7世纪本人写照。','长安汇集来自不同地区的商旅、使节与宗教人员。景教进入唐朝的叙事，应与唐代对其他外来宗教的不同政策一起阅读。',[(618,'唐朝建立；太宗在626年继位，不能将两者混为同年。',None),(635,'据781年景教碑回顾，阿罗本于贞观九年抵达长安。','world-010'),(638,'景教碑记诏许传教及建寺；这是碑文保存的朝廷许可叙事。','world-077')],'https://sourcebooks.fordham.edu/source/781nestorian.asp')
card('stele','china',[781,959],'景教碑与唐后期的宗教处境','景净 · 唐代景教群体','Nestorian stele 1.jpg','古代碑刻的现代照片','《大秦景教流行中国碑》碑首照片，原碑781年立；摄影David Castor。碑文表达教会自述，不是中立的完整通史。','碑上的汉文与叙利亚文保存了人员、教义及政治表达。845年的政策改变外来宗教人员的处境；唐末五代的长期变化仍需更多地方材料。',[(781,'景教碑立于长安，记述此前约一个半世纪的传播。','world-014'),(845,'会昌宗教政策波及景教等外来宗教人员。','world-078'),(907,'唐亡，北方进入五代更替；南方同时存在多个政权。',None)],'https://sourcebooks.fordham.edu/source/781nestorian.asp')
card('song','china',[960,1270],'宋与辽金夏：多政权并立','宋太祖赵匡胤（在位960—976）','Song Taizu, 0.jpg','约1000年的宫廷画像','宋太祖像，匿名画家，约1000年；绘于其去世后，藏台北故宫。','宋的城市、印刷与士大夫文化发展于多政权并立的格局中。中国地图不应把这一时期处理成只有宋朝的单一疆域。',[(960,'赵匡胤建立宋朝。',None),(1127,'靖康之变后，宋廷南渡；金占据北方大片地区。',None)],'https://afe.easia.columbia.edu/songdynasty-module/index.html')
card('yuan','china',[1271,1367],'元：跨欧亚的人员网络','忽必烈（在位1260—1294）· 孟高维诺','YuanEmperorAlbumKhubilaiPortrait.jpg','身后宫廷肖像','忽必烈像，约1294年，传统归阿尼哥；属身后肖像，并作年轻化处理。','蒙古统治形成跨欧亚的通道，东方教会与拉丁传教网络在元代中国并存。宗教优待、身份与地方处境并不完全一致。',[(1271,'忽必烈定国号为大元；蒙古征服南宋尚未完成。',None),(1279,'南宋覆亡，元完成对南宋地区的征服。',None),(1307,'教宗任命孟高维诺为汗八里总主教；任命与其早前抵达须区分。','world-080')],'https://afe.easia.columbia.edu/mongols/china/china.htm')
card('ming','china',[1368,1571],'明：重建秩序与海上联系','朱元璋（在位1368—1398）· 郑和','Hongwu1.jpg','明代宫廷肖像','明太祖朱元璋宫廷像，14世纪，藏台北故宫。','明初的国家重建与海上活动，处在元代跨欧亚联系转变之后。此前教会机构的延续问题，应依具体地区证据判断。',[(1368,'朱元璋称帝建立明朝；元廷退出大都。',None),(1405,'郑和首次下西洋，朝贡、外交与海上贸易相互交织。',None)],'https://www.metmuseum.org/essays/ming-dynasty-1368-1644')
card('wanli','china',[1572,1606],'晚明：士人、传教与世界知识','万历帝（在位1572—1620）· 利玛窦','Wanli-Emperor.jpg','明代宫廷肖像','万历帝宫廷画像，画家未详；历史人物画像不能说明所有晚明人的经验。','晚明的传教活动通过澳门、广东与内地城市逐步展开。地图、语言和士人交往为理解交流提供入口，宫廷许可与地方实践仍有区别。',[(1572,'万历帝即位，张居正主持一系列政治与财政改革。',None),(1583,'利玛窦等获准居留肇庆，开展中文学习与地方交往。','world-082'),(1602,'《坤舆万国全图》在北京刊行，呈现新的世界地理表达。','world-083')],'https://www.loc.gov/item/2010585650/')
card('xu','china',[1607,1648],'晚明至清初：翻译与历法','徐光启（1562—1633）· 利玛窦 · 汤若望','Matteo Ricci and Xu Guangqi from Athanasius Kircher (3756759) (cropped).jpg','后世版画','基歇尔《中国图说》，1667年；画面晚于人物活动和当前时间轴终点，不是1607年的现场。','译著与历法工作体现合作，也受士人网络和政权更替影响。科学合作、受洗、礼仪争议与政治归属需要分别考察。',[(1607,'《几何原本》前六卷刊行，徐光启与利玛窦合作翻译。','world-084'),(1616,'南京教案发生；不要与1664年的历狱混淆。','world-085'),(1644,'明清易代，汤若望呈进历法；新历于1645年施行。','world-086')],'https://www.loc.gov/item/2010585650/')

def main():
 from PIL import Image,ImageOps
 pages={}
 # Cached API responses are optional; a fresh checkout can resolve all file pages.
 for name in ['selected.json','extra.json']:
  path=CACHE/name
  if path.exists():
   for p in json.loads(path.read_text())['query']['pages'].values():pages[p['title']]=p
 path=CACHE/'search.json'
 if path.exists():
  for ps in json.loads(path.read_text()).values():
   if isinstance(ps,list):
    for p in ps:pages[p['title']]=p
 missing=[c['fileTitle'] for c in cards if c['fileTitle'] not in pages]
 if missing:
  CACHE.mkdir(parents=True,exist_ok=True)
  query=urllib.parse.urlencode(dict(action='query',format='json',prop='imageinfo',iiprop='url|extmetadata',iiurlwidth=640,titles='|'.join(dict.fromkeys(missing))))
  request=urllib.request.Request('https://commons.wikimedia.org/w/api.php?'+query,headers={'User-Agent':'BibleTimelineLocal/1.0'})
  response=json.load(urllib.request.urlopen(request,timeout=40))
  for p in response['query']['pages'].values():pages[p['title']]=p
 def download(item):
  idx,title=item;path=OUT/f'{idx:02d}.webp'
  if path.exists():return
  i=pages[title]['imageinfo'][0]
  url=i.get('thumburl',i['url']).replace('https://thumb.wikimedia.org/','https://upload.wikimedia.org/').split('?')[0].replace('/960px-','/500px-')
  req=urllib.request.Request(url,headers={'User-Agent':'BibleTimelineLocal/1.0'})
  raw=CACHE/f'{idx:02d}.original'
  for attempt in range(4):
   try:raw.write_bytes(urllib.request.urlopen(req,timeout=30).read());break
   except Exception:
    if attempt==3:raise
    time.sleep(3+attempt*3)
  im=ImageOps.exif_transpose(Image.open(raw)).convert('RGB');im.thumbnail((800,1000));im.save(path,'WEBP',quality=85);print('Saved '+title,flush=True)
 titles=list(dict.fromkeys(c['fileTitle'] for c in cards))
 with ThreadPoolExecutor(max_workers=3) as pool:list(pool.map(download,enumerate(titles,1)))
 assets={}
 for c in cards:
  title=c.pop('fileTitle')
  if title not in assets:
   p=pages[title];i=p['imageinfo'][0];m=i['extmetadata'];idx=len(assets)+1;path=OUT/f'{idx:02d}.webp'
   clean=lambda v:html.unescape(re.sub('<[^>]+>','',v)).strip()
   artist=clean(m.get('Artist',{}).get('value','作者未详'))
   # Commons public-domain release contains a long personal template.
   if 'David Castor' in artist:artist='David Castor'
   assets[title]=dict(image='assets/history/'+path.name,imageSource=i['descriptionurl'],originalUrl=i['url'],credit=artist,license=m['LicenseShortName']['value'],licenseUrl=(m.get('LicenseUrl',{}).get('value') or 'https://creativecommons.org/publicdomain/mark/1.0/').replace('http://','https://'),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),transform='缩小并转换为WebP，未裁切',fileTitle=title)
  c.update(assets[title])
 out=dict(editorial='图像年代与事件年代分开；后世作品不是同时代相貌证据。卡片表示阶段背景，纪事仅显示浏览年及此前内容。',cards=cards)
 (ROOT/'dist/data/historical-media.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
 lines=['# 历史图像来源与许可','',out['editorial'],'','所有本地文件只缩小并转换为 WebP，未裁切；每幅图的SHA-256见 historical-media.json。公共领域作品与现代摄影的许可分别遵循来源页。','']
 for title,a in assets.items():
  c=next(c for c in cards if c['fileTitle']==title)
  lines.extend([f"## {title[5:]}",'',c['caption'],'',f"- 本地文件：{a['image']}",f"- 作者/摄影：{a['credit']}",f"- 许可：[{a['license']}]({a['licenseUrl']})",f"- [来源文件页]({a['imageSource']})",f"- [原始图像]({a['originalUrl']})",''])
 (ROOT/'dist/data/HISTORICAL-IMAGES.md').write_text('\n'.join(lines))
 print(f'{len(cards)} cards / {len(assets)} locally served images')
if __name__=='__main__':main()
