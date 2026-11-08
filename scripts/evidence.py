"""Attach honest citation/date metadata to all events without inventing book pages."""
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]

def add_evidence(data):
 for e in data['events']:
  church=e.get('module','acts')!='acts'
  headings=['事件与背景']+['事件经过' if i==1 and len(e['narrative'])>3 else '影响与关联' if i==len(e['narrative'])-2 else '补充说明' for i in range(1,len(e['narrative'])-1)]+['史料与阅读提示']
  e.setdefault('narrativeHeadings',headings)
  e.setdefault('dateEvidence',dict(kind=e.get('certainty','推定编年'),fromYear=e['year'],toYear=e['year'],note=(e.get('yearLabel','')+'；'+e.get('certainty','')) if church else '用于时间轴的推定年；经文章节并未全部给出公历日期。'))
  span=re.search(r'(\d{2,4})[—–－-](\d{2,4})年',e.get('yearLabel',''))
  if span and e['year'] is not None and int(span[1])<=e['year']<=int(span[2]):
   e['dateEvidence']['fromYear']=int(span[1]);e['dateEvidence']['toYear']=int(span[2])
  if 'citations' not in e:
   s=e['primarySource']
   if church:
    e['citations']=[dict(title=s['label'],url=s['url'],author='待核署名／编者',edition='原有在线文献或研究链接；具体底本待核',locator='待补篇章定位或印刷页码',kind=e.get('sourceType','历史参考'),status='待逐条复核',note='保留原有参考入口；新增结构化字段不表示这条事件已完成专业史料审校。')]
   else:
    e['citations']=[dict(title='《使徒行传》',url=s['url'],author='传统归于路加；作者问题属研究议题',edition='Bible Gateway 简体和合本在线经文',locator='使徒行传 '+e['ref'],kind='经文叙事',status='已核经文章节范围',note='经文是叙事依据，公历年与现代地理定位另属编年和史地判断。')]
 data['reformTraditions']=[
  dict(id='lutheran',name='路德宗',range=[1517,1555],text='从赎罪争论走向信仰陈述和领地教会安排。1530年信纲说明其教义主张，1555年和约处理帝国法律地位；两者不能混称。',question='因信称义的解释，如何与圣礼、教会秩序及诸侯保护相联系？',keywords=['九十五条','奥格斯堡信纲','奥格斯堡和约']),
  dict(id='reformed',name='改革宗',range=[1523,1619],text='苏黎世、日内瓦及其他城市发展出不同改革网络。加尔文的教学是重要一支，不能代替所有改革宗地区；圣餐、治理和移民网络值得分别追踪。',question='城市议会、教牧机构与信仰纪律之间如何分配权力？',keywords=['苏黎世改革','加尔文','多特会议']),
  dict(id='anabaptist',name='再洗礼派诸群体',range=[1525,1648],text='强调认信之后受洗的群体形成多种路线。《施莱特海姆信条》体现一支弟兄会的共同生活与非暴力立场，不能概括所有被称作再洗礼派者。',question='自愿认信的群体如何面对城市教会制度和来自多方的迫害？',keywords=['再洗礼群体','施莱特海姆']),
  dict(id='english',name='英格兰改革',range=[1534,1559],text='王室最高治理权、礼仪和教义经历多次变化。1534年与罗马管辖断裂，并不等于后来全部新教制度已成形；不同君主下的反转同样重要。',question='王朝继承、议会、礼仪和地方信众如何共同塑造改革？',keywords=['至尊法案','公祷书','伊丽莎白']),
  dict(id='catholic',name='天主教改革与更新',range=[1540,1563],text='特伦托会议、耶稣会、主教和修院改革共同推动教育、圣礼与牧养更新。它既回应新教争论，也承接此前已有的改革诉求，并与跨洲活动相连。',question='教义澄清、牧养改革与跨文化传教之间有哪些张力？',keywords=['耶稣会获准','特伦托会议','德肋撒'])]
 for t in data['reformTraditions']:
  t['eventIds']=[e['id'] for e in data['events'] if e.get('module')=='world' and any(k in e['title'] for k in t['keywords'])]
  t.pop('keywords',None)
 # Generate the public research index without serving the user's modern book files.
 out=['# 中国教会、文化回应与来源说明','', '本站保留原始文献、后世研究与编者解释的区分。已核对关键段落不等于全面审校；未核定的作者、版本与页码明确标为待核。现有纪事仍有待逐条复核的参考入口。','', '对照模式已贯通30—1648年。30—451年中国内容是同期背景与证据边界说明，不声称当时中国已有可确证教会；现有使徒行传73则与初代教会史46则沿用各自出处。','', '## 新增与补充节点','']
 for e in data['events']:
  if not e.get('chinaRelated'):continue
  out.extend([f"### {e['id']} · {e['yearLabel']} · {e['title']}",''])
  for c in e['citations']:
   out.extend([f"- [{c['title']}]({c['url']}) — {c['author']}；{c['edition']}。定位：{c['locator']}。{c['kind']}；{c['status']}。{c['note']}"])
  out.append('')
 out.extend(['## 本地文献的使用层次','', '综合表提供编排框架，具体事件另附可定位出处。以下现代书籍目前作为延伸阅读，未核对相关正文页码的部分不充当逐条事实依据。',''])
 for b in data['localReading']:out.append(f"- {b['author']}：{b['title']}，{b['edition']}。{b['topic']}；{b['status']}。")
 out.extend(['','## 本轮校正','', '- 1616南京教案与1664清初历狱分别处理，后者超出当前1648年范围。','- 澳门1582与肇庆1583分别定位。','- 1607年的中文《几何原本》为前六卷。','- 1307年任命不等于抵达或当地祝圣同年完成。','- 1644年进呈与1645年用新历及馆藏补刻本分别记述。','- 礼仪之争1645年决议通过研究论文转引，明确没有直接核读罗马原件。',''])
 (ROOT/'dist/data/CHINA-CHURCH-SOURCES.md').write_text('\n'.join(out))
 data['sources'].append(dict(title='在华教会与文化回应：出处及本地阅读目录',url='data/CHINA-CHURCH-SOURCES.md',usage='新增节点保留章节或页面定位；本地图书按核读程度区分，不复制整本图书。'))
 return data
