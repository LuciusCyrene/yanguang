import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const root=new URL('../dist/',import.meta.url),data=JSON.parse(readFileSync(new URL('data/comparison-reader.json',root))),atlas=JSON.parse(readFileSync(new URL('data/atlas.json',root)));
assert.equal(data.cultureEvents.length,56);assert.equal(data.culturePrehistory.length,13);assert.equal(data.cultureTraditions.length,8);assert.equal(data.cultureImages.length,6);
const entries=[...data.cultureEvents,...data.culturePrehistory,...data.cultureTraditions,...data.cultureQuestions],ids=new Set(entries.map(e=>e.id));assert.equal(ids.size,87);
for(const e of entries){assert(e.sections.length>=4&&e.sections.every(s=>s.text.length>=30));assert(e.sources.length>0);for(const s of e.sources)assert(s.localDocument?s.localDocument.verification&&s.localDocument.pdfPage>0:new URL(s.url).protocol==='https:');}
for(const e of data.cultureEvents){assert(e.year>=30&&e.endYear<=1648&&e.endYear>=e.year);assert(Math.abs(e.coordinates.lon)<=180&&Math.abs(e.coordinates.lat)<=90);assert(data.worldEvents.some(x=>x.id===e.id));for(const id of e.eventIds)assert(atlas.events.some(x=>x.id===id&&x.year===e.year));if(e.imageId)assert(data.cultureImages.some(i=>i.id===e.imageId));}
for(const e of data.culturePrehistory){assert(e.year<0&&e.endYear<0);assert(!data.worldEvents.some(x=>x.id===e.id));}
for(const p of data.people)for(const id of p.cultureIds)assert(ids.has(id),`${p.id}: ${id}`);
for(const e of data.cultureTraditions)for(const id of e.relatedCultureIds)assert(ids.has(id));
for(const i of data.cultureImages){assert(i.credit&&i.license&&i.licenseUrl&&i.imageSource&&i.caption);assert.equal(createHash('sha256').update(readFileSync(new URL(i.image,root))).digest('hex'),i.sha256);}
const context=vm.createContext({atlas,moduleOf:e=>e.module||'acts'});vm.runInContext(readFileSync(new URL('world-culture.js',root),'utf8')+'\n'+readFileSync(new URL('comparison-reader.js',root),'utf8')+'\ncomparisonReaderData='+JSON.stringify(data),context);
for(let year=30;year<=1648;year++){assert.equal(data.cultureContexts.filter(c=>c.range[0]<=year&&year<=c.range[1]).length,1);assert(vm.runInContext(`cultureMapEntries(${year}).every(e=>e.year<=${year})`,context));}
for(const e of entries){assert(vm.runInContext(`cultureEntity('${e.id}').id==='${e.id}'`,context));assert(vm.runInContext(`validReaderBookmark(${JSON.stringify({version:1,kind:'culture',id:e.id,year:800,filters:{period:'all',query:'',topic:'',full:true}})})`,context));}
assert.equal(vm.runInContext("cultureYear(-399)",context),'公元前399年');
console.log('世界文化验证通过：56纪事、13前史、8传统、10问题、6本地署名图像；年代、来源、人物关系、图像哈希、1619年地图过滤及前史隔离。');
