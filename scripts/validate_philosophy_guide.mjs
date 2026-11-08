import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const root=new URL('../dist/',import.meta.url),read=f=>readFileSync(new URL(f,root),'utf8'),atlas=JSON.parse(read('data/philosophy-atlas.json')),guide=JSON.parse(read('data/philosophy-guide.json'));
const people=atlas.nodes.filter(n=>n.kind==='person'),groups=guide.groups,ids=groups.flatMap(g=>g.personIds);
assert.equal(groups.length,15);assert.equal(ids.length,43);assert.equal(new Set(ids).size,43);assert.deepEqual(new Set(ids),new Set(people.map(n=>n.personId)));assert.deepEqual(new Set(Object.keys(guide.questions)),new Set(ids));
for(const phase of atlas.phases)assert(groups.some(g=>g.phaseId===phase.id));
for(const group of groups){assert(group.title&&group.intro);assert(atlas.phases.some(p=>p.id===group.phaseId));for(const id of group.personIds)assert(people.some(n=>n.personId===id&&n.phaseId===group.phaseId));for(const id of group.alsoPersonIds)assert(ids.includes(id)&&!group.personIds.includes(id));for(const id of group.entryIds)assert(atlas.nodes.some(n=>n.id===id&&n.kind==='event'));}
assert(guide.sources.every(s=>s.url.startsWith('https://plato.stanford.edu/')&&s.locator));assert(groups.find(g=>g.id==='rationalism').personIds.includes('spinoza'));assert(groups.find(g=>g.id==='knowledge').alsoPersonIds.includes('locke'));
const reachable=new Set([...people.map(n=>n.id),...atlas.nodes.filter(n=>n.kind==='event').map(n=>n.id)]);for(const work of atlas.nodes.filter(n=>n.kind==='work')){assert(work.personIds.some(id=>ids.includes(id)),work.id);reachable.add(work.id);}assert.equal(reachable.size,151);
const context=vm.createContext({philosophyAtlasData:atlas});vm.runInContext(read('philosophy-guide.js'),context);context.guide=guide;vm.runInContext('philosophyGuideData=guide;',context);assert.equal(vm.runInContext("guidePersonNode('kant').id",context),'ph-person-kant');assert.equal(vm.runInContext("guideGroupsFor('locke').length",context),2);assert.equal(vm.runInContext("guidePersonNode('not-a-person')",context),undefined);
const html=read('index.html');for(const id of ['philosophy-guide','philosophy-guide-eras','philosophy-guide-content','philosophy-guide-range','philosophy-guide-search','philosophy-person-dialog','philosophy-person-content'])assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1);
assert.equal((html.match(/data-philosophy-view="/g)||[]).length,3);assert(html.includes('data-philosophy-view="guide"'));assert(read('philosophy-overview.js').includes("let philosophyView='guide'"));
console.log('可读哲学主页验证通过：9时代／15系列／43人物唯一主卡片、4交叉入口、39著作及69纪事全部可达；分类说明与来源、默认三模式及无效人物拒绝通过。');

assert.equal(vm.runInContext("guideMatchingWorks('纯粹理性批判').length",context),2);
assert.equal(vm.runInContext("guideMatchingWorks('康德').length",context),4);
assert.equal(vm.runInContext("guideMatchingWorks('申辩篇').length",context),1);
assert(vm.runInContext("guideTextMatches('自由 知识',['自由与知识'])",context));
assert(vm.runInContext("validGuideSnapshot({id:'kant',tab:'relations',scroll:100,details:[0,2]})",context));
for(const bad of ["{id:'missing',tab:'profile',scroll:0,details:[]}","{id:'kant',tab:'missing',scroll:0,details:[]}","{id:'kant',tab:'profile',scroll:-1,details:[]}","{id:'kant',tab:'profile',scroll:0,details:[-1]}"]){assert(!vm.runInContext('validGuideSnapshot('+bad+')',context));}
assert(vm.runInContext("validGuideReading({version:1,query:'康德',era:'german',offset:20,person:{id:'kant',tab:'works',scroll:10,details:[]}})",context));
for(const bad of ["{version:2,query:'',era:'german',offset:0,person:null}","{version:1,query:'',era:'missing',offset:0,person:null}","{version:1,query:'',era:'german',offset:-1,person:null}","{version:1,query:'x'.repeat(201),era:'german',offset:0,person:null}"]){assert(!vm.runInContext('validGuideReading('+bad+')',context));}
console.log('阅读衔接验证通过：书名与人物关联检索、版本去重、多词匹配、人物栏目快照和本机阅读位置校验。');

for(const id of ids){context.personId=id;const position=vm.runInContext('guideSeriesNeighbors(personId)',context);assert(position&&position.group.personIds[position.index]===id);if(position.next){context.nextId=position.next;assert.equal(vm.runInContext('guideSeriesNeighbors(nextId).previous',context),id);}if(position.previous){context.previousId=position.previous;assert.equal(vm.runInContext('guideSeriesNeighbors(previousId).next',context),id);}}
assert.equal(vm.runInContext("guideSeriesNeighbors('rousseau').next",context),null);assert.equal(vm.runInContext("guideSeriesNeighbors('rousseau').previous",context),null);assert.equal(vm.runInContext("guideSeriesNeighbors('kant').next",context),'fichte');assert.equal(vm.runInContext("guideSeriesNeighbors('hegel').next",context),null);
for(const id of ['spinoza','locke','hume','kant','fichte','schelling','hegel']){const person=people.find(n=>n.personId===id);assert.equal(person.sections.length,4);assert(person.sections.every(s=>s.title&&s.text.length>=40));assert(person.sources.some(s=>s.accessed==='2026-11-08'&&s.locator&&s.url.startsWith('https://plato.stanford.edu/')));}
console.log('人物深化与连续阅读验证通过：七人物各四节导读及来源、43人物主系列的边界与前后互逆。');

for(const person of people){context.person=person;const events=vm.runInContext('guideContextEvents(person)',context);assert(events.length<=4);assert.equal(new Set(events.map(e=>e.id)).size,events.length);assert(events.every(e=>e.kind==='event'&&e.anchor>=person.range[0]&&e.anchor<=person.range[1]));assert.deepEqual(events.map(e=>e.anchor),events.map(e=>e.anchor).sort((a,b)=>a-b));}
assert(people.some(person=>{context.person=person;return vm.runInContext('guideContextEvents(person).length>0',context);}));
console.log('人物时代背景验证通过：仅复用既有纪事、限于人物所列日期、最多四条且按年排列。');
