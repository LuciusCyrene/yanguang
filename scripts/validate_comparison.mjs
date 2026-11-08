import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=name=>readFileSync(new URL(`../${name}`,import.meta.url),'utf8');
const atlas=JSON.parse(read('dist/data/atlas.json'));
const context={atlas,state:{module:'world',event:'world-084',route:'confessional-world',year:1607,comparison:true},stop(){},selectEvent(id,fit,year){const e=atlas.events.find(e=>e.id===id);Object.assign(context.state,{event:id,route:e.route,module:e.module,year});},current(){return atlas.events.find(e=>e.id===context.state.event);},route(){return atlas.routes.find(r=>r.id===context.state.route);}};
vm.createContext(context);
vm.runInContext(read('dist/modules.js')+'\n'+read('dist/politics.js'),context);
for(let year=30;year<=1648;year++){
 context.browseYear(year);
 assert.equal(context.state.year,year,`跨篇章不能截断年份 ${year}`);
 assert(context.current().year<=year,`不得选择未来纪事 ${year}`);
 assert(atlas.chinaContexts.some(c=>c.range[0]<=year&&c.range[1]>=year),`对照背景缺失 ${year}`);
}
for(const [year,id] of [[50,'acts-'],[63,'church-'],[325,'church-'],[451,'church-'],[452,'church-'],[494,'world-'],[1607,'world-']]){
 context.browseYear(year);assert(context.state.event.startsWith(id),`纪事篇章选择错误 ${year}`);
}
context.browseYear(452);assert.equal(context.current().year,451,'452年显示此前451年纪事，不能提前显示494年');
context.state.comparison=false;
for(const [module,input,expected] of [['acts',325,62],['church',30,62],['church',1648,451],['world',30,452]]){
 context.state.module=module;context.browseYear(input);assert.equal(context.state.year,expected,`单图保持篇章范围 ${module}`);
}
console.log('全时段对照验证通过：30—1648年逐年跨篇章、此前纪事选择与单图范围回归。');
