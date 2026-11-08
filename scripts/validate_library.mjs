import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const dist=new URL('../dist/',import.meta.url),read=f=>readFileSync(new URL(f,dist),'utf8'),data=JSON.parse(read('data/comparison-reader.json'));
const context=vm.createContext({});for(const f of ['world-culture.js','comparison-reader.js','reading-library.js'])vm.runInContext(read(f),context);context.data=data;vm.runInContext('comparisonReaderData=data;',context);
const sections=vm.runInContext('librarySections',context);assert.equal(sections.length,6);assert.equal(new Set(sections.map(s=>s.id)).size,6);for(const s of sections){assert(s.period&&s.title&&s.aim&&s.lead.length>35);assert(s.items.length===4);for(const id of [...s.items,s.next])assert(vm.runInContext(`cultureEntity('${id}')?.id`,context),`${s.id} -> ${id}`);}
assert.equal(data.philosophyReadingPaths.length,3);for(const route of data.philosophyReadingPaths)assert(route.questionIds.every(id=>data.cultureQuestions.some(q=>q.id===id)));
const html=read('index.html');for(const id of ['library-menu','library-culture-nav','library-history-nav','library-index-nav','library-back','library-location','open-reading-library','reader-settings','reader-content'])assert.equal(html.match(new RegExp(`id="${id}"`,'g'))?.length,1,id);
assert(html.indexOf('id="library-menu"')<html.indexOf('id="reader-settings"'));assert(html.indexOf('class="event-narrative"')<html.indexOf('id="event-historical-media"'));assert(html.includes('reading-library.js')&&html.includes('reading-library.css'));assert.equal((html.match(/data-reader-area="/g)||[]).length,3);assert.equal((html.match(/data-culture-mode="tree"/g)||[]).length,1);
assert(!vm.runInContext("cultureModes.some(m=>m[0]==='tree')",context));assert(vm.runInContext("cultureModes.some(m=>m[0]==='overview')",context));
console.log('阅读结构验证通过：三类主入口、导航与检索分离、六段时代导读／24个入口、三条问题路线、原始树独立、先事件正文后文化延伸；所有导读关联可达。');
