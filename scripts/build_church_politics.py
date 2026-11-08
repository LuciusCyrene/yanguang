"""Dated political context for Early Church history, 63–451 CE.
Cliopatria v0.2.1 (CC BY 4.0); no polity colour encodes religion.
"""
from pathlib import Path
import json,zipfile,urllib.request,hashlib
from shapely.geometry import shape,mapping,box
from shapely import make_valid
from shapely.ops import unary_union
ROOT=Path(__file__).resolve().parents[1];cache=ROOT/'.cache';cache.mkdir(exist_ok=True)
archive=cache/'cliopatria-v0.2.1.zip'
if not archive.exists():urllib.request.urlretrieve('https://raw.githubusercontent.com/Seshat-Global-History-Databank/cliopatria/v0.2.1/cliopatria.geojson.zip',archive)
with zipfile.ZipFile(archive) as z:raw=json.loads(z.read(z.namelist()[0]))
area=box(-7,10,48,54)
config={
 'Roman Empire':('rome','罗马帝国','#657da0','empire',[28,40.5]),
 'Eastern Roman Empire':('east-rome','东罗马帝国','#6b8f98','empire',[30,40.0]),
 'Western Roman Empire':('west-rome','西罗马帝国','#7d80a4','empire',[10,43.2]),
 'Parthian Empire':('parthia','帕提亚帝国','#b18251','empire',[44,34.0]),
 'Sasanian Empire':('sasanian','萨珊帝国','#b38755','empire',[45,33.5]),
 'Kingdom of Axum':('aksum','阿克苏姆王国','#b0905a','kingdom',[38.5,15.2]),
 'Kingdom of Armenia':('armenia','亚美尼亚王国','#b09c62','kingdom',[43.5,40.0]),
 'Nabataeans':('nabataea','纳巴泰王国','#b1976b','kingdom',[36.6,29.1]),
 'Kingdom of Osroene':('osroene','奥斯若恩王国','#929066','kingdom',[39.1,36.7]),
 'Kingdom of Adiabene':('adiabene','阿迪亚贝尼王国','#b09979','kingdom',[43,36.9]),
 'Kingdom of Commagene':('commagene','科马吉尼王国','#9a8c6b','client',[38.9,38.2]),
 'Kingdom of Pontus':('pontus','本都王国','#9b9a6b','client',[37.1,40.6]),
 'Kingdom of Gordyene':('gordyene','戈尔迪恩王国','#9b9375','kingdom',[41.8,37.7]),
 'Kingdom of Sophene':('sophene','索菲尼王国','#a0a178','kingdom',[39.4,38.5]),
 'Caucasian Iberia':('iberia','高加索伊比利亚','#8b9c88','kingdom',[44,42.0]),
 'Caucasian Albania':('albania','高加索阿尔巴尼亚','#879f78','kingdom',[47,41.0]),
 'Lazica':('lazica','拉齐卡','#809681','kingdom',[41.0,42.4]),
 'Cimmerian Bosporus':('bosporus','博斯普鲁斯王国','#91a47b','client',[37,46.2]),
 'Himyarite Kingdom':('himyar','希木叶尔王国','#a79b6b','kingdom',[44,15.5]),
 'Kingdom of Kush':('kush','库施王国','#a69c72','kingdom',[33,18]),
 'Nobatia':('nobatia','诺巴提亚','#b0a77f','kingdom',[31,22]),
 'Makuria':('makuria','马库里亚','#a3a279','kingdom',[31.5,18]),
 'Alodia':('alodia','阿洛迪亚','#a7a97b','kingdom',[33,14]),
 'Gallic Empire':('gallic','高卢帝国','#9c859d','empire',[2,46]),
 'Palmyrene Empire':('palmyra','帕尔米拉政权','#aa927b','empire',[38,34]),
 'Vandals':('vandals','汪达尔诸部','#a79a77','polity',[2,39]),
 'Vandal Kingdom':('vandal-kingdom','汪达尔王国','#9f9472','kingdom',[10,35.5]),
 'Visigoths':('visigoths','西哥特诸部','#8c9e78','polity',[3,44]),
 'Visigothic Kingdom':('visigoth-kingdom','西哥特王国','#849b7c','kingdom',[1,43.5]),
 'Burgundian Kingdom':('burgundy','勃艮第王国','#9c8eaa','kingdom',[5,46.5]),
 'Salian Franks':('salian-franks','萨利安法兰克诸部','#8eaa99','polity',[4,50.5]),
 'Ripuarian Franks':('ripuarian-franks','里普阿里法兰克诸部','#8da78c','polity',[7,50]),
 'Hunnic Empire':('huns','匈人帝国','#aa8c84','empire',[20,47]),
 'Anglo-Saxon England':('anglo-saxon','盎格鲁—撒克逊诸部','#929b7b','polity',[0,52])}
features=[]
for f in raw['features']:
 p=f['properties'];name=p['Name']
 if name not in config or p['FromYear']>451 or p['ToYear']<63:continue
 g=make_valid(shape(f['geometry']))
 if not g.intersects(area):continue
 g=g.intersection(area).simplify(.008,preserve_topology=True)
 if g.geom_type=='GeometryCollection':g=unary_union([x for x in g.geoms if x.geom_type in ('Polygon','MultiPolygon')])
 if g.is_empty or g.geom_type not in ('Polygon','MultiPolygon'):continue
 key,title,color,kind,anchor=config[name]
 description='按Cliopatria所列历史时段显示的政治范围，不表示同一范围内居民的信仰或教会辖区。'
 if key in ['east-rome','west-rome']:description+=' 东、西罗马的政治分治不等同于教会已按1054年的格局分裂。'
 if key=='aksum':description+=' 阿克苏姆位于罗马帝国外，政治范围与王室归信的具体时间分别处理。'
 props=dict(key=key,name=title,color=color,kind=kind,anchor=anchor,source='https://github.com/Seshat-Global-History-Databank/cliopatria',sourcePeriod=[p['FromYear'],p['ToYear']],description=description,changes='按63—451年与扩大地图范围裁剪、简化，保留源时段。',parent='',precision='dataset-period-outline',**{'from':max(63,p['FromYear']),'to':min(451,p['ToYear'])})
 features.append(dict(type='Feature',properties=props,geometry=mapping(g)))
for i,f in enumerate(features):f['properties']['id']=f'church-polity-{i+1:03}'
metadata={'years':[63,451],'bounds':[-7,10,48,54],'dataset':'Cliopatria v0.2.1','source':'https://github.com/Seshat-Global-History-Databank/cliopatria','license':'CC BY 4.0','licenseUrl':'https://creativecommons.org/licenses/by/4.0/','credit':'Seshat Global History Databank, Cliopatria v0.2.1. 裁剪与简化；政治范围不表示宗教人口分布。','sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'notes':'本层不提供所有古代省界，也不把帝国分治当作教会分裂。源数据时段并非每年边界都有独立考证。'}
(ROOT/'dist/data/politics-church.json').write_text(json.dumps(dict(type='FeatureCollection',features=features,metadata=metadata),ensure_ascii=False,separators=(',',':')))
print('Church political features:',len(features))
