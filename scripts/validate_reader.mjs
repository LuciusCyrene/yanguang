import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const root=new URL('../dist/',import.meta.url),data=JSON.parse(readFileSync(new URL('data/comparison-reader.json',root))),atlas=JSON.parse(readFileSync(new URL('data/atlas.json',root)));
assert.equal(data.chinaEvents.length,78);assert.equal(data.people.length,71);assert.equal(data.essays.length,8);assert.equal(data.worldEvents.length,76);assert.equal(data.places.length,10);assert.equal(data.terms.length,12);
const ids=new Set();
for(const e of [...data.chinaEvents,...data.worldEvents,...data.people,...data.essays,...data.places,...data.terms]){
 assert(!ids.has(e.id));ids.add(e.id);assert(e.sections.length>=2);assert(e.sections.every(s=>s.title&&s.text.length>=30));
 assert(e.sources.length>0,`source missing: ${e.id}`);
 for(const source of e.sources){if(source.localDocument){assert(source.localDocument.fileName.endsWith('.pdf'));assert(Number.isInteger(source.localDocument.printedPage)&&source.localDocument.pdfPage>0&&source.localDocument.verification);}else assert.equal(new URL(source.url).protocol,'https:');assert(source.title&&source.locator&&source.kind&&source.note);}
 for(const id of [...(e.eventIds||[]),...(e.relatedEventIds||[])])assert(atlas.events.some(e=>e.id===id&&e.module!=='ot'));
}
for(const e of [...data.chinaEvents,...data.worldEvents]){assert(e.year>=30&&e.endYear<=1648&&e.endYear>=e.year);assert(e.people.length&&e.place&&e.topic&&e.dateKind);}
for(const p of data.people)assert(p.activeRange[0]<=p.activeRange[1]&&p.lifeLabel&&p.role);
for(const e of data.essays)assert(e.questions.length>=3&&e.kind.includes('分析'));
for(const site of data.places){assert(site.placeIds.every(id=>atlas.places[id]));assert(site.personIds.every(id=>data.people.some(p=>p.id===id)));assert(site.eventIds.length>0);}
const context=vm.createContext({atlas,moduleOf:e=>e.module||'acts'});
vm.runInContext(readFileSync(new URL('comparison-reader.js',root),'utf8')+'\ncomparisonReaderData='+JSON.stringify(data),context);
const entries=vm.runInContext('readerEvents()',context);assert.equal(entries.length,344);assert.equal(entries.filter(e=>e.side==='china').length,80);
assert.equal(new Set(entries.map(e=>e.id)).size,entries.length);
for(const e of atlas.events.filter(e=>e.module!=='ot'))assert(entries.some(a=>a.eventIds.includes(e.id)),`original node unreachable ${e.id}`);
for(let year=30;year<=1648;year++){
 const selected=vm.runInContext(`readerFilter(readerEvents(),readerBounds(String(readerCentury(${year}))),${year},'')`,context);
 assert(selected.every(e=>e.year<=year&&Math.ceil(e.year/100)===Math.ceil(year/100)));
}
for(let century=1;century<=17;century++){
 const list=vm.runInContext(`readerFilter(readerEvents(),readerBounds('${century}'),1648,'')`,context);
 for(const side of ['west','china'])assert(list.some(e=>e.side===side),`${century} century ${side} missing`);
}
assert(vm.runInContext("readerFilter(readerEvents(),[30,1648],1648,'几何原本')",context).some(e=>e.year===1607));
assert(vm.runInContext("readerFilter(readerEvents(),[30,1648],1648,'','文本与科技')",context).every(e=>e.topic==='文本与科技'));
assert.equal(vm.runInContext("readerFilter(readerEvents(),[30,100],30,'no-such-history')",context).length,0);
console.log(`对照详读验证通过：${entries.length}条可读纪事（264世界／80中国）、71篇人物、8篇专题、10组地点网络、12个术语；全部206历史主节点可达、17世纪双侧覆盖、逐年未来过滤与检索。`);

assert(vm.runInContext("readerEvents().some(e=>e.id==='supp-timothy781'&&e.year===781)",context));
assert(!vm.runInContext("readerFilter(readerEvents(),[701,800],780,'提摩太与马赫迪').length",context));
for(const key of ['events','people','essays','places','terms']){
 const entity=key==='events'?entries[0]:data[key][0];
 const record={version:1,kind:key,id:entity.id,year:800,filters:{period:'all',query:'',topic:'',full:true}};
 assert(vm.runInContext(`validReaderBookmark(${JSON.stringify(record)})`,context));
}
for(const record of [null,{version:2},{version:1,kind:'people',id:'missing'}, {version:1,kind:'events',id:entries[0].id,year:1700,filters:{period:'all',query:'',topic:'',full:false}}])assert(!vm.runInContext(`validReaderBookmark(${JSON.stringify(record)})`,context));
context.localStorage={getItem:()=>{throw Error('storage denied');}};
assert.equal(vm.runInContext('loadReaderBookmark()',context),null);
console.log('补充详目、地点与人物关联、阅读位置校验及存储不可用的降级通过。');
