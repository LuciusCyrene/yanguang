import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const data=JSON.parse(readFileSync(new URL('../dist/data/atlas.json',import.meta.url)));
const church=data.events.filter(e=>e.module==='church');
assert.equal(church.length,46);assert.equal(data.events.filter(e=>e.module==='acts').length,73);
assert.deepEqual(data.modules.find(m=>m.id==='church').range,[62,451]);
assert(data.routes.filter(r=>r.module==='church').every(r=>r.type==='overview'),'教会史不能默认画成连续旅程');
for(const e of church){
 assert(e.year>=62&&e.year<=451);
 assert(e.narrative.length>=3&&e.narrative.join('').length>=140);
 assert(e.category&&e.certainty&&e.primarySource.url&&e.yearLabel);
 const p=data.places[e.place];assert(p.lon>=-7&&p.lon<=48&&p.lat>=10&&p.lat<=54);
}
for(const year of [64,70,177,250,303,313,325,350,367,380,381,410,431,451])assert(church.some(e=>e.year===year),`关键年代缺少 ${year}`);
assert(church.find(e=>e.place==='vagharshapat').certainty.includes('传统'));
assert(church.find(e=>e.year===451).references.some(r=>r.url.includes('suscopts.org')),'保留非迦克墩传统自述');
const polity=JSON.parse(readFileSync(new URL('../dist/data/politics-church.json',import.meta.url)));
const ctx={};vm.runInNewContext(readFileSync(new URL('../dist/politics.js',import.meta.url),'utf8'),ctx);
const active=y=>polity.features.filter(f=>f.properties.from<=y&&y<=f.properties.to);
for(let year=63;year<=451;year++){
 const features=active(year),keys=features.map(f=>f.properties.key);
 assert.equal(keys.length,new Set(keys).size,`${year} 年出现重叠源时段`);
 assert(keys.includes(year<395?'rome':'east-rome'),`${year} 年罗马政治背景缺失`);
 if(year>=395)assert(keys.includes('west-rome'),`${year} 年西罗马缺失`);
 if(year>=238)assert(keys.includes('sasanian'),`${year} 年萨珊缺失`);
}
const y350=active(350),aksum=data.places.aksum;
assert(y350.some(f=>f.properties.key==='aksum'&&ctx.containsCoordinate(f.geometry,aksum.lon,aksum.lat)),'阿克苏姆独立政治背景');
assert(!y350.some(f=>f.properties.key==='rome'&&ctx.containsCoordinate(f.geometry,aksum.lon,aksum.lat)),'不把阿克苏姆当作罗马省');
assert(active(451).some(f=>f.properties.key==='vandal-kingdom'));
assert.equal(polity.metadata.license,'CC BY 4.0');
const metadata=JSON.parse(readFileSync(new URL('../dist/data/geography.json',import.meta.url)));
assert.deepEqual(metadata.bounds,[-7,10,48,54]);
console.log(`初代教会验证通过：46则纪事、5阶段、${polity.features.length}条分期政治记录；63—451年逐年背景、罗马分治与阿克苏姆独立范围通过。`);
