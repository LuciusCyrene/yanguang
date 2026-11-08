import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>JSON.parse(readFileSync(new URL(`../dist/data/${name}.json`,import.meta.url)));
const data=read('atlas'),events=data.events.filter(e=>e.module==='world'),politics=read('politics-world');
assert.equal(events.length,87);assert.deepEqual(data.modules.find(m=>m.id==='world').range,[452,1648]);
assert.equal(data.routes.filter(r=>r.module==='world').length,6);
for(const e of events){
 assert(e.year>=452&&e.year<=1648&&e.sourceType&&e.certainty&&e.yearLabel);
 assert(e.narrative.length>=3&&e.narrative.join('').length>=140);
 assert(data.routes.find(r=>r.id===e.route).type==='overview');
 assert(e.primarySource.url.startsWith('https://'));
}
for(const y of [530,635,781,800,988,1054,1095,1204,1415,1453,1491,1517,1521,1527,1530,1534,1545,1549,1555,1563,1597,1599,1601,1614,1618,1632,1648])assert(events.some(e=>e.year===y),`缺关键年代${y}`);
assert(events.find(e=>e.year===1054).narrative.join('').includes('并未使所有'));
assert(events.find(e=>e.year===1517).narrative.join('').includes('钉门'));
assert(events.some(e=>data.places[e.place].lon>0&&data.places[e.place].lat<0),'非洲南半球节点');
assert(events.some(e=>data.places[e.place].lon<-90),'美洲节点');assert(events.some(e=>data.places[e.place].lon>125),'日本节点');
assert.equal(events.find(e=>e.title.startsWith('殖民传教')).place,'valladolid','辩论不误放到美洲');
assert(data.places.damascus.context.includes('扫罗')||data.places.damascus.context.includes('保罗'),'使徒行传地点背景保留');
assert.equal(politics.metadata.license,'CC BY 4.0');
for(let y=452;y<=1648;y++){
 const active=politics.features.filter(f=>f.properties.from<=y&&f.properties.to>=y),keys=active.map(f=>f.properties.key);
 assert(active.length>0,`政权年份缺失${y}`);
 assert.equal(keys.length,new Set(keys).size,`同键时段重叠${y}`);
}
const active=y=>politics.features.filter(f=>f.properties.from<=y&&f.properties.to>=y);
assert(active(635).some(f=>f.properties.name==='唐'));
assert(active(1517).some(f=>f.properties.name==='神圣罗马帝国'));
assert(active(1601).some(f=>f.properties.name==='明'));
assert(active(1601).some(f=>f.properties.name==='奥斯曼帝国'));
assert(!active(1517).some(f=>f.properties.name==='拜占庭帝国'),'不延用已结束政权');
console.log(`世界教会史验证通过：${events.length}则纪事、6阶段、${politics.features.length}条政治记录；452—1648年逐年覆盖、跨洲地点与原篇章背景通过。`);
