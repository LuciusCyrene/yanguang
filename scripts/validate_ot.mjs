import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=name=>readFileSync(new URL(`../${name}`,import.meta.url),'utf8');
const atlas=JSON.parse(read('dist/data/atlas.json')),events=atlas.events.filter(e=>e.module==='ot');
const canonical=['joshua','judges','samuel','kings','isaiah','jeremiah','ezekiel','hosea','joel','amos','obadiah','jonah','micah','nahum','habakkuk','zephaniah','haggai','zechariah','malachi'];
assert.deepEqual(atlas.otBooks.map(b=>b.id),canonical);assert.equal(events.length,69);
assert.deepEqual(atlas.modules.find(m=>m.id==='ot').range,[1,69]);
assert.equal(atlas.modules.find(m=>m.id==='ot').timelineBasis,'scripture-order');
assert.equal(atlas.otBooks.filter(b=>b.section==='十二先知书').length,12);
const chapters={'Joshua':24,'Judges':21,'1 Samuel':31,'2 Samuel':24,'1 Kings':22,'2 Kings':25,'Isaiah':66,'Jeremiah':52,'Ezekiel':48,'Hosea':14,'Joel':3,'Amos':9,'Obadiah':1,'Jonah':4,'Micah':7,'Nahum':3,'Habakkuk':3,'Zephaniah':3,'Haggai':2,'Zechariah':14,'Malachi':4};
for(const [i,e] of events.entries()){
 assert.equal(e.position,i+1);assert.equal(e.year,null,'进度号不可伪装为公历年');
 assert(e.narrative.length===3&&e.narrative.join('').length>=140);
 assert(e.narrativeHeadings.length===3&&e.storyKind&&e.dateEvidence.kind);
 const url=new URL(e.primarySource.url);assert.equal(url.searchParams.get('search'),e.bibleBook+' '+e.chapters);assert.equal(url.searchParams.get('version'),'CUVS');
 const span=e.chapters.split('-'),start=Number(span[0].split(':')[0]),end=span[1]?.includes(':')?Number(span[1].split(':')[0]):span[0].includes(':')?start:Number(span[1]||start);
 assert(start>=1&&end>=start&&end<=chapters[e.bibleBook],`中文章号无效 ${e.ref}`);
 if(e.bibleBook==='Obadiah'){const startVerse=Number(span[0].split(':')[1]),endVerse=Number(span[1]);assert(startVerse>=1&&endVerse>=startVerse&&endVerse<=21);}
 const p=atlas.places[e.place];assert(e.place.startsWith('ot-')&&p.otContext?.length>=30);
 assert(e.connections.every(c=>atlas.places[c.from]&&atlas.places[c.to]&&c.kind));
}
for(const b of atlas.otBooks){const own=events.filter(e=>e.book===b.id);assert(own.length>=2);assert.deepEqual(b.range,[own[0].position,own.at(-1).position]);assert(atlas.routes.find(r=>r.id===b.route).type==='overview');}
assert(events.find(e=>e.book==='jonah').narrative.join('').includes('不补画'));
assert(events.some(e=>e.book==='ezekiel'&&e.connections.some(c=>c.kind.includes('异象'))));
const context={atlas,state:{module:'ot',event:'ot-001',route:'ot-joshua',year:1,comparison:false},stop(){},current(){return events.find(e=>e.id===context.state.event);},route(){return atlas.routes.find(r=>r.id===context.state.route);},selectEvent(id,fit,position){const e=events.find(e=>e.id===id);Object.assign(context.state,{event:id,route:e.route,year:position??e.position});}};
vm.createContext(context);vm.runInContext(read('dist/modules.js')+'\n'+read('dist/politics.js'),context);
for(let position=1;position<=69;position++){context.browseYear(position);assert.equal(context.current().position,position);assert.equal(context.state.year,position);}
assert.equal(vm.runInContext('comparisonEvents().length',context),206,'旧约不混入中国历史对照');
assert.equal(vm.runInContext('comparisonEvents().some(e=>e.module===\'ot\')',context),false);
console.log('旧约验证通过：希伯来目录19个阅读单位、69个节点、28处专用地点；中文章号、经文进度、异象标注及对照隔离通过。');

const gazetteer=JSON.parse(read('dist/data/ot-gazetteer.json')),terrain=JSON.parse(read('dist/data/ot-terrain.json')),water=JSON.parse(read('dist/data/ot-waterways.geojson'));
assert(gazetteer.sites.length>=80);assert.equal(gazetteer.metadata.revision.length,40);assert(gazetteer.metadata.attribution.includes('OpenStreetMap'));
for(const site of gazetteer.sites){assert(site.sourceUrl.startsWith('https://www.openbible.info/geo/ancient/'));assert(site.references.length>0);assert(site.candidates.length>0);assert(site.references.every(r=>!['Matt','Mark','Luke','John','Acts'].includes(r.book)));assert(site.candidates.every(c=>Number.isFinite(c.lon)&&Number.isFinite(c.lat)));}
assert.equal(terrain.tileZoom,10);assert(terrain.width>=2000&&terrain.height>=2000&&terrain.groundResolutionMetres<150);assert(readFileSync(new URL('../dist/data/ot-terrain.webp',import.meta.url)).length>100000);
assert.equal(water.features.length,6);assert(water.metadata.license.includes('ODbL'));assert(water.features.every(f=>f.properties.sourceUrl&&f.properties.note.includes('现代')));
assert(water.features.some(f=>f.properties.name==='约旦河'&&JSON.stringify(f.geometry).length>10000));
console.log(`旧约细图验证通过：${gazetteer.sites.length}处地名与候选、6组详细水系、Zoom 10地形及来源许可。`);
