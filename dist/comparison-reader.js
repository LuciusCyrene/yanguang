'use strict';
let comparisonReaderData={chinaEvents:[],worldEvents:[],people:[],essays:[],places:[],terms:[]};
let readerBookmark=null;
let readerTab='events',readerYear=30;
function readerCentury(year){return Math.ceil(year/100);}
function readerBounds(period){if(period==='all')return [30,1648];const century=Number(period);return [Math.max(30,(century-1)*100+1),Math.min(1648,century*100)];}
function readerTopic(event){
 const s=event.category||'';
 if(moduleOf(event)==='acts')return '经文与群体';
 if(/翻译|印刷|经典|文本/.test(s))return '文本与科技';
 if(/会议|神学|教义|修道|迫害|信仰/.test(s))return '宗教与思想';
 return '教会与交流';
}
function readerAtlasEntry(e){return {id:e.id,eventIds:[e.id],year:e.year,endYear:e.dateEvidence?.toYear||e.year,side:e.chinaRelated?'china':'west',title:e.title,summary:e.summary,place:atlas.places[e.place].name,people:e.people,topic:readerTopic(e),dateKind:e.dateEvidence?.kind||'推定编年',sections:e.narrative.map((text,i)=>({title:e.narrativeHeadings[i]||'补充说明',text})),citations:e.citations,sources:[]};}
function readerEvents(){
 const linked=new Set([...comparisonReaderData.chinaEvents,...(comparisonReaderData.worldEvents||[])].flatMap(e=>e.eventIds));
 return [...atlas.events.filter(e=>moduleOf(e)!=='ot'&&!linked.has(e.id)).map(readerAtlasEntry),...comparisonReaderData.chinaEvents,...(comparisonReaderData.worldEvents||[])].sort((a,b)=>a.year-b.year||a.id.localeCompare(b.id));
}
function readerMatches(item,query){return !query||[item.title,item.originalTitle,item.genre,item.dateLabel,item.publicationLabel,typeof item.argument==='string'?item.argument:'',item.misreading?.claim,item.misreading?.correction,...(item.passages||[]).flatMap(p=>[p.locator,p.prompt]),item.name,item.role,item.place,item.topic,...(item.aliases||[]),...(item.people||[]),...(item.works||[]),...(item.keyTerms||[]).flatMap(t=>[t.term,t.definition]),...(item.positions||[]).flatMap(p=>[p.name,p.claim,p.limit]),item.argument?.title||'',...(item.argument?.steps||[]).map(s=>s.text),...(item.sections||[]).map(s=>s.text)].join(' ').toLocaleLowerCase().includes(query.toLocaleLowerCase());}
function readerFilter(items,bounds,cutoff,query,topic=''){
 return items.filter(e=>e.year>=bounds[0]&&e.year<=bounds[1]&&e.year<=cutoff&&(!topic||e.topic===topic)&&readerMatches(e,query));
}
function readerLink(label,url){const a=historyEl('a',label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
function readerSources(item){
 const details=historyEl('details',null,'reader-sources');details.append(historyEl('summary','出处与核验说明'));
 for(const source of item.sources||[]){const box=historyEl('div',null,'reader-source');box.append(source.localDocument?historyEl('strong',source.title+' · 本地文献'):readerLink(source.title+' ↗',source.url),historyEl('small',`${source.kind} · ${source.locator}`),historyEl('p',source.note));if(source.localDocument)box.append(historyEl('small',source.localDocument.verification+' · 本地文件：'+source.localDocument.fileName,'reader-local-status'));details.append(box);}
 for(const c of item.citations||[])details.append(referenceCard(c));
 if(item.eventIds?.length){const label=historyEl('p','相关主节点保留完整的年代依据和参考文献。');details.append(label);}
 return details;
}
function readerJump(entry){
 stop();$('#comparison-reader-dialog').close();if(typeof isPhilosophyView==='function'&&isPhilosophyView())setAppSection('history');state.comparison=true;
 const id=entry.eventIds?.[0];if(id)selectEvent(id,true);else{if(!state.comparison)state.comparison=true;browseYear(entry.year);}if(entry.culture)focusCultureEvent(entry);
}
function readerEventCard(entry,kind='events'){
 const card=historyEl('article',null,'reader-entry');card.dataset.readerEntry=entry.id;card.dataset.year=entry.year;if(kind==='culture')card.dataset.readerCulture=entry.id;
 card.classList.toggle('reader-future',entry.year>readerYear);
 const meta=historyEl('p',`${entry.year}${entry.endYear!==entry.year?'—'+entry.endYear:''}年 · ${entry.place} · ${entry.topic}`,'reader-entry-meta');
 if(entry.year>readerYear)meta.append(historyEl('strong',' · 晚于浏览年'));
 card.append(meta,historyEl('h4',entry.title),readerPeopleLinks(entry.people),historyEl('p',entry.summary));
 const details=historyEl('details',null,'reader-entry-body');
 details.append(historyEl('summary',`展开经过、影响与史料 · ${entry.sections.reduce((n,s)=>n+s.text.length,0)}字`));
 details.querySelector('summary').addEventListener('click',()=>{if(!details.open)rememberReader(kind,entry.id);});
 for(const section of entry.sections)details.append(historyEl('h5',section.title),historyEl('p',section.text));
 details.append(historyEl('small',`年代性质：${entry.dateKind}${entry.endYear>readerYear?'；此条跨年过程包含后续回顾，不代表当年已全部完成。':''}`),readerSources(entry));
 const actions=historyEl('div',null,'reader-entry-actions'),jump=historyEl('button',entry.culture?'定位文化地点并浏览该年 →':entry.eventIds?.length?'在地图上打开完整纪事 →':`地图浏览 ${entry.year} 年 →`);jump.type='button';jump.addEventListener('click',()=>readerJump(entry));actions.append(jump);details.append(actions);if(!entry.eventIds?.length)details.append(historyEl('p','本文为补充详读。跳转后，主图会显示该年份附近已编选的纪事；本文仍可从详读目录找回。','reader-notice'));if(entry.relatedEventIds?.length)details.append(historyEl('h5','关联纪事 · 各列实际年份'),readerRelatedLinks(entry.relatedEventIds));if(entry.workIds?.length)details.append(historyEl('h5','相关著作导读'),cultureLinks(entry.workIds));if(entry.questionIds?.length)details.append(historyEl('h5','深入理解这些问题'),cultureLinks(entry.questionIds));card.append(details);return card;
}
const readerProfileImages={peter:'pentecost',paul:'paul',constantine:'constantine',justinian:'justinian',charlemagne:'charlemagne',francis:'francis',luther:'luther',calvin:'calvin',guangwu:'han',cao:'cao',wang:'wang',wensui:'sui',taizong:'tang',jingjing:'stele',songtaizu:'song',kublai:'yuan',ricci:'ricci-west',xuguangqi:'xu'};
function readerProfileCard(person,open=false){
 const card=historyEl('article',null,'reader-entry reader-profile');card.dataset.readerPerson=person.id;
 card.append(historyEl('p',`${person.lifeLabel} · ${person.role}`,'reader-entry-meta'),historyEl('h4',person.name));
 const image=historicalMediaData.cards.find(c=>c.id===readerProfileImages[person.id]);
 if(image){const figure=historyEl('figure',null,'reader-profile-image');figure.append(historicalImage(image),historyEl('figcaption',image.caption),readerLink(`图像：${image.credit} · ${image.license} ↗`,image.imageSource));card.append(figure);}
 const culturalPortrait=({plato:'plato-bust',leonardo:'vitruvian',michelangelo:'creation-adam'})[person.id];if(culturalPortrait)card.append(cultureFigure(culturalPortrait));
 if(typeof philosophyPersonGallery==='function')card.append(philosophyPersonGallery(person.id,{portraitsOnly:true}));
 for(const s of person.sections)card.append(historyEl('h5',s.title),historyEl('p',s.text));
 card.append(readerSources(person));
 const related=historyEl('div',null,'reader-related');
 for(const id of person.eventIds){const e=atlas.events.find(e=>e.id===id);if(!e)continue;const b=historyEl('button',`${e.year}年 · ${e.title}${e.year>readerYear?'（晚于浏览年）':''}`);b.type='button';b.addEventListener('click',()=>readerJump({eventIds:[id]}));related.append(b);}
 if(person.eventIds.length){const fold=historyEl('details',null,'reader-profile-related');fold.append(historyEl('summary',`相关已编选纪事 · ${person.eventIds.length}条跨年目录`),related);card.append(fold);}if(person.cultureIds?.length)card.append(historyEl('h5','相关文化纪事 · 跨年目录'),cultureLinks(person.cultureIds));card.append(readerSaveButton('people',person.id));
 if(typeof treeFigureMap!=='undefined'&&treeFigureMap.get(person.id)?.nodeIds.length)card.append(treeButton('在完整哲学树中阅读 ↗',()=>focusReaderEntity('culture',treeFigureMap.get(person.id).primaryNodeId)));
 if(person.workIds?.length)card.append(historyEl('h5','相关著作与章节阅读'),cultureLinks(person.workIds));if(person.questionIds?.length)card.append(historyEl('h5','相关哲学问题'),cultureLinks(person.questionIds));if((comparisonReaderData.cultureNetworkLanes||[]).some(l=>l.personIds.includes(person.id))){const network=historyEl('button','查看思想联系 ↗','reader-save');network.type='button';network.addEventListener('click',()=>focusReaderEntity('culture','network-'+person.id));card.append(network);}
 return typeof libraryFoldArticle==='function'?libraryFoldArticle(card,person,'profile',open):card;
}
function readerEssayCard(essay){
 const card=historyEl('article',null,'reader-entry reader-essay');card.dataset.readerEssay=essay.id;
 card.append(historyEl('p',`${essay.range.join('—')}年 · 跨年专题`,'reader-entry-meta'),historyEl('h3',essay.title),historyEl('p',essay.kind,'reader-notice'));
 for(const s of essay.sections)card.append(historyEl('h4',s.title),historyEl('p',s.text));
 card.append(historyEl('h4','带着问题阅读'));const questions=historyEl('ol');for(const q of essay.questions)questions.append(historyEl('li',q));card.append(questions,readerSources(essay),readerSaveButton('essays',essay.id));return card;
}
function renderComparisonReader(){
 if(typeof libraryRecord==='function')libraryRecord();
 const period=$('#reader-period').value,bounds=readerBounds(period),all=$('#reader-full-period').checked,cutoff=all?1648:readerYear,query=$('#reader-search').value.trim(),topic=$('#reader-topic').value;
 $('#reader-settings-label').textContent=readerTab==='terms'?'检索与阅读设置 · 全部术语（不限年代）':`检索与阅读设置 · ${period==='all'?'全部年代':period+'世纪'} · ${all?'整段阅读':'截至'+readerYear+'年'}`;
 const unbounded=readerTab==='terms'||(readerTab==='culture'&&readerCultureMode!=='chronology');$('#reader-period').disabled=unbounded;$('#reader-full-period').disabled=unbounded;$('#reader-period').closest('label').hidden=readerTab==='culture'&&unbounded;$('#reader-full-period').closest('label').hidden=readerTab==='culture'&&unbounded;
 $('#reader-topic-label').hidden=!(readerTab==='events'||(readerTab==='culture'&&readerCultureMode==='chronology'));$('#reader-expand-all').hidden=!(readerTab==='events'||(readerTab==='culture'&&readerCultureMode==='chronology'));$('#reader-expand-all').textContent='展开全部正文';
 document.querySelectorAll('[data-reader-tab]').forEach(b=>{const chosen=b.dataset.readerTab===readerTab;b.setAttribute('aria-pressed',String(chosen));});
 $('#reader-title').textContent=readerTab==='culture'?'世界文化：哲学、艺术与知识的传承':'在同一世纪里，读懂两边的历史';
 $('.reader-intro').textContent=readerTab==='culture'?'从希腊哲学诸学派，到多语言的文本传承、大学争论、人文主义与文艺复兴。公元纪事可与中国同年对照；公元前哲学前史及思想传统另列导读。':'世界侧接入文化、哲学及既有经文与教会史全文；中国侧补充政治、思想、宗教、科技与交流。两列按各自年份排列，不把位置相邻的两条解释成因果关系。';
 if(readerTab==='culture'&&unbounded)$('#reader-settings-label').textContent='检索与阅读设置 · '+({search:'全库检索 · 跨栏目',overview:'思想与经典导读首页',prehistory:'公元前哲学前史',traditions:'跨年代思想传统',questions:'跨年代哲学问题',network:'跨年代思想系谱',works:'跨年代著作阅读',tree:'完整哲学树 · 原文与辨析'}[readerCultureMode]);
 const root=$('#reader-content');if(typeof treeSidebarScroll!=='undefined'&&root.querySelector('.tree-list'))treeSidebarScroll=root.querySelector('.tree-list').scrollTop;if(typeof philosophyNetworkObserver!=='undefined')philosophyNetworkObserver?.disconnect();root.replaceChildren();
 $('#reader-window-note').textContent=readerTab==='events'?`范围 ${bounds.join('—')}年 · ${all?'已显示整段，晚于浏览年的纪事带有标记':'纪事截至浏览 '+readerYear+' 年'}`:readerTab==='terms'?'术语释义供跨年代查阅，不受世纪及截至年份限制；释义不是词语在某年首次出现的断言。':'人物、地点与专题为跨年回顾；沿革及相关目录可能晚于当前浏览年。全部年代并勾选整段阅读时，人物还包含公元前哲学家，不与当前中国年份配成同时事件。';
 let count=0;
 if(readerTab==='events'){
  const entries=readerFilter(readerEvents(),bounds,cutoff,query,topic);count=entries.length;
  const grid=historyEl('div',null,'reader-columns');
  for(const [side,title] of [['west','世界文化与教会纪事'],['china','中国政治、文化与教会']]){
   const column=historyEl('section',null,'reader-column'),selected=entries.filter(e=>e.side===side);column.setAttribute('aria-label',title);
   column.append(historyEl('h3',`${title} · ${selected.length}条`));
   if(!selected.length)column.append(historyEl('p','此范围与筛选条件下暂无条目。可更换世纪、清除关键词，或勾选整段阅读。没有条目不表示当时没有相关历史。','reader-empty'));
   selected.forEach(e=>column.append(readerEventCard(e)));grid.append(column);
  }root.append(grid);
 }else if(readerTab==='culture'){
  count=renderCultureReader(root,bounds,cutoff,query,topic);
 }else if(readerTab==='people'){
  const people=comparisonReaderData.people.filter(p=>p.activeRange[0]<=Math.min(bounds[1],cutoff)&&(p.activeRange[1]>=bounds[0]||(period==='all'&&all&&p.activeRange[1]<30))&&readerMatches(p,query));count=people.length;
  const grid=historyEl('div',null,'reader-columns');for(const [side,title] of [['west','世界文化与教会人物'],['china','中国与跨文化人物']]){const column=historyEl('section',null,'reader-column');column.append(historyEl('h3',title));const selected=people.filter(p=>p.side===side);if(!selected.length)column.append(historyEl('p','当前条件下暂无已编选的小传。','reader-empty'));selected.forEach(p=>column.append(readerProfileCard(p,Boolean(query)&&people.length===1)));grid.append(column);}root.append(grid);
 }else if(readerTab==='places'){
  const sites=(comparisonReaderData.places||[]).filter(e=>e.range[0]<=Math.min(bounds[1],cutoff)&&e.range[1]>=bounds[0]&&readerMatches(e,query));count=sites.length;
  const grid=historyEl('div',null,'reader-columns');grid.classList.toggle('reader-single',sites.length===1);sites.forEach(e=>grid.append(readerPlaceCard(e)));root.append(grid);if(!count)root.append(historyEl('p','本时期和检索条件下暂无已编选地点；可选择全部年代浏览地点沿革。','reader-empty'));
 }else if(readerTab==='terms'){
  const terms=(comparisonReaderData.terms||[]).filter(e=>readerMatches(e,query));count=terms.length;terms.forEach(e=>root.append(readerTermCard(e)));if(!count)root.append(historyEl('p','暂无匹配术语，可清除关键词。','reader-empty'));
 }else{
  const essays=comparisonReaderData.essays.filter(e=>e.range[0]<=Math.min(bounds[1],cutoff)&&e.range[1]>=bounds[0]&&readerMatches(e,query));count=essays.length;
  essays.forEach(e=>root.append(readerEssayCard(e)));
  if(!count)root.append(historyEl('p','当前条件下暂无比较专题。可选择全部年代或清除关键词。','reader-empty'));
 }
 $('#reader-results').textContent=`${count}${readerTab==='culture'?(readerCultureMode==='chronology'?'条文化纪事':readerCultureMode==='network'?'条相关关系':readerCultureMode==='works'?'部著作':readerCultureMode==='tree'?'个原始主题':'篇文化导读'):readerTab==='people'?'篇小传':readerTab==='essays'?'篇专题':readerTab==='places'?'个地点网络':readerTab==='terms'?'个术语':'条纪事'} · 可展开阅读`;
 if(readerTab==='culture'){$('#reader-window-note').textContent=readerCultureMode==='chronology'?`文化纪事范围 ${bounds.join('—')}年 · ${all?'阅读整段，未来纪事带有标记':'截至浏览 '+readerYear+' 年'}`:'本页为独立跨年代阅读，人物与思想内容包含跨年回顾；主年轴仍为公元30—1648年。';}
 renderReaderIndex();if(typeof renderLibraryChrome==='function')renderLibraryChrome();if(typeof renderReadingUnity==='function')renderReadingUnity();
}
function openComparisonReader(tab='events',entryId=null){
 if(typeof stopPhilosophy==='function')stopPhilosophy();
 stop();readerYear=isOT()?30:state.year;readerTab=tab;if(tab==='culture')readerCultureMode=typeof renderCultureOverview==='function'?'overview':'chronology';$('#reader-index').open=false;updateReaderResume();$('#reader-period').value=String(readerCentury(readerYear));$('#reader-search').value='';$('#reader-topic').value='';$('#reader-full-period').checked=false;
 $('#reader-current-year').textContent=`浏览年 ${state.year} · 世界与中国对照详读`;
 if(typeof libraryBackStack!=='undefined'){libraryBackStack=[];libraryLastState=null;readerArea=tab==='culture'?'culture':'history';$('#library-menu').open=innerWidth>760;}$('#reader-settings').open=innerWidth>700;renderComparisonReader();const dialog=$('#comparison-reader-dialog');dialog.showModal();dialog.scrollTop=0;
 if(entryId){const entry=Array.from(document.querySelectorAll('[data-reader-entry]')).find(e=>e.dataset.readerEntry===entryId);if(entry){entry.querySelector('details').open=true;entry.scrollIntoView({block:'start'});}}
}
function readerLaunchButton(side){
 const count=readerEvents().filter(e=>e.side===side&&readerCentury(e.year)===readerCentury(state.year)&&e.year<=state.year).length;
 const button=historyEl('button',`对照详读 · 本世纪${count}条${side==='china'?'中国':'世界'}纪事 ↗`,'reader-launch');button.type='button';button.addEventListener('click',()=>openComparisonReader());return button;
}
function bindComparisonReader(){
 if(typeof bindReadingLibrary==='function')bindReadingLibrary();
 const select=$('#reader-period');select.append(new Option('全部年代 · 30—1648','all'));for(let i=1;i<=17;i++){const [from,to]=readerBounds(String(i));select.append(new Option(`${i}世纪 · ${from}—${to}`,String(i)));}
 $('#comparison-reader-dialog').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();$('#comparison-reader-dialog').close();stop();}});
 readerBookmark=loadReaderBookmark();updateReaderResume();
 $('#reader-resume').addEventListener('click',resumeReader);$('#reader-back-top').addEventListener('click',()=>{$('#comparison-reader-dialog').scrollTo({top:0,behavior:'smooth'});$('#reader-settings').open=true;});
 $('#open-comparison-reader').addEventListener('click',()=>openComparisonReader());$('#close-comparison-reader').addEventListener('click',()=>$('#comparison-reader-dialog').close());
 document.querySelectorAll('[data-reader-tab]').forEach(b=>b.addEventListener('click',()=>{if(typeof librarySelectTab==='function')librarySelectTab(b.dataset.readerTab);else {readerTab=b.dataset.readerTab;renderComparisonReader();}}));
 for(const id of ['reader-period','reader-topic','reader-full-period'])$('#'+id).addEventListener('change',renderComparisonReader);
 $('#reader-search').addEventListener('input',renderComparisonReader);
 $('#reader-reset').addEventListener('click',()=>{$('#reader-search').value='';$('#reader-topic').value='';renderComparisonReader();});
 $('#reader-expand-all').addEventListener('click',()=>{const list=Array.from(document.querySelectorAll('#reader-content .reader-entry-body')),expand=list.some(d=>!d.open);list.forEach(d=>d.open=expand);$('#reader-expand-all').textContent=expand?'收起全部正文':'展开全部正文';});
}
function readerPeopleLinks(names){
 const root=historyEl('div',null,'reader-entry-people reader-person-links');
 for(const name of names){const person=comparisonReaderData.people.find(p=>p.name===name||p.name.includes(name)||(p.id==='francis'&&name==='阿西西的方济各'));
  if(person){const button=historyEl('button',name+' ↗');button.type='button';button.title=`阅读${person.name}的小传`;button.addEventListener('click',()=>focusReaderEntity('people',person.id));root.append(button);}else root.append(historyEl('span',name));
 }return root;
}
function readerRelatedLinks(ids){
 const root=historyEl('div',null,'reader-related');
 for(const id of ids){const e=atlas.events.find(e=>e.id===id);if(!e)continue;const button=historyEl('button',`${e.year}年 · ${e.title}${e.year>readerYear?'（晚于浏览年）':''}`);button.type='button';button.addEventListener('click',()=>readerJump({eventIds:[id]}));root.append(button);}return root;
}
function readerPlaceCard(site){
 const card=historyEl('article',null,'reader-entry reader-place');card.dataset.readerPlace=site.id;
 card.append(historyEl('p',site.role+' · 跨年地点沿革','reader-entry-meta'),historyEl('h4',site.title));
 for(const id of site.placeIds){const p=atlas.places[id];card.append(historyEl('p',`${p.name} · ${p.modern} · ${p.lon.toFixed(2)}°E / ${p.lat.toFixed(2)}°N（代表点）`,'reader-place-coordinates'));}
 for(const section of site.sections)card.append(historyEl('h5',section.title),historyEl('p',section.text));
 const people=site.personIds.map(id=>comparisonReaderData.people.find(p=>p.id===id)).filter(Boolean);if(people.length)card.append(historyEl('h5','相关人物'),readerPeopleLinks(people.map(p=>p.name)));
 const fold=historyEl('details',null,'reader-profile-related');fold.append(historyEl('summary',`地点相关纪事 · ${site.eventIds.length}条跨年目录`),readerRelatedLinks(site.eventIds));
 card.append(fold,readerSources(site),readerSaveButton('places',site.id));return card;
}
function readerTermCard(term){
 const card=historyEl('article',null,'reader-entry reader-essay');card.dataset.readerTerm=term.id;card.append(historyEl('h3',term.title));
 for(const s of term.sections)card.append(historyEl('h4',s.title),historyEl('p',s.text));
 const fold=historyEl('details',null,'reader-profile-related');fold.append(historyEl('summary','相关纪事 · 跨年参考目录'),readerRelatedLinks(term.eventIds));card.append(fold,readerSources(term),readerSaveButton('terms',term.id));return card;
}
function readerEntity(kind,id){if(kind==='culture')return cultureEntity(id);return kind==='events'?readerEvents().find(e=>e.id===id):(comparisonReaderData[{people:'people',essays:'essays',places:'places',terms:'terms'}[kind]]||[]).find(e=>e.id===id);}
function readerEntityElement(kind,id){const attr={events:'readerEntry',people:'readerPerson',essays:'readerEssay',places:'readerPlace',terms:'readerTerm',culture:'readerCulture'}[kind];return Array.from($('#reader-content').querySelectorAll('article')).find(e=>e.dataset[attr]===id);}
function focusReaderEntity(kind,id){
 const entity=readerEntity(kind,id);if(!entity)return;if(typeof readingAreaFor==='function')readerArea=readingAreaFor(kind,id,readerArea);if(kind==='culture'){readerCultureMode=cultureModeFor(id);if(readerCultureMode==='works')workGenre='all';if(readerCultureMode==='tree')prepareTreeFocus(id);if(entity.personId){philosophySelected=entity.personId;philosophyRelationType='all';}}
 readerTab=kind;$('#reader-period').value='all';$('#reader-search').value=kind==='culture'&&readerCultureMode==='tree'?'':entity.name||entity.title;$('#reader-topic').value='';
 const start=entity.year??entity.activeRange?.[0]??entity.range?.[0];if(start>readerYear||entity.activeRange?.[1]<30)$('#reader-full-period').checked=true;
 renderComparisonReader();const target=readerEntityElement(kind,id);if(target){if(typeof libraryOpenTarget==='function')libraryOpenTarget(target);if(kind==='culture'&&readerCultureMode==='works')target.querySelector('.reader-work-body').open=true;target.scrollIntoView({block:'start'});rememberReader(kind,id);}
}
function readerSaveButton(kind,id){const button=historyEl('button','记住此处 · 下次继续','reader-save');button.dataset.readingAction='bookmark';button.type='button';button.addEventListener('click',()=>{rememberReader(kind,id);button.textContent='已记住阅读位置 ✓';});return button;}
function validReaderBookmark(value){
 if(!value||value.version!==1||!['events','people','essays','places','terms','culture'].includes(value.kind)||typeof value.id!=='string'||!readerEntity(value.kind,value.id))return false;
 const f=value.filters;return f&&typeof f.query==='string'&&f.query.length<=200&&typeof f.topic==='string'&&f.topic.length<=30&&typeof f.full==='boolean'&&(/^(all|[1-9]|1[0-7])$/).test(f.period)&&Number.isInteger(value.year)&&value.year>=30&&value.year<=1648;
}
function loadReaderBookmark(){try{const value=JSON.parse(localStorage.getItem('biblical-atlas:reader:v1'));return validReaderBookmark(value)?value:null;}catch{return null;}}
function rememberReader(kind,id){
 readerBookmark={version:1,kind,id,year:readerYear,filters:{libraryArea:typeof readerArea==='undefined'?'history':readerArea,period:$('#reader-period').value,query:$('#reader-search').value.trim().slice(0,200),topic:$('#reader-topic').value,full:$('#reader-full-period').checked,cultureMode:readerCultureMode,networkType:typeof philosophyRelationType==='undefined'?'all':philosophyRelationType,readingPath:typeof philosophyReadingPath==='undefined'?null:philosophyReadingPath,workGenre:typeof workGenre==='undefined'?'all':workGenre}};
 try{localStorage.setItem('biblical-atlas:reader:v1',JSON.stringify(readerBookmark));}catch{/* Position still works for this page when browser storage is unavailable. */}
 updateReaderResume();
}
function updateReaderResume(){const button=$('#reader-resume');if(!button)return;const item=readerBookmark&&readerEntity(readerBookmark.kind,readerBookmark.id);button.hidden=!item;if(item)button.textContent='继续上次：'+(item.name||item.title);}
function resumeReader(){
 if(!validReaderBookmark(readerBookmark))return;
 const saved=readerBookmark;readerTab=saved.kind;const f=saved.filters;if(typeof readerArea!=='undefined')readerArea=['history','culture','archive'].includes(f.libraryArea)?f.libraryArea:saved.kind==='culture'?'culture':'history';if(typeof philosophyReadingPath!=='undefined')philosophyReadingPath=(comparisonReaderData.philosophyReadingPaths||[]).some(p=>p.id===f.readingPath)?f.readingPath:null;if(saved.kind==='culture')readerCultureMode=cultureModeFor(saved.id);
 $('#reader-period').value=f.period;$('#reader-search').value=f.query;$('#reader-topic').value=f.topic;$('#reader-full-period').checked=f.full;
 const entity=readerEntity(saved.kind,saved.id);if(typeof readingAreaFor==='function')readerArea=readingAreaFor(saved.kind,saved.id,readerArea);if(saved.kind==='culture'&&readerCultureMode==='tree'){prepareTreeFocus(saved.id);$('#reader-search').value='';}if(saved.kind==='culture'&&readerCultureMode==='works')workGenre=['all',...(comparisonReaderData.cultureWorks||[]).map(w=>w.genre)].includes(f.workGenre)?f.workGenre:'all';if(entity.personId){philosophySelected=entity.personId;philosophyRelationType=['all',...philosophyTypes.map(t=>t[0])].includes(f.networkType)?f.networkType:'all';}const start=entity.year??entity.activeRange?.[0]??entity.range?.[0];if(start>readerYear||entity.activeRange?.[1]<30)$('#reader-full-period').checked=true;
 renderComparisonReader();const target=readerEntityElement(saved.kind,saved.id);if(target){if(typeof libraryOpenTarget==='function')libraryOpenTarget(target);if(saved.kind==='events'||(saved.kind==='culture'&&readerCultureMode==='chronology'))target.querySelector('.reader-entry-body').open=true;if(saved.kind==='culture'&&readerCultureMode==='works')target.querySelector('.reader-work-body').open=true;target.scrollIntoView({block:'start'});}
}
function renderReaderIndex(){
 const root=$('#reader-index-list');root.replaceChildren();const articles=Array.from($('#reader-content').querySelectorAll('article.reader-entry'));
 $('#reader-index>summary').textContent=`本页目录 · ${articles.length}项`;
 for(const article of articles){const title=article.querySelector('h3,h4')?.textContent;if(!title)continue;const li=historyEl('li'),button=historyEl('button',(article.dataset.year?article.dataset.year+'年 · ':'')+title);button.type='button';
  button.addEventListener('click',()=>{if(typeof libraryOpenTarget==='function')libraryOpenTarget(article);if(readerTab==='events'||(readerTab==='culture'&&readerCultureMode==='chronology'))article.querySelector('.reader-entry-body').open=true;if(readerTab==='culture'&&readerCultureMode==='works')article.querySelector('.reader-work-body').open=true;const id=article.dataset.readerCulture||article.dataset.readerEntry||article.dataset.readerPerson||article.dataset.readerEssay||article.dataset.readerPlace||article.dataset.readerTerm;rememberReader(readerTab,id);$('#reader-index').open=false;article.scrollIntoView({block:'start'});});li.append(button);root.append(li);
 }
}
