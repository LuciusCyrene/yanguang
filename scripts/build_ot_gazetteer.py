"""Curated Chinese gazetteer derived from OpenBible, retaining candidates and verse refs."""
from pathlib import Path
import json,urllib.request,re
ROOT=Path(__file__).resolve().parents[1];CACHE=ROOT/'.cache/ot-geography';OUT=ROOT/'dist/data'
CACHE.mkdir(parents=True,exist_ok=True)
REV='7eb18a5ee62f27b9b93bd6689ea272d76dd23b8f'
BASE=f'https://raw.githubusercontent.com/openbibleinfo/Bible-Geocoding-Data/{REV}/'
def fetch(path,name):
 p=CACHE/name
 if not p.exists():p.write_bytes(urllib.request.urlopen(urllib.request.Request(BASE+path,headers={'User-Agent':'BiblicalAtlasResearch/1.0'}),timeout=45).read())
 return p.read_bytes()
fetch('data/ancient.jsonl','ancient.jsonl');fetch('data/modern.jsonl','modern.jsonl')
ancient={d['friendly_id']:d for d in map(json.loads,(CACHE/'ancient.jsonl').read_text().splitlines())}
modern={d['id']:d for d in map(json.loads,(CACHE/'modern.jsonl').read_text().splitlines())}
NAMES={
 'Jerusalem':'耶路撒冷','Jericho 1':'耶利哥','Ai 1':'艾城','Gilgal 1':'吉甲（近耶利哥）','Gibeon':'基遍','Shechem':'示剑','Shiloh':'示罗','Bethel 1':'伯特利','Mount Tabor':'他泊山','Ophrah 2':'俄弗拉（基甸地区）','Gaza':'迦萨','Gibeah 1':'基比亚（便雅悯）','Ramah 4':'拉玛（撒母耳背景）','Ramah 1':'拉玛（便雅悯城邑）','Michmash':'密抹','Bethlehem 1':'伯利恒（犹大）','Valley of Elah':'以拉谷','Hebron':'希伯仑','Samaria 1':'撒马利亚城','Mount Carmel':'迦密山','Beersheba 1':'别是巴','Jezreel 1':'耶斯列','Nineveh':'尼尼微','Babylon 1':'巴比伦','Tahpanhes':'答比匿','Joppa':'约帕','Tekoa':'提哥亚',
 'Gezer':'基色','Lachish':'拉吉','Megiddo':'米吉多','Hazor 1':'夏琐','Dan':'但','Shunem':'书念','Dothan':'多坍','Mizpah 3':'米斯巴（便雅悯）','Mizpah 1':'米斯巴（基列候选）','Anathoth':'亚拿突','Engedi':'隐基底','Adullam':'亚杜兰','Ziklag':'洗革拉（候选）','Shittim':'什亭','Aijalon 1':'亚雅仑','Lower Beth-horon':'下伯和仑','Upper Beth-horon':'上伯和仑','Beth-shemesh 1':'伯示麦（犹大）','Kiriath-jearim':'基列耶琳','Emmaus':'以马忤斯','Ashdod':'亚实突','Ashkelon':'亚实基伦','Ekron':'以革伦','Gath 1':'迦特','Tirzah':'得撒','Jabesh-gilead':'基列雅比','Ramoth-gilead':'基列的拉末','Mahanaim':'玛哈念','Penuel':'毗努伊勒','Succoth 1':'疏割（约旦河东）','Heshbon':'希实本','Medeba':'米底巴','Dibon 1':'底本','Aroer 1':'亚罗珥','Rabbah 1':'拉巴','Besor':'比梭溪','Zarephath':'撒勒法','Sidon':'西顿','Tyre':'推罗','Damascus':'大马士革','Hamath 1':'哈马',
 'Nob':'挪伯','Geba 1':'迦巴','Bahurim':'巴户琳','Mount of Olives':'橄榄山','Valley of Hinnom':'欣嫩谷','Valley of Achor':'亚割谷','Kedesh 1':'基低斯','Dor':'多珥','Aphek 1':'亚弗','Timnah 1':'亭拿','Azekah':'亚西加','Debir 1':'底璧','Kadesh-barnea':'加低斯巴尼亚','Eglon':'伊矶伦','Libnah 1':'立拿'}
# New Testament-only sites are not admitted even if included in the name dictionary.
OTBOOKS={'Josh','Judg','1Sam','2Sam','1Kgs','2Kgs','Isa','Jer','Ezek','Hos','Joel','Amos','Obad','Jonah','Mic','Nah','Hab','Zeph','Hag','Zech','Mal'}
BOOK_NAMES={'Josh':'约书亚记','Judg':'士师记','1Sam':'撒母耳记上','2Sam':'撒母耳记下','1Kgs':'列王纪上','2Kgs':'列王纪下','Isa':'以赛亚书','Jer':'耶利米书','Ezek':'以西结书','Hos':'何西阿书','Joel':'约珥书','Amos':'阿摩司书','Obad':'俄巴底亚书','Jonah':'约拿书','Mic':'弥迦书','Nah':'那鸿书','Hab':'哈巴谷书','Zeph':'西番雅书','Hag':'哈该书','Zech':'撒迦利亚书','Mal':'玛拉基书'}
items=[];missing=[]
for friendly,name in NAMES.items():
 d=ancient.get(friendly)
 if not d:missing.append(friendly);continue
 refs=[v for v in d.get('verses',[]) if v['osis'].split('.')[0] in OTBOOKS]
 if not refs:continue
 candidates=[]
 for mid,association in sorted(d.get('modern_associations',{}).items(),key=lambda v:v[1]['score'],reverse=True):
  m=modern.get(mid)
  if not m or 'lonlat' not in m or association['score']<0:continue
  lon,lat=map(float,m['lonlat'].split(','));candidates.append(dict(lon=lon,lat=lat,name=association['name'],score=association['score'],provenance=m.get('coordinates_source',{}),pointType=m.get('precision',{}).get('description',m.get('type',''))))
 if not candidates:continue
 best=candidates[0];types=d.get('types',[]);natural=any(t in types for t in ['mountain','valley','wadi','river','mountain range','body of water','spring'])
 renderedRefs=[]
 for r in refs:
  a=r['osis'].split('.');renderedRefs.append(dict(osis=r['osis'],book=a[0],chapter=int(a[1]),verse=int(a[2]),label=BOOK_NAMES[a[0]]+f'{a[1]}:{a[2]}'))
 items.append(dict(id=d['id'],name=name,english=friendly,sourceUrl=f"https://www.openbible.info/geo/ancient/{d['id']}/{d['url_slug']}",lon=best['lon'],lat=best['lat'],kind='natural' if natural else 'settlement',types=types,certainty='较一致的地名识别' if best['score']>=800 else '候选识别／仍有争议',uncertain=best['score']<800,candidates=candidates[:4],references=renderedRefs,source='Stephen Smith / OpenBible.info',note='源资料的候选识别与现代坐标用于经文地理阅读；不是本项目对遗址、城墙或人物站立点的独立考证。'))
meta=dict(source='Stephen Smith / OpenBible.info Bible Geocoding Data',revision=REV,license='CC BY 4.0；底层OpenStreetMap要素按ODbL 1.0保留署名',sourceUrl='https://github.com/openbibleinfo/Bible-Geocoding-Data',attribution='地名与候选：© Stephen Smith / OpenBible.info（CC BY 4.0）。现代OSM地理要素：© OpenStreetMap contributors（ODbL 1.0）。未采用源资料照片。',note='经文出处为原数据的英文译本索引，中文书名为本项目整理；章节差异须回到中文经文核对。分数仅用于保留候选次序，不表示本项目计算的考古概率。')
labels=[
 [34.8,31.55,'示非拉丘陵','land'],[35.11,31.55,'犹大山地','land'],[35.28,31.35,'犹大旷野','land'],[35.55,31.8,'约旦河谷','land'],[35.18,32.3,'撒马利亚山地','land'],[35.32,32.55,'耶斯列谷','land'],[35.6,32.55,'基列山地','land'],[35.75,32.95,'巴珊高地','land'],[35.58,32.82,'基尼烈湖／加利利海','water'],[35.48,31.45,'盐海／死海','water'],[34.9,30.9,'南地','land'],[34.35,32.4,'地中海','water']]
result=dict(metadata=meta,sites=items,labels=[dict(lon=lon,lat=lat,name=name,kind=kind) for lon,lat,name,kind in labels])
(OUT/'ot-gazetteer.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')))
print('sites',len(items),'missing',missing)
# Water geometries remain a distinct layer, with their OSM attribution preserved.
features=[]
for friendly,label in [('Jordan','约旦河'),('Jabbok','雅博河'),('Arnon','亚嫩河'),('Kishon','基顺河'),('Salt Sea','盐海／死海'),('Sea of Galilee','基尼烈湖／加利利海')]:
 d=ancient.get(friendly)
 if not d:continue
 best_id=max(d.get('modern_associations',{}),key=lambda k:d['modern_associations'][k]['score'],default=None)
 resolutions=[r for identification in d['identifications'] for r in identification.get('resolutions',[]) if r.get('modern_basis_id')==best_id]
 if not resolutions:continue
 roles=resolutions[0].get('geojson_roles',{});role=next((roles[k] for k in ['precise','geometry','simplified_precise','simplified_geometry'] if k in roles),None)
 if not role:continue
 raw=json.loads(fetch('geometry/'+d['geojson_file'],d['geojson_file']))
 for f in raw['features']:
  if f.get('id',f.get('properties',{}).get('id'))!=role['id']:continue
  if f['geometry']['type'] not in ['Polygon','MultiPolygon','LineString','MultiLineString']:continue
  features.append(dict(type='Feature',geometry=f['geometry'],properties=dict(name=label,sourceUrl=f"https://www.openbible.info/geo/ancient/{d['id']}/{d['url_slug']}",sourceId=role['id'],geometryCredit=role.get('geometry_credit',d.get('geometry_credit','OpenBible.info')),note='现代水系几何作地理参照，不复原圣经时期河道、岸线或水位。')))
water=dict(type='FeatureCollection',metadata=dict(attribution='© OpenStreetMap contributors / OpenBible.info',license='OpenStreetMap-derived geometry: ODbL 1.0; OpenBible metadata: CC BY 4.0',revision=REV),features=features)
(OUT/'ot-waterways.geojson').write_text(json.dumps(water,ensure_ascii=False,separators=(',',':')));print('detailed water features',len(features))
