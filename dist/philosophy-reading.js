'use strict';
let philosophyReadingPath=null;
function philosophyReadingRoutes(){
 const details=historyEl('details',null,'philosophy-routes');details.append(historyEl('summary','循序读：三条哲学问题路线'));
 const grid=historyEl('div',null,'philosophy-routes-grid');for(const path of comparisonReaderData.philosophyReadingPaths||[]){const section=historyEl('section');section.append(historyEl('h4',path.title),historyEl('p',path.description));const list=historyEl('ol');for(const id of path.questionIds){const item=cultureEntity(id),li=historyEl('li'),button=historyEl('button',item.title.split('：')[0]);button.type='button';button.dataset.readingQuestion=id;button.addEventListener('click',()=>{philosophyReadingPath=path.id;focusReaderEntity('culture',id);});li.append(button);list.append(li);}section.append(list);grid.append(section);}details.append(grid);return details;
}
function philosophyTermCards(entry){
 const root=historyEl('div',null,'philosophy-terms');root.setAttribute('aria-label','关键哲学术语');for(const item of entry.keyTerms||[]){const d=historyEl('details');d.append(historyEl('summary',item.term),historyEl('p',item.definition));root.append(d);}return root;
}
function philosophyPositionTable(entry){
 const wrap=historyEl('div',null,'philosophy-positions'),table=historyEl('table');table.append(historyEl('caption','回答方向与适用边界'));const head=historyEl('thead'),tr=historyEl('tr');for(const t of ['立场／作者','怎样回答','需要保留的区别']){const th=historyEl('th',t);th.scope='col';tr.append(th);}head.append(tr);table.append(head);const body=historyEl('tbody');for(const item of entry.positions){const row=historyEl('tr'),name=historyEl('th',item.name);name.scope='row';row.append(name);for(const [label,value] of [['怎样回答',item.claim],['保留区别',item.limit]]){const td=historyEl('td',value);td.dataset.label=label;row.append(td);}body.append(row);}table.append(body);wrap.append(table);return wrap;
}
function philosophyArgument(entry){
 const a=entry.argument,details=historyEl('details',null,'philosophy-argument');details.open=Boolean($('#reader-search').value.trim());details.append(historyEl('summary','论证拆解 · '+a.title),historyEl('p',a.owner,'philosophy-argument-owner'));const list=historyEl('ol');for(const step of a.steps){const li=historyEl('li');li.append(historyEl('strong',step.label),historyEl('p',step.text));list.append(li);}details.append(list,historyEl('small',a.caution));return details;
}
function philosophyQuestionNavigation(entry){
 const path=(comparisonReaderData.philosophyReadingPaths||[]).find(p=>p.id===philosophyReadingPath&&p.questionIds.includes(entry.id)),ids=path?path.questionIds:(comparisonReaderData.cultureQuestions||[]).map(q=>q.id),index=ids.indexOf(entry.id),nav=historyEl('nav',null,'philosophy-question-nav');nav.setAttribute('aria-label','哲学问题连续阅读');nav.append(historyEl('p',(path?path.title:'全部哲学问题')+` · ${index+1}/${ids.length}`));const buttons=historyEl('div');for(const [offset,label] of [[-1,'上一篇'],[1,'下一篇']]){const target=cultureEntity(ids[index+offset]||'');if(!target)continue;const b=historyEl('button',label+' · '+target.title.split('：')[0]);b.type='button';b.dataset.readingStep=String(offset);b.addEventListener('click',()=>focusReaderEntity('culture',target.id));buttons.append(b);}nav.append(buttons);return nav;
}
