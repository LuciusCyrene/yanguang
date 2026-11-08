import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const root=new URL('../dist/',import.meta.url),data=JSON.parse(readFileSync(new URL('data/historical-media.json',root))),atlas=JSON.parse(readFileSync(new URL('data/atlas.json',root)));
assert(data.cards.length>=20);
const ids=new Set();
for(const c of data.cards){
 assert(!ids.has(c.id));ids.add(c.id);
 for(const field of ['title','person','imageKind','caption','summary','credit','license','licenseUrl','historySource','imageSource','image','sha256'])assert(c[field],`${c.id}: ${field}`);
 for(const field of ['imageSource','historySource','licenseUrl'])assert.equal(new URL(c[field]).protocol,'https:');
 const image=new URL(c.image,root);assert(existsSync(image));assert.equal(createHash('sha256').update(readFileSync(image)).digest('hex'),c.sha256);
 assert(c.facts.every((f,i)=>Number.isInteger(f.year)&&f.year<=c.range[1]&&(!i||f.year>=c.facts[i-1].year)));
 for(const f of c.facts){if(!f.eventId)continue;const e=atlas.events.find(e=>e.id===f.eventId);assert(e,`${c.id}: ${f.eventId}`);assert.equal(e.year,f.year,`${c.id}: related event date`);assert.notEqual(e.module,'ot');}
}
const context=vm.createContext({});vm.runInContext(readFileSync(new URL('historical-media.js',root),'utf8')+'\nhistoricalMediaData='+JSON.stringify(data),context);
for(let year=30;year<=1648;year++)for(const side of ['west','china']){
 assert.equal(data.cards.filter(c=>c.side===side&&c.range[0]<=year&&c.range[1]>=year).length,1,`${side}: ${year}`);
 const card=vm.runInContext(`historicalCardFor('${side}',${year})`,context);
 const facts=vm.runInContext(`historicalFactsFor(historicalCardFor('${side}',${year}),${year})`,context);
 assert(card&&facts.every(f=>f.year<=year),`future content ${side}: ${year}`);
}
console.log(`图文验证通过：${data.cards.length}张卡片、${new Set(data.cards.map(c=>c.image)).size}幅本地图像、30—1648年逐年双侧覆盖、图像校验和及关联节点年份一致。`);
