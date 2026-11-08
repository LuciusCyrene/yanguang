#!/usr/bin/env python3
"""Independent philosophy chronology; reuse existing readings without rewriting sources."""
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]
from philosophy_tree_notes import EXTRA_FIGURES
from philosophy_person_expansion import apply_person_expansions

def source(slug,locator='生平、代表著作与参考书目'):
 return dict(title='斯坦福哲学百科：'+slug,url='https://plato.stanford.edu/entries/'+slug+'/',kind='学术研究与原典书目',locator=locator,note='供核查本条编年及进一步阅读；本站自编摘要不替代原典。')
PHASES=[
 ('origins',[-650,-451],'自然哲学的起点','解释自然与变化','从米利都、毕达哥拉斯与前苏格拉底诸家进入：他们怎样解释自然、存在和变化？',['prehistory-miletus','prehistory-parmenides'],'#b19a63'),
 ('classical',[-450,-324],'古典哲学','知识、德性与城邦','围绕苏格拉底、柏拉图和亚里士多德，比较知识的根据、善的生活与论证方法。',['question-knowledge','question-forms'],'#8f7655'),
 ('hellenistic',[-323,249],'希腊化与罗马','判断与共同生活','从伊壁鸠鲁、斯多亚与怀疑传统，阅读快乐、判断、德性和共同生活。',['question-happiness','tradition-hellenistic'],'#87956b'),
 ('late-antique',[250,799],'古代晚期','心灵、信仰与传承','普罗提诺、奥古斯丁及早期拉丁作者连接古典论证与新的思想问题；文本在不同语言中传承。',['question-evil','tradition-translation'],'#9b7e88'),
 ('medieval',[800,1399],'中世纪的多语言哲学','翻译、学校与共相','结合阿拉伯语、希伯来语与拉丁语的讨论，认识共相、信仰与理性、自然法和大学论证。',['question-universals','question-faith-reason'],'#768b8a'),
 ('renaissance',[1400,1599],'文艺复兴与改革','古典文本与人的教育','沿翻译、语文学、艺术和教育阅读人文主义，再区分改革时代的不同信仰与理性讨论。',['question-humanism','tradition-arts'],'#b58b59'),
 ('early-modern',[1600,1699],'近代哲学的方法','怀疑、归纳与实体','比较培根、笛卡尔、斯宾诺莎及洛克的方案，区分知识方法、实体说明与政治问题。',['question-method','work-meditations'],'#91725f'),
 ('enlightenment',[1700,1779],'启蒙时代','经验、公共讨论与自由','从贝克莱、休谟、伏尔泰、狄德罗和卢梭进入经验、因果、知识组织与政治自由的讨论。',[],'#a69162'),
 ('german',[1780,1831],'康德至黑格尔','批判、自由与体系','由康德的批判哲学进入费希特、谢林和黑格尔：继承、分歧与不同阶段的写作分别阅读。',[],'#8e6c72')]
EXTRA=[
 ('spinoza','巴鲁赫·斯宾诺莎',[1632,1677],1677,'实体、属性、情感与自由构成其体系的相互关联部分；《伦理学》以几何式组织论证，不能只凭一句神与自然的表述概括其全部思想。','spinoza'),
 ('locke','约翰·洛克',[1632,1704],1689,'从观念、经验与知识限度切入，再分别阅读其政治论证和宽容问题。认识论、自然权利与宗教主张不能互相替代。','locke'),
 ('leibniz','戈特弗里德·威廉·莱布尼茨',[1646,1716],1686,'其哲学散见论文、书信和未刊稿；实体、理由与自然秩序需要结合不同年代文本，不把一篇短文当作全部体系。','leibniz'),
 ('berkeley','乔治·贝克莱',[1685,1753],1710,'从知觉、观念与精神的关系展开，对物质实体及抽象观念作出批评。其非物质论不是宣称日常经验毫无规则。','berkeley'),
 ('voltaire','伏尔泰',[1694,1778],1734,'哲学通过书信、文学、科学讨论和公共行动展开；宗教宽容及对社会不公的批评与具体语境相连。','voltaire'),
 ('rousseau','让-雅克·卢梭',[1712,1778],1762,'围绕自由、平等、教育与政治共同体提问；自然状态的论证不能直接当作未经解释的历史实录。','rousseau'),
 ('diderot','德尼·狄德罗',[1713,1784],1751,'借编纂、对话、文学及自然研究参与启蒙。《百科全书》由达朗贝尔等共同参与，不能写成一位作者独立完成。','diderot')]
WORKS=[
 ('spinoza-ethics','《伦理学》身后刊行',[1677,1677],'spinoza','1677年身后出版；思想形成更早','从实体与属性到情感和自由，跟随命题、证明和附释阅读，避免只记体系口号。','spinoza'),
 ('locke-essay','《人类理解论》刊行',[1689,1690],'locke','1689年末刊行，题年1690；不同书目取年需区别','先分辨观念的来源、知识的对象与认识的限度，再回到具体论证。','locke'),
 ('berkeley-principles','《人类知识原理》',[1710,1710],'berkeley','1710年出版','区分知觉对象、精神及其活动，阅读对抽象观念和物质实体的批评。','berkeley'),
 ('leibniz-monadology','《单子论》成文',[1714,1714],'leibniz','1714年成文；后来的出版另有过程','把单纯实体、知觉及理由联系起来，区分文本成文与公开传播的年代。','leibniz'),
 ('voltaire-letters','《哲学通信》法文刊行',[1734,1734],'voltaire','1734年法文本；与较早英文本区别','从跨文化观察、自然科学与宗教讨论，阅读论辩怎样面向公共读者。','voltaire'),
 ('hume-treatise','《人性论》分卷出版',[1739,1740],'hume','前两卷1739年，第三卷1740年','知觉、因果、情感与道德属于不同论证环节，分卷出版也不代表一次性完成所有接受过程。','hume'),
 ('hume-enquiry','《人类理解研究》初版',[1748,1748],'hume','1748年以较早题名刊行；后改用现题','从经验推论与因果期待入手，比较论证的要求和人们实际形成信念的方式。','hume'),
 ('encyclopedia','《百科全书》首卷',[1751,1751],'diderot','1751年首卷；整体编纂与刊行延续多年','观察知识分类、作者协作、工艺与图像在知识组织中的位置。','diderot'),
 ('rousseau-contract','《社会契约论》',[1762,1762],'rousseau','1762年出版','区分政治权威的正当性、共同体成员的自由及公意，不将其简化为多数人任何时候的意愿。','rousseau'),
 ('kant-pure','《纯粹理性批判》第一版',[1781,1781],'kant','1781年第一版；1787年修订另列','先辨认经验知识的条件及理性的限度；现象与物自身的区分需要结合具体论证。','kant'),
 ('kant-second','《纯粹理性批判》第二版',[1787,1787],'kant','1787年第二版','比较两版序言、先验演绎等改写，不能把不同版本的章节一概当作同一段文字。','kant'),
 ('kant-practical','《实践理性批判》',[1788,1788],'kant','1788年出版','以道德法则与自由问题为入口，区分实践论证与理论认识中的证明。','kant'),
 ('kant-judgment','《判断力批判》',[1790,1790],'kant','1790年出版','从审美判断和目的论判断进入，观察自然与自由之间如何被重新提出联系。','kant'),
 ('fichte-foundation','《全部知识学的基础》',[1794,1795],'fichte','1794—1795年刊行','理解自我活动和知识的系统起点；“自我”不能直接等同某个个人任意创造世界。','johann-fichte'),
 ('schelling-system','《先验唯心论体系》',[1800,1800],'schelling','1800年出版','结合先验哲学与自然哲学的不同任务，辨认谢林这一阶段的问题。','schelling'),
 ('hegel-phenomenology','《精神现象学》',[1807,1807],'hegel','1807年出版','跟随意识经验及其转变阅读；不能把全书仅缩成正反合公式。','hegel'),
 ('schelling-freedom','《论人类自由的本质》',[1809,1809],'schelling','1809年出版','从自由与恶的问题进入，注意它与早期同一哲学的阶段区别。','schelling'),
 ('hegel-logic','《逻辑学》分部刊行',[1812,1816],'hegel','主要分部1812—1816年；后续修订另读','辨认逻辑范畴的论证任务，避免与《精神现象学》的意识经验结构混为一谈。','hegel'),
 ('hegel-right','《法哲学原理》',[1820,1821],'hegel','1820年出版，题年1821','由法、道德和伦理生活进入制度与自由问题，注意书名题年与实际出版年的区别。','hegel')]

def main():
 r=json.loads((ROOT/'dist/data/comparison-reader.json').read_text());tree=json.loads((ROOT/'dist/data/philosophy-tree.json').read_text());figs={f['id']:f for f in tree['figures']};nodes=[]
 def add(id,kind,title,span,anchor,label,summary,sections,sources,**rest):
  assert span[0]<=span[1] and 0 not in span and anchor!=0
  nodes.append(dict(id=id,kind=kind,title=title,range=span,anchor=anchor,dateLabel=label,summary=summary,sections=sections,sources=sources,**rest))
 for e in r['culturePrehistory']+r['cultureEvents']:
  span=e.get('range') or [e['year'],e.get('endYear',e['year'])];add('ph-'+e['id'],'event',e['title'],span,e['year'],e.get('dateKind','代表节点／约年；跨年材料另看出处'),e['sections'][0]['text'],e['sections'],e['sources'],people=e.get('people',[]),readRef=dict(kind='culture',id=e['id']),imageId=e.get('imageId') or {'prehistory-socrates':'portrait-socrates','prehistory-academy':'plato-bust','prehistory-lyceum':'portrait-aristotle','culture-descartes':'book-discourse','culture-bacon1620':'book-organum'}.get(e['id']),coordinates=e.get('coordinates'),place=e.get('place'),dateKind='event')
 for e in r['cultureWorks']:
  add('ph-'+e['id'],'work',e['title'],e['range'],e['range'][0],e['dateLabel'],e['argument'],e['sections'],e['sources'],people=e['people'],personIds=e['personIds'],readRef=dict(kind='culture',id=e['id']),dateKind='formation-or-edition')
 selected=set(id for lane in r['cultureNetworkLanes'] for id in lane['personIds'])|{'epictetus','machiavelli','galileo','christine'}
 bce={'socrates':[-469,-399],'plato':[-428,-347],'aristotle':[-384,-322],'epicurus':[-341,-270],'zeno-stoa':[-334,-262]}
 for p in r['people']:
  if p['id'] not in selected:continue
  digits=[int(x) for x in re.findall(r'\d+',p['lifeLabel'])];span=bce.get(p['id']) or (digits[:2] if len(digits)>=2 else p['activeRange']);kind='activity' if p['id']=='pseudo-dionysius' else 'life' if len(digits)>=2 or p['id'] in bce else 'activity'
  add('ph-person-'+p['id'],'person',p['name'],span,p['activeRange'][0],p['lifeLabel'],p['sections'][1]['text'],p['sections'],p['sources'],personId=p['id'],readRef=dict(kind='people',id=p['id']),rawRef=figs.get(p['id'],{}).get('primaryNodeId'),dateKind=kind)
 extras={f['id']:f for f in EXTRA_FIGURES}
 for id,name,span,anchor,text,slug in EXTRA:
  extras[id]=dict(id=id,name=name,lifeLabel=f'{span[0]}—{span[1]}',summary=text,sources=[source(slug)])
 for id,span,anchor in [('roger-bacon',[1214,1292],1267),('hume',[1711,1776],1739),('kant',[1724,1804],1781),('fichte',[1762,1814],1794),('schelling',[1775,1854],1800),('hegel',[1770,1831],1807)]:extras[id].update(span=span,anchor=anchor)
 for id,name,span,anchor,text,slug in EXTRA:extras[id].update(span=span,anchor=anchor)
 for id,p in extras.items():
  raw=max((n for n in tree['nodes'] if n['title'] in p.get('aliases',[p['name'],p['name'].split('·')[-1]])),key=lambda n:n['subtreeSize'],default={}).get('id')
  raw=figs.get(id,{}).get('primaryNodeId') or raw
  add('ph-person-'+id,'person',p['name'],p['span'],p['anchor'],p['lifeLabel'],p['summary'],[dict(title='核心问题',text=p['summary'])],p['sources'],personId=id,rawRef=raw,dateKind='life-approximate' if id=='roger-bacon' else 'life')
 for id,title,span,person,label,text,slug in WORKS:
  work_sources=[source(slug,'生平与代表作品／出版信息')]
  if id=='locke-essay':work_sources.append(dict(title='English Philosophical Texts Online：洛克《人类理解论》',url='https://englishphilosophy.org/locke/ehu',kind='原典电子版与版本说明',locator='编辑说明：1689年12月出版，扉页题年1690',note='实际刊行与书名页题年分列。'))
  if id=='hegel-right':work_sources.append(dict(title='剑桥大学出版社：《法哲学原理》研究导言',url='https://assets.cambridge.org/97811070/77928/excerpt/9781107077928_excerpt.pdf',kind='学术研究与版本说明',locator='导言首页：1820年实际刊行与1821年扉页题年',note='出版年与书名页题年分列；原典论证需继续阅读。'))
  add('ph-modern-'+id,'work',title,span,span[0],label,text,[dict(title='阅读入口',text=text),dict(title='先辨认问题',text='先区分本书提出的问题、使用的论证及版本语境，再比较与其他作者的接受或分歧。')],work_sources,personIds=[person],imageId={'kant-pure':'book-kant'}.get(id),dateKind='edition-or-composition')
 apply_person_expansions(nodes)
 phases=[dict(id=id,range=span,title=title,short=short,intro=intro,readingIds=refs,color=color) for id,span,title,short,intro,refs,color in PHASES]
 for n in nodes:
  n['phaseId']=next(p['id'] for p in phases if p['range'][0]<=n['anchor']<=p['range'][1]);n['editorial']='本站编选导读；日期性质与原始笔记的审核状态分别处理。'
 data=dict(version=1,title='西方哲学史',range=[-650,1831],phases=phases,nodes=sorted(nodes,key=lambda n:(n['anchor'],n['id'])),editorial='分段为阅读编选，思想传统可以交错。人物带表示生平或已注明的活动期；浏览定位采用代表活动年。作品的形成、编纂、出版与修订分别标注。约年与区间不视为精确发生日；本版至1831年，生命延续到此后的记录保留真实标签。原始树另作核对，不因进入时间轴而整体视为已审校。')
 (ROOT/'dist/data/philosophy-atlas.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 print(f"{len(phases)} phases / {len(nodes)} nodes: "+str({k:sum(n['kind']==k for n in nodes) for k in ['person','work','event']}))
if __name__=='__main__':main()
