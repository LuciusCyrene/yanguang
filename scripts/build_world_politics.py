"""Selected political context, 452–1648; Cliopatria v0.2.1 CC BY 4.0.
No religious demography is inferred from a polity's territory.
"""
from pathlib import Path
import json,zipfile,hashlib
from shapely.geometry import shape,mapping,box
from shapely import make_valid
from shapely.ops import unary_union
ROOT=Path(__file__).resolve().parents[1]
archive=ROOT/'.cache/cliopatria-v0.2.1.zip'
with zipfile.ZipFile(archive) as z:raw=json.loads(z.read(z.namelist()[0]))
# Exact dataset names, explicit Chinese labels, and label positions inside the viewing area.
rows=[
('Eastern Roman Empire','东罗马帝国',30,40),('Byzantine Empire','拜占庭帝国',28,39),('Western Roman Empire','西罗马帝国',10,43),
('Sasanian Empire','萨珊帝国',47,33),('Kingdom of the Franks','法兰克王国',4,49),('Carolingian Empire','加洛林帝国',8,49),('West Franks','西法兰克',2,47),('East Franks','东法兰克',10,50),('Middle Franks','中法兰克',6,46),
('Visigothic Kingdom','西哥特王国',-4,40),('Ostrogothic Kingdom','东哥特王国',12,42),('Lombards','伦巴第诸部',10,45),('Lombard Kingdom','伦巴第王国',10,45),
('Anglo-Saxon England','盎格鲁—撒克逊诸国',-1,52),('Kingdom of England','英格兰王国',-1,52),('Norman England','诺曼英格兰',-1,52),('Kingdom of Scotland','苏格兰王国',-4,57),('Kingdom of France','法兰西王国',2,47),
('(Holy Roman Empire)','神圣罗马帝国',11,50),('Papal States','教皇国',12.5,42),('Kingdom of Portugal','葡萄牙王国',-8,39),('Kingdom of Castile','卡斯蒂利亚王国',-4,40),('Crown of Castile','卡斯蒂利亚王冠',-4,40),('Crown of Aragon','阿拉贡王冠',0,41),('Spanish Empire','西班牙帝国',-4,40),('Kingdom of Spain','西班牙王国',-4,40),
('Rashidun Caliphate','正统哈里发时期',39,25),('Umayyad Caliphate','倭马亚哈里发国',37,33),('Abbasid Caliphate','阿拔斯哈里发国',44,33),('Abbasid Caliphate/Buyid Dynasty','阿拔斯—白益时期',45,33),('Fatimid Caliphate','法蒂玛哈里发国',31,30),('Ayyubid Sultanate','阿尤布苏丹国',35,31),('Mamluk Sultanate','马穆鲁克苏丹国',31,29),('Ottoman Empire','奥斯曼帝国',31,40),('Great Seljuk Empire','大塞尔柱帝国',49,35),
("Kievan Rus'",'基辅罗斯',30,50),("Rus'",'罗斯诸地',30,53),('Tsardom of Russia','俄罗斯沙皇国',39,56),('Kingdom of Axum','阿克苏姆王国',39,15),('Ethiopian Empire','埃塞俄比亚帝国',39,11),('Nobatia','诺巴提亚',31,22),('Makuria','马库里亚',31,18),('Makuria Kingdom','马库里亚王国',31,18),('Alodia','阿洛迪亚',33,15),('Kingdom of Kongo','刚果王国',15,-6),
('Mongol Empire','蒙古帝国',85,45),('Ilkhanate','伊儿汗国',48,36),('Tang Dynasty','唐',109,35),('Northern Song','北宋',114,34),('Southern Song','南宋',117,29),('Yuan Dynasty','元',110,37),('Ming Dynasty','明',114,35),('Qing Dynasty','清',118,40),
('Late Pallava Empire','帕拉瓦王朝',79,13),('Chola Empire','朱罗帝国',79,11),('Vijayanagara Empire','毗奢耶那伽罗帝国',77,15),('Delhi Sultanate','德里苏丹国',77,28),('Mughal Empire','莫卧儿帝国',78,28),
('Asuka Japan','飞鸟时代日本',136,35),('Nara Japan','奈良时代日本',136,35),('Heian Japan','平安时代日本',136,36),('Warring States Japan','战国时期日本诸势力',136,36),('Tokugawa Shogunate','德川幕府',138,36),('New France','新法兰西',-70,47)]
config={name:(f'world-{i}',title,[lon,lat]) for i,(name,title,lon,lat) in enumerate(rows)}
area=box(-125,-40,150,65);features=[];palette=['#708b98','#9183a0','#9c8a63','#829b76','#b08a70','#699489','#a292af']
for f in raw['features']:
 p=f['properties'];name=p['Name']
 if name not in config or p['FromYear']>1648 or p['ToYear']<452:continue
 if name=='(Holy Roman Empire)' and p['ToYear']<962:continue
 g=make_valid(shape(f['geometry']))
 if not g.intersects(area):continue
 g=g.intersection(area).simplify(.065,preserve_topology=True)
 if g.geom_type=='GeometryCollection':g=unary_union([x for x in g.geoms if x.geom_type in ('Polygon','MultiPolygon')])
 if g.is_empty or g.geom_type not in ('Polygon','MultiPolygon'):continue
 key,title,anchor=config[name]
 props=dict(id=f'world-polity-{len(features)+1:04}',key=key,name=title,color=palette[list(config).index(name)%len(palette)],kind='polity',anchor=anchor,source='https://github.com/Seshat-Global-History-Databank/cliopatria/tree/v0.2.1',sourcePeriod=[p['FromYear'],p['ToYear']],description='选取的政治背景，不是宗教分布图。王室归信、传教活动与居民信仰的变化须分别依据史料判断。',changes='裁至452—1648年与世界教会史查看范围，简化轮廓。未绘制所有小邦与省份；殖民政权的源范围不等于当地群体同意或全部有效控制。',parent='',precision='dataset-period-outline',**{'from':max(962 if name=='(Holy Roman Empire)' else 452,p['FromYear']),'to':min(1648,p['ToYear'])})
 if name=='(Holy Roman Empire)':
  props['description']+=' 此处为源数据中括号标识的帝国成员汇总范围，并非皇帝全部直辖领地；不绘制各小邦。'
  props['precision']='dataset-composite-outline'
 features.append(dict(type='Feature',properties=props,geometry=mapping(g)))
metadata=dict(years=[452,1648],bounds=[-125,-40,150,65],dataset='Cliopatria v0.2.1',license='CC BY 4.0',licenseUrl='https://creativecommons.org/licenses/by/4.0/',source='https://github.com/Seshat-Global-History-Databank/cliopatria/tree/v0.2.1',sha256=hashlib.sha256(archive.read_bytes()).hexdigest(),notes='选取主要政治实体，并非全球所有政权的完备年图。未着色不表示无人居住、无政治组织或无教会。不同来源实体可能存在重叠主张，不推断信仰人口。')
(ROOT/'dist/data/politics-world.json').write_text(json.dumps(dict(type='FeatureCollection',metadata=metadata,features=features),ensure_ascii=False,separators=(',',':')))
print('World political records:',len(features))
