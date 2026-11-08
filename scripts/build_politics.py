"""Extract dated polity outlines; add explicitly schematic Judean administration.
Source: Cliopatria v0.2.1 (CC BY 4.0), Seshat Global History Databank.
All transformations and editorial corrections are retained in each feature.
"""
from pathlib import Path
from urllib.request import urlretrieve
from shapely.geometry import shape, mapping, box, Polygon
from shapely.ops import unary_union
from shapely import make_valid
import json,zipfile,hashlib
ROOT=Path(__file__).resolve().parents[1]
CACHE=ROOT/'.cache';CACHE.mkdir(exist_ok=True)
ARCHIVE=CACHE/'cliopatria-v0.2.1.zip'
BASE='https://github.com/Seshat-Global-History-Databank/cliopatria'
URL='https://raw.githubusercontent.com/Seshat-Global-History-Databank/cliopatria/v0.2.1/cliopatria.geojson.zip'
if not ARCHIVE.exists():urlretrieve(URL,ARCHIVE)
with zipfile.ZipFile(ARCHIVE) as z:
 data=json.loads(z.read(next(n for n in z.namelist() if n.endswith('.geojson'))))
area=box(-7,10,48,54)
rows=[f for f in data['features'] if f['properties']['FromYear']<=62 and f['properties']['ToYear']>=30]
# Bounding lines here are authored regional sketches, not digitised survey borders.
judea=Polygon([(34.52,31.30),(34.55,31.55),(34.67,31.90),(34.73,32.12),(34.84,32.55),(35.10,32.62),(35.38,32.50),(35.54,32.50),(35.57,32.00),(35.50,31.55),(35.45,31.20),(35.36,30.90),(35.00,30.80),(34.65,30.98)])
galilee=Polygon([(35.17,32.60),(35.12,32.82),(35.20,33.10),(35.50,33.15),(35.62,33.00),(35.62,32.55),(35.45,32.45)])
perea=Polygon([(35.58,32.50),(35.95,32.52),(35.96,32.15),(35.83,31.70),(35.77,31.40),(35.50,31.45),(35.56,31.85)])
north=Polygon([(35.62,32.72),(36.10,32.66),(36.60,32.90),(36.40,33.28),(36.10,33.44),(35.90,33.47),(35.62,33.25)])
herodian=unary_union([judea,galilee,perea,north]);gp=unary_union([galilee,perea])
J18='https://penelope.uchicago.edu/josephus/ant-18.html'
J19='https://penelope.uchicago.edu/josephus/ant-19.html'
J20='https://penelope.uchicago.edu/josephus/ant-20.html'
THRACE='https://link.springer.com/article/10.1007/s12520-023-01920-3'
ARMENIA='https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Tacitus/Annals/15A*.html'
config={
 'Roman Empire':('rome','罗马帝国','#657da0','empire',[28,40.5],'显示东地中海一带的罗马疆域。范围来自分期数据；内部的犹太行政区与附属君主领地另画，不把附属王国等同于罗马省。'),
 'Parthian Empire':('parthia','帕提亚帝国','#b18251','empire',[41.5,34.8],'位于罗马东方的主要政权。这里只显示当前地图覆盖到的西部范围，并非帝国全境。'),
 'Nabataeans':('nabataea','纳巴泰王国','#b1976b','kingdom',[36.6,29.1],'首都彼特拉所在的纳巴泰王国。范围沿用源数据的时期轮廓，不将106年后罗马阿拉伯行省的范围提前使用。'),
 'Kingdom of Armenia':('armenia','亚美尼亚王国','#b09c62','kingdom',[41.6,39.4],'位于罗马与帕提亚之间，王位与宗主关系多次发生争夺；本色块不裁定每一年的实际军事控制。'),
 'Thracian Kingdom':('thrace','色雷斯附属王国','#88965c','client',[26.0,43.0],'罗马体系内的附属王国；本图在46年起撤去王国色块，归入罗马范围。'),
 'Kingdom of Pontus':('pontus','本都王国','#9b9a6b','client',[37.1,40.6],'黑海南岸地方王国。此时不是将整个现代黑海沿岸统一画成一个罗马省。'),
 'Kingdom of Commagene':('commagene','科马吉尼王国','#9a8c6b','client',[38.9,38.2],'源数据在43年起单独列出的地方王国。未列出的年份不表示历史上必不存在，而是当前数据没有单列对应轮廓。'),
 'Kingdom of Osroene':('osroene','奥斯若恩王国','#929066','kingdom',[39.1,36.7],'幼发拉底河附近的地方王国，处于罗马与帕提亚影响交错地带。'),
 'Kingdom of Sophene':('sophene','索菲尼王国','#a0a178','kingdom',[39.4,38.5],'亚美尼亚西南部的地方政治区域；按源数据单列，古代宗主关系不由色块直接判定。'),
 'Kingdom of Adiabene':('adiabene','阿迪亚贝尼王国','#b09979','kingdom',[42.2,36.9],'上美索不达米亚地方王国。地图保留其单独轮廓，而不把帝国间影响关系简化为现代式国界。'),
 'Kingdom of Gordyene':('gordyene','戈尔迪恩王国','#9b9375','kingdom',[41.8,37.7],'上美索不达米亚与亚美尼亚之间的地方政治区域，轮廓沿用历史数据的概括。'),
 'Lazica':('lazica','拉齐卡','#809681','kingdom',[41.0,42.4],'黑海东岸地方政权，当前视野只覆盖其一部分。'),
 'Caucasian Iberia':('iberia','高加索伊比利亚','#8b9c88','kingdom',[42.8,42.0],'高加索地方王国，不是欧洲的伊比利亚半岛。'),
 'Cimmerian Bosporus':('bosporus','博斯普鲁斯王国','#91a47b','client',[37.0,46.2],'黑海北岸地方王国，地图只显示南部轮廓。')}
features=[]
def add(key,name,color,kind,geom,year,source,description,anchor,changes='',original=None,parent=''):
 geom=make_valid(geom).intersection(area).simplify(.008,preserve_topology=True)
 if geom.is_empty:return
 if geom.geom_type=='GeometryCollection':geom=unary_union([g for g in geom.geoms if g.geom_type in ('Polygon','MultiPolygon')])
 if geom.is_empty or geom.geom_type not in ('Polygon','MultiPolygon'):return
 props={'key':key,'name':name,'color':color,'kind':kind,'from':year,'to':year,'source':source,'description':description,'anchor':anchor,'changes':changes,'parent':parent,'precision':'regional-schematic' if source!=BASE else 'dataset-period-outline'}
 if original:props['sourcePeriod']=original
 g=mapping(geom)
 signature=json.dumps([props['key'],g,{k:v for k,v in props.items() if k not in ('from','to')}],ensure_ascii=False,sort_keys=True)
 last=next((f for f in reversed(features) if f['_signature']==signature and f['properties']['to']==year-1),None)
 if last:last['properties']['to']=year
 else:features.append({'type':'Feature','properties':props,'geometry':g,'_signature':signature})
last_armenia=next(shape(f['geometry']) for f in rows if f['properties']['Name']=='Kingdom of Armenia')
for year in range(30,63):
 active={f['properties']['Name']:f for f in rows if f['properties']['FromYear']<=year<=f['properties']['ToYear'] and f['properties']['Name'] in config}
 for name,f in active.items():
  if name=='Thracian Kingdom' and year>=46:continue
  key,title,color,kind,anchor,description=config[name];geom=shape(f['geometry']);p=f['properties'];changes='按显示范围裁剪、简化；不作精确测绘边界使用。'
  if name=='Kingdom of Armenia' and year>=54:
   title='亚美尼亚（争夺区）';kind='contested';changes+=' 54年起标为罗马—帕提亚争夺区域，不断言逐年实控。'
  if name=='Roman Empire':
   if 46<=year<=50:
    geom=geom.union(shape(active['Thracian Kingdom']['geometry']));changes+=' 已按46年设省修订色雷斯，不沿用源数据王国延至50年的分期。'
   if year>=60:
    geom=geom.difference(last_armenia);changes+=' 源数据60年将亚美尼亚并入罗马；本图按战争中的争夺区另列，不断言稳定直辖。'
  add(key,title,color,kind,geom,year,BASE,description,anchor,changes,[p['FromYear'],p['ToYear']])
 if year>=60:
  add('armenia','亚美尼亚（争夺区）','#b09c62','contested',last_armenia,year,ARMENIA,'60—62年处于罗马与帕提亚争夺中。使用前期亚美尼亚轮廓作区域参照，不是逐年实控复原。',[41.6,39.4],'沿用源数据前期轮廓，并从罗马稳定直辖色块中排除；时间解释依据塔西佗《编年史》第15卷。',[-63,59])
 # This administrative overlay is intentionally distinct from polity outlines.
 note='作者按犹太、撒马利亚、以土买、加利利、比利亚与东北领地关系绘制的概略地区轮廓；不是从Cliopatria提取的精确省界。'
 if year<=40:
  add('judaea','犹太行政区（罗马直辖）','#8570a9','province',judea,year,J18,'由罗马派遣行政长官管理。此色块为罗马体系内部行政范围，不是独立国家。',[35.03,31.65],note,parent='罗马帝国')
  if year<=38:add('antipas','希律安提帕领地','#b28a48','client',gp,year,J18,'加利利与比利亚的分封领地，依附罗马；39年起转归亚基帕一世。',[35.4,32.9],note,parent='罗马附属统治')
  if year<=33:add('philip','腓力分封领地','#a28f5c','client',north,year,J18,'东北主要领地示意；腓力死后至亚基帕受封之前，一度转由罗马方面管理。',[36.0,33.0],note,parent='罗马附属统治')
  elif year<=36:add('northeast-roman','东北领地（罗马管理）','#9a8bb3','province',north,year,J18,'腓力死后的过渡阶段。此轮廓仅显示主要地区，不绘制所有边缘辖地。',[36.0,33.0],note,parent='罗马体系')
  if year>=37:
   geom=north if year<=38 else unary_union([north,gp])
   add('agrippa1','亚基帕一世主要领地','#b28a48','client',geom,year,J18,'37年取得东北领地，39年又取得安提帕的加利利、比利亚。尚未统治犹太本部。',[36.0,33.0],note,parent='罗马附属王国')
 elif year<=43:
  add('agrippa1','亚基帕一世王国（主要领地）','#b28a48','client',herodian,year,J19,'41年获克劳狄授予犹太与撒马利亚，主要领地在此合并显示。不是脱离罗马的独立帝国。',[35.3,31.8],note+' 未细绘阿比利尼、黎巴嫩附近等边缘领地。',parent='罗马附属王国')
 else:
  geom=herodian if year<=52 else unary_union([judea,gp])
  add('judaea','犹太行政区（罗马直辖）','#8570a9','province',geom,year,J19,'44年亚基帕一世死后，罗马重新派行政长官管理。44年为交接年，本图按其死后的局面显示。',[35.03,31.65],note+' 53年后的北部主要领地另列亚基帕二世；未细绘54年以后个别城市的转授。',parent='罗马帝国')
  if year>=53:add('agrippa2','亚基帕二世主要领地','#ab884f','client',north,year,J20,'53年获授原腓力等东北领地。54年后另获部分加利利城市等，未在此粗略轮廓中逐一细绘；不是统治耶路撒冷的犹太王。',[36.0,33.0],note,parent='罗马附属王国')
for i,f in enumerate(features):f.pop('_signature');f['properties']['id']=f'polity-{i+1:03}'
output={'type':'FeatureCollection','features':features,'metadata':{
 'years':[30,62],'bounds':[-7,10,48,54],'dataset':'Cliopatria v0.2.1','source':BASE,'license':'CC BY 4.0','licenseUrl':'https://creativecommons.org/licenses/by/4.0/',
 'credit':'Seshat Global History Databank, Cliopatria v0.2.1. 本项目裁剪、简化并按所列来源作时间与行政覆盖修订。',
 'sha256':hashlib.sha256(ARCHIVE.read_bytes()).hexdigest(),
 'notes':'政权轮廓、附属王国与内部行政区分层表示。边界为历史区域示意，未绘制所有古代省份。未着色不表示无人居住或无政治组织。',
 'corrections':[{'topic':'色雷斯46年设省','source':THRACE},{'topic':'亚美尼亚争夺','source':ARMENIA},{'topic':'犹太与希律家族领地变化','source':J18},{'topic':'亚基帕一世41、44年转折','source':J19},{'topic':'亚基帕二世53年受封','source':J20}]}}
(ROOT/'dist/data/politics.json').write_text(json.dumps(output,ensure_ascii=False,separators=(',',':')))
print('Saved',len(features),'dated boundary features')
