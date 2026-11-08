import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const root=new URL('../dist/',import.meta.url),read=f=>readFileSync(new URL(f,root),'utf8');
const atlas=JSON.parse(read('data/philosophy-atlas.json')),reader=JSON.parse(read('data/comparison-reader.json')),tree=JSON.parse(read('data/philosophy-tree.json'));
const context=vm.createContext({philosophyAtlasData:atlas,comparisonReaderData:reader,philosophyTreeData:tree});vm.runInContext(read('philosophy-connections.js'),context);
const relations=vm.runInContext('philosophyConnectionsRelations()',context),people=new Set(atlas.nodes.filter(n=>n.kind==='person').map(n=>n.personId));
const expected=new Set([...reader.cultureRelations,...tree.relations].filter(r=>people.has(r.fromId)&&people.has(r.toId)).map(r=>[r.fromId,r.toId,r.type].join(':')));
assert.equal(relations.length,expected.size);assert.equal(new Set(relations.map(r=>r.id)).size,relations.length);
for(const r of relations){assert(people.has(r.fromId)&&people.has(r.toId));assert(['learning','translation','reception','critique','context'].includes(r.type));assert(r.title&&r.summary&&r.sources.length);assert(r.sources.every(s=>(s.url?.startsWith('https://')||s.localDocument?.fileName)&&s.locator));}
for(const id of people){
 context.personId=id;const found=vm.runInContext('philosophyConnectionsFor(personId)',context);assert(found.every(r=>r.fromId===id||r.toId===id));
 const works=vm.runInContext('philosophyConnectionWorks(personId)',context);assert(works.every(n=>n.kind==='work'&&n.personIds.includes(id)));
}
assert.equal(vm.runInContext("philosophyConnectionsFor('kant').length",context),4);assert.equal(vm.runInContext("philosophyConnectionWorks('kant').length",context),4);
vm.runInContext("philosophyConnectionsType='critique'",context);assert.equal(vm.runInContext("philosophyConnectionsFor('kant').length",context),1);
const apology=reader.cultureWorks.find(n=>n.id==='work-apology');assert(apology.personIds.includes('socrates')&&apology.personIds.includes('plato'));assert(apology.attribution.includes('作者：柏拉图'));
const html=read('index.html');for(const id of ['philosophy-connections-panel','philosophy-overview-connections','philosophy-overview-search-prev','philosophy-overview-search-next','philosophy-overview-search-position','philosophy-overview-locate'])assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1);
console.log(`全图关系验证通过：${people.size}人物／${relations.length}条去重思想联系；全部端点、分类、出处、人物相关文本与角色归属、康德版本及类型筛选通过。`);
