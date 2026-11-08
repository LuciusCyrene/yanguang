import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const data = JSON.parse(readFileSync(new URL('../dist/data/atlas.json',import.meta.url)));
const chapterLengths=JSON.parse(readFileSync(new URL('./acts_chapter_lengths.json',import.meta.url))).lengths;
const ids=new Set(),routes=new Set(data.routes.map(r=>r.id));
for(const e of data.events){
 assert(!ids.has(e.id),`事件重复: ${e.id}`);ids.add(e.id);
 assert(routes.has(e.route),`无效阶段: ${e.id}`);
 assert(data.places[e.place],`无效地点: ${e.id}`);
 assert(e.people.length&&e.title&&e.summary&&e.ref,`事件缺字段: ${e.id}`);
 assert(e.narrative?.length>=3&&e.narrative.every(p=>p.length>=20),`详述不完整: ${e.id}`);
 assert(e.narrative.join('').length>=140,`详述过短: ${e.id}`);
 assert(['context','sea','land','drift'].includes(e.arrivalMode),`交通方式缺失: ${e.id}`);
 if(e.module!=='acts'){
  assert(e.category&&e.certainty&&e.yearLabel,`教会史主题或证据标注缺失: ${e.id}`);
  assert(e.primarySource?.url.startsWith('https://'),`史料来源缺失: ${e.id}`);
  for(const c of e.connections||[])assert(data.places[c.from]&&data.places[c.to]&&c.kind&&c.label,`文献联系无效: ${e.id}`);
 }else{
  assert(/^[\d:–]+$/.test(e.ref),`无效章节: ${e.ref}`);
  assert(e.primarySource?.url.startsWith('https://www.biblegateway.com/'),`经文来源缺失: ${e.id}`);
  const [start,end]=e.ref.split('–');const [chapter,verse]=start.split(':').map(Number);
  assert(chapter>=1&&chapter<=28,`章节超出全书: ${e.id}`);
  if(verse)assert(verse<=chapterLengths[chapter-1],`起始节数超出: ${e.id}`);
  if(end){const parts=end.split(':').map(Number);const endChapter=parts.length===2?parts[0]:verse?chapter:parts[0];const endVerse=parts.length===2?parts[1]:verse?parts[0]:null;assert(endChapter>=chapter&&endChapter<=28,`结束章节超出: ${e.id}`);if(endVerse)assert(endVerse<=chapterLengths[endChapter-1],`结束节数超出: ${e.id}`);}
 }
 const r=data.routes.find(r=>r.id===e.route);
 const position=e.module==='ot'?e.position:e.year;assert(position>=r.range[0]&&position<=r.range[1],`年份/阅读位置超出阶段: ${e.id}`);
}
for(const [key,p] of Object.entries(data.places)){
 assert(p.lon>=-180&&p.lon<=180&&p.lat>=-90&&p.lat<=90,`坐标无效: ${key}`);
 assert(p.context?.length>=30&&p.region,`地点背景缺失: ${key}`);
 assert(p.name&&p.english&&p.modern,`地点缺字段: ${key}`);
}
for(const r of data.routes){
 const events=data.events.filter(e=>e.route===r.id);
 assert(events.length>1,`空阶段: ${r.id}`);
 for(let i=1;i<events.length;i++)assert((r.module==='ot'?events[i].position:events[i].year)>=(r.module==='ot'?events[i-1].position:events[i-1].year),`阶段位置倒序: ${r.id}`);
}
const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8')+readFileSync(new URL('../dist/politics.js',import.meta.url),'utf8')+readFileSync(new URL('../dist/modules.js',import.meta.url),'utf8')+readFileSync(new URL('../dist/timeline.js',import.meta.url),'utf8')+readFileSync(new URL('../dist/comparison.js',import.meta.url),'utf8')+readFileSync(new URL('../dist/research.js',import.meta.url),'utf8')+readFileSync(new URL('../dist/ot-map.js',import.meta.url),'utf8');
const generatedIds=new Set([...app.matchAll(/id:\s*'([\w-]+)'/g)].map(m=>m[1]));
for(const [,id] of app.matchAll(/\$\('#([\w-]+)'\)/g))assert(html.includes(`id="${id}"`)||generatedIds.has(id),`界面元素缺失: ${id}`);
const land=JSON.parse(readFileSync(new URL('../dist/data/land.json',import.meta.url)));
assert(land.features.length>0,'底图缺失');
for(const layer of ['rivers','lakes'])assert(JSON.parse(readFileSync(new URL(`../dist/data/${layer}.json`,import.meta.url))).features.length>0,`${layer} 缺失`);
assert(readFileSync(new URL('../dist/data/terrain.webp',import.meta.url)).length>10000,'地形栅格缺失');
const landPoints=JSON.stringify(land).match(/\d+\.\d+/g).length;
assert(landPoints>20000,'精细海岸数据点数不足');
console.log(`通过：${data.routes.length} 个阶段，${data.events.length} 则纪事，${Object.keys(data.places).length} 个地点；年代、引用、坐标、界面绑定与底图数据完整。`);
