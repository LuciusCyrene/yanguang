"""Build local cartographic layers. Authoring dependencies: numpy, shapely, Pillow.
Natural Earth 1:10m physical data + Mapzen Terrain Tiles (AWS).
No dependencies are needed by the static website.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
import json, math, urllib.request
import numpy as np
from PIL import Image, ImageFilter
from shapely.geometry import shape, mapping, box
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'dist/data'
CACHE=ROOT/'.cache/geography';CACHE.mkdir(parents=True,exist_ok=True)
BOUNDS=[-7,10,48,54]
area=box(*BOUNDS)
def fetch(url,name):
 p=CACHE/name
 if not p.exists():
  with urllib.request.urlopen(url,timeout=45) as response:p.write_bytes(response.read())
 return p.read_bytes()
def vector(name):
 url=f'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_{name}.geojson'
 data=json.loads(fetch(url,name+'.json'))
 features=[]
 for f in data['features']:
  geom=shape(f['geometry'])
  if not geom.intersects(area):continue
  geom=geom.intersection(area).simplify(.0015,preserve_topology=True)
  if geom.is_empty:continue
  props={k:f['properties'].get(k) for k in ['name','name_en','name_zh','scalerank','featurecla'] if f['properties'].get(k) is not None}
  features.append({'type':'Feature','properties':props,'geometry':mapping(geom)})
 return {'type':'FeatureCollection','features':features}
overview=json.loads(fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson','land-overview.json'))
(OUT/'land-overview.json').write_text(json.dumps(overview,separators=(',',':')))
for name,dest in [('land','land.json'),('rivers_lake_centerlines','rivers.json'),('lakes','lakes.json')]:
 data=vector(name)
 (OUT/dest).write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
 print(dest,len(data['features']),flush=True)
# Stitch Terrarium elevation tiles and compute a shaded elevation raster in Web Mercator.
z=7;n=2**z
def tx(lon):return (lon+180)/360*n
def ty(lat):return (1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*n
west,south,east,north=BOUNDS
x0,x1=math.floor(tx(west)),math.floor(tx(east));y0,y1=math.floor(ty(north)),math.floor(ty(south))
tiles=[(x,y) for x in range(x0,x1+1) for y in range(y0,y1+1)]
def tile(pos):
 x,y=pos
 data=fetch(f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',f'tile-{z}-{x}-{y}.png')
 a=np.asarray(Image.open(BytesIO(data)).convert('RGB'),dtype=np.float32)
 return x,y,a[:,:,0]*256+a[:,:,1]+a[:,:,2]/256-32768
heights=np.zeros(((y1-y0+1)*256,(x1-x0+1)*256),dtype=np.float32)
with ThreadPoolExecutor(max_workers=10) as pool:
 for x,y,a in pool.map(tile,tiles):heights[(y-y0)*256:(y-y0+1)*256,(x-x0)*256:(x-x0+1)*256]=a
print('elevation tiles',len(tiles),flush=True)
left,top=(tx(west)-x0)*256,(ty(north)-y0)*256
right,bottom=(tx(east)-x0)*256,(ty(south)-y0)*256
h=np.asarray(Image.fromarray(heights).crop((left,top,right,bottom)),dtype=np.float32)
# Elevation is in metres; horizontal resolution varies with latitude.
metres_per_pixel=40075016.686*math.cos(math.radians(37))/(n*256)
dy,dx=np.gradient(h,metres_per_pixel)
slope=np.arctan(np.hypot(dx,dy)*2.8)
aspect=np.arctan2(-dx,dy)
light=np.sin(.80)*np.cos(slope)+np.cos(.80)*np.sin(slope)*np.cos(5.5-aspect)
light=np.clip((light-.6)*.8,-.32,.23)
stops=np.array([0,150,400,900,1500,2400,4000,6000])
colors=np.array([[229,231,205],[222,225,193],[218,221,184],[211,213,178],[202,201,167],[187,184,159],[177,173,155],[225,223,205]])
result=np.empty((*h.shape,4),dtype=np.uint8)
for c in range(3):result[:,:,c]=np.clip(np.interp(np.maximum(h,0),stops,colors[:,c])*(1+light),0,255)
edge_x=np.minimum(np.arange(h.shape[1]),np.arange(h.shape[1])[::-1])/55
edge_y=np.minimum(np.arange(h.shape[0]),np.arange(h.shape[0])[::-1])/55
fade=np.minimum(np.minimum(edge_y[:,None],edge_x[None,:]),1)
result[:,:,3]=np.where(h>0,235*fade,0)
Image.fromarray(result).save(OUT/'terrain.webp',quality=88,method=6)
metadata={'bounds':BOUNDS,'projection':'Web Mercator','tileZoom':z,'tileCount':len(tiles),'sources':['https://www.naturalearthdata.com/','https://registry.opendata.aws/terrain-tiles/'],'note':'现代地形高程与海岸，用于地理参照，不是古代地貌复原。'}
(OUT/'geography.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2))
print('terrain',h.shape,'saved',flush=True)
