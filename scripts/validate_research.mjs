import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync(new URL('../dist/data/atlas.json',import.meta.url)));
const world=data.events.filter(e=>e.module==='world'),event=id=>data.events.find(e=>e.id===id);
for(const [prefix,count] of [['acts',73],['church',46],['world',76]])for(let n=1;n<=count;n++)assert(event(`${prefix}-${String(n).padStart(3,'0')}`),'旧分享链接须保留');
for(const e of data.events){
 assert(e.narrativeHeadings.length===e.narrative.length,`分段标题缺失 ${e.id}`);
 const d=e.dateEvidence;if(e.module==='ot'){assert.equal(e.year,null);assert(d.kind&&d.note);}else assert(Number.isInteger(d.fromYear)&&Number.isInteger(d.toYear)&&d.fromYear<=e.year&&d.toYear>=e.year&&d.kind&&d.note,`年代证据范围错误 ${e.id}`);
 assert(e.citations.length>0);
 for(const c of e.citations){
  for(const k of ['title','author','edition','locator','kind','url','status','note'])assert(c[k],`出处缺字段 ${e.id} ${k}`);
  assert.equal(new URL(c.url).protocol,'https:');
 }
}
const added=world.filter(e=>Number(e.id.slice(6))>=77);assert.equal(added.length,11);
for(const e of added){assert(e.chinaRelated);assert(e.citations.every(c=>c.status==='已核对关键段落'));assert(e.narrative.length===4);}
assert.equal(event('world-081').year,1582);assert.equal(event('world-081').place,'macau');
assert.equal(event('world-082').year,1583);assert.equal(event('world-082').place,'zhaoqing');
assert.equal(event('world-084').year,1607);assert(event('world-084').title.includes('前六卷'));
assert.equal(event('world-085').year,1616);assert.equal(event('world-085').place,'nanjing');
assert.equal(event('world-080').year,1307);assert(event('world-080').title.includes('任命'));
assert.equal(event('world-086').dateEvidence.toYear,1645);assert.equal(event('world-086').year,1644);
assert(!world.some(e=>e.year>1648));
for(let year=30;year<=1648;year++){
 const active=data.chinaContexts.filter(c=>c.range[0]<=year&&year<=c.range[1]);assert.equal(active.length,1,`中国教会背景缺失/重叠 ${year}`);
 assert(active[0].church&&active[0].culture&&active[0].question&&active[0].interpretation);
}
assert.deepEqual(data.comparisonRange,[30,1648]);
assert(data.chinaContexts.some(c=>c.range[0]===30));
assert(data.chinaContexts.some(c=>c.range[1]===451));
assert(data.chinaContexts.find(c=>c.range[0]<=637&&c.range[1]>=637).church.includes('635'));
assert(data.chinaContexts.find(c=>c.range[0]===638).church.includes('638'));
assert(data.chinaContexts.find(c=>c.range[0]===845).church.includes('845'));
assert(data.localReading.every(b=>b.status.includes('待')),'抽查书籍不冒充逐页证据');
assert.equal(data.reformTraditions.length,5);
for(const t of data.reformTraditions){assert(t.eventIds.length>0);assert(t.eventIds.every(id=>event(id)?.module==='world'));}
console.log(`来源与比较阅读验证通过：${data.events.length}条结构化出处、11个新节点、${data.chinaContexts.length}段逐年覆盖、5种改革路线与原ID保留。`);
