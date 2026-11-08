"""Build detailed offline Canaan relief (z10), independent of the existing atlas layers."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
import json,math,urllib.request,time
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'dist/data';CACHE=ROOT/'.cache/ot-geography';CACHE.mkdir(parents=True,exist_ok=True)
BOUNDS=[33.8,30.7,36.8,33.6];z=10;n=2**z

def fetch(url,name):
 p=CACHE/name
 if not p.exists():
  for attempt in range(3):
   try:
    p.write_bytes(urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'BiblicalAtlasResearch/1.0'}),timeout=45).read());break
   except Exception:
    if attempt==2:raise
    time.sleep(1)
 return p.read_bytes()
def tx(lon):return (lon+180)/360*n
def ty(lat):return (1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*n
west,south,east,north=BOUNDS;x0,x1=math.floor(tx(west)),math.floor(tx(east));y0,y1=math.floor(ty(north)),math.floor(ty(south))
positions=[(x,y) for x in range(x0,x1+1) for y in range(y0,y1+1)]
heights=np.empty(((y1-y0+1)*256,(x1-x0+1)*256),dtype=np.float32)
def tile(pos):
 x,y=pos;raw=fetch(f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',f'elevation-{z}-{x}-{y}.png')
 a=np.asarray(Image.open(BytesIO(raw)).convert('RGB'),dtype=np.float32);return x,y,a[:,:,0]*256+a[:,:,1]+a[:,:,2]/256-32768
with ThreadPoolExecutor(max_workers=8) as pool:
 for x,y,a in pool.map(tile,positions):heights[(y-y0)*256:(y-y0+1)*256,(x-x0)*256:(x-x0+1)*256]=a
h=np.asarray(Image.fromarray(heights).crop(((tx(west)-x0)*256,(ty(north)-y0)*256,(tx(east)-x0)*256,(ty(south)-y0)*256)))
resolution=40075016.686*math.cos(math.radians((north+south)/2))/(n*256)
dy,dx=np.gradient(h,resolution);slope=np.arctan(np.hypot(dx,dy)*1.5);aspect=np.arctan2(-dx,dy)
light=np.sin(.85)*np.cos(slope)+np.cos(.85)*np.sin(slope)*np.cos(5.5-aspect);light=np.clip((light-.65)*.7,-.35,.18)
stops=np.array([-450,-200,0,150,400,800,1200,1800,2800]);colors=np.array([[232,217,181],[235,222,188],[231,225,195],[220,222,188],[207,216,177],[197,207,168],[191,196,161],[180,182,156],[206,204,183]])
a=np.empty((*h.shape,4),dtype=np.uint8)
for c in range(3):a[:,:,c]=np.clip(np.interp(h,stops,colors[:,c])*(1+light),0,255)
fade=np.minimum(np.minimum(np.minimum(np.arange(h.shape[0]),np.arange(h.shape[0])[::-1])[:,None]/30,np.minimum(np.arange(h.shape[1]),np.arange(h.shape[1])[::-1])[None,:]/30),1)
a[:,:,3]=255*fade
Image.fromarray(a).save(OUT/'ot-terrain.webp',quality=92,method=6)
meta=dict(bounds=BOUNDS,tileZoom=z,tileCount=len(positions),width=h.shape[1],height=h.shape[0],groundResolutionMetres=round(resolution),image='data/ot-terrain.webp',note='现代高程晕渲，供辨认山地、河谷与海岸；不等于古代地貌复原。',sources=['https://registry.opendata.aws/terrain-tiles/','https://github.com/tilezen/joerd/blob/master/docs/attribution.md'])
(OUT/'ot-terrain.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2));print(json.dumps(meta,ensure_ascii=False))
