'use strict';
let readerCultureMode='chronology',cultureFocusId=null;
const cultureModes=[['overview','导读首页'],['chronology','文化纪事'],['prehistory','希腊哲学前史'],['traditions','思想传统'],['questions','哲学问题'],['network','思想系谱'],['works','著作导读']];
function cultureYear(year){return year<0?`公元前${Math.abs(year)}年`:`公元${year}年`;}
function cultureRange(range){return range[0]===range[1]?cultureYear(range[0]):cultureYear(range[0])+'—'+cultureYear(range[1]);}
function cultureEntity(id){if(id.startsWith('tree-')&&typeof treeNode==='function')return treeNode(id);if(id.startsWith('network-')){const person=comparisonReaderData.people.find(p=>p.id===id.slice(8));if(person&&(comparisonReaderData.cultureNetworkLanes||[]).some(l=>l.personIds.includes(person.id)))return {id,title:person.name+'的思想联系',range:person.activeRange,personId:person.id};}return [...(comparisonReaderData.cultureEvents||[]),...(comparisonReaderData.culturePrehistory||[]),...(comparisonReaderData.cultureTraditions||[]),...(comparisonReaderData.cultureQuestions||[]),...(comparisonReaderData.cultureWorks||[])].find(e=>e.id===id);}
function cultureModeFor(id){return id.startsWith('tree-')?'tree':id.startsWith('work-')?'works':id.startsWith('question-')?'questions':id.startsWith('network-')?'network':id.startsWith('prehistory-')?'prehistory':id.startsWith('tradition-')?'traditions':'chronology';}
function cultureContext(year){return (comparisonReaderData.cultureContexts||[]).find(c=>c.range[0]<=year&&year<=c.range[1]);}
function cultureImage(id){return [...(comparisonReaderData.cultureImages||[]),...(typeof philosophyGalleryData==='undefined'?[]:philosophyGalleryData)].find(i=>i.id===id);}
function openCultureImage(record){
 stop();const reader=$('#comparison-reader-dialog'),dialog=$('#historical-image-dialog'),person=$('#philosophy-person-dialog');if(person?.open){person.close();dialog.addEventListener('close',()=>{if(isPhilosophyView()&&philosophyView==='guide'){person.showModal();if(typeof restoreGuideSnapshot==='function')restoreGuideSnapshot(guideLastSnapshot);syncPhilosophyURL();}},{once:true});}if(reader.open){reader.close();dialog.addEventListener('close',()=>reader.showModal(),{once:true});}const root=$('#historical-image-content');root.replaceChildren();root.append(historyEl('p','世界文化 · 图像与实物','eyebrow'),historyEl('h2',record.title),historicalImage(record),historyEl('p',record.imageKind,'historical-image-kind'),historyEl('p',record.caption),historyEl('p',`${record.credit} · ${record.license} · ${record.transform}`,'historical-credit'));
 const links=historyEl('div',null,'historical-source-links');links.append(readerLink('原始图像与出处 ↗',record.imageSource),readerLink('许可说明 ↗',record.licenseUrl));root.append(links);$('#historical-image-dialog').showModal();
}
function cultureFigure(id){
 const record=cultureImage(id);if(!record)return document.createDocumentFragment();const figure=historyEl('figure',null,'culture-figure'),button=historyEl('button');button.type='button';button.setAttribute('aria-label',`放大文化图像：${record.title}`);button.append(historicalImage(record));button.addEventListener('click',()=>openCultureImage(record));figure.append(button,historyEl('figcaption',record.caption),readerLink(`${record.credit} · ${record.license} · 图源 ↗`,record.imageSource));return figure;
}
function cultureLinks(ids){
 const root=historyEl('div',null,'reader-related');for(const id of ids){const entry=cultureEntity(id);if(!entry)continue;const button=historyEl('button',`${entry.dateLabel|| (entry.year?cultureYear(entry.year):cultureRange(entry.range))} · ${entry.title}${entry.year>readerYear?'（晚于浏览年）':''}`);button.type='button';button.addEventListener('click',()=>focusReaderEntity('culture',id));root.append(button);}return root;
}
function cultureReviewCard(entry,open=false){
 const card=historyEl('article',null,'reader-entry reader-essay culture-review');card.dataset.readerCulture=entry.id;
 card.append(historyEl('p',cultureRange(entry.range)+' · '+entry.kind,'reader-entry-meta'),historyEl('h3',entry.title),readerPeopleLinks(entry.people));
 if(entry.id==='prehistory-academy')card.append(cultureFigure('plato-bust'));
 entry.sections.forEach((s,i)=>{card.append(historyEl('h4',s.title),historyEl('p',s.text));if(i===0&&entry.keyTerms?.length)card.append(historyEl('h4','关键术语 · 点击展开'),philosophyTermCards(entry));if(i===1&&entry.positions?.length)card.append(philosophyPositionTable(entry));if(i===2&&entry.argument)card.append(philosophyArgument(entry));});
 if(entry.works?.length){card.append(historyEl('h4','作品阅读路径'));const list=historyEl('ul');entry.works.forEach(w=>list.append(historyEl('li',w)));card.append(list);}if(entry.questions?.length){card.append(historyEl('h4','带着问题比较'));const list=historyEl('ol');entry.questions.forEach(q=>list.append(historyEl('li',q)));card.append(list);}if(entry.questionIds?.length)card.append(historyEl('h4','深入理解这些问题'),cultureLinks(entry.questionIds));
 if(entry.workIds?.length)card.append(historyEl('h4','著作导读 · 从具体文本继续'),cultureLinks(entry.workIds));
 if(entry.relatedCultureIds?.length)card.append(historyEl('h4','相关文化纪事 · 各列实际年代'),cultureLinks(entry.relatedCultureIds));
 card.append(readerSources(entry),readerSaveButton('culture',entry.id));if(entry.argument)card.append(philosophyQuestionNavigation(entry));return typeof libraryFoldArticle==='function'?libraryFoldArticle(card,entry,'culture',open):card;
}
function renderCultureReader(root,bounds,cutoff,query,topic){
 const nav=historyEl('div',null,'culture-mode-nav');nav.setAttribute('role','group');nav.setAttribute('aria-label','文化阅读方式');
 for(const [id,label] of cultureModes){const b=historyEl('button',label);b.type='button';b.dataset.cultureMode=id;b.setAttribute('aria-pressed',String(readerCultureMode===id));b.addEventListener('click',()=>{if(typeof librarySetMode==='function')librarySetMode(id);else {readerCultureMode=id;if(innerWidth<=700)$('#reader-settings').open=false;renderComparisonReader();}});nav.append(b);}root.append(nav);
 if(readerCultureMode==='search')return renderLibrarySearch(root,query);
 if(readerCultureMode==='overview')return renderCultureOverview(root);
 if(readerCultureMode==='tree')return renderPhilosophyTree(root,query);
 if(readerCultureMode==='works')return renderPhilosophyWorks(root,query);
 if(readerCultureMode==='network')return renderPhilosophyNetwork(root,query);
 const notice=historyEl('p',readerCultureMode==='chronology'?'文化纪事与教会、中国纪事共用公元年份；地图定位另用“文”标记。':readerCultureMode==='prehistory'?'这里单独阅读公元前的哲学发展。主地图仍为公元30—1648年，前史不与当前中国年份配成同时事件。':readerCultureMode==='questions'?'按问题比较概念、论证和反对意见。各篇是跨年代导读，页码和核验状态见出处卡；不把不同年代作者的观点伪装成同时发生的事件。':'这些传统有承接、争论和并行发展。下列为跨年代导读，不是一条人人同意的单向师承线。','reader-notice');root.append(notice);if(readerCultureMode==='questions')root.append(philosophyReadingRoutes());
 if(readerCultureMode==='chronology'){
  const entries=readerFilter(comparisonReaderData.cultureEvents||[],bounds,cutoff,query,topic),grid=historyEl('div',null,'reader-columns culture-chronology');grid.classList.toggle('reader-single',entries.length===1);
  for(const entry of entries){const card=readerEventCard(entry,'culture');if(entry.imageId)card.querySelector('.reader-entry-body').before(cultureFigure(entry.imageId));grid.append(card);}root.append(grid);if(!entries.length)root.append(historyEl('p','此年份范围与检索下暂无文化纪事。可选择全部年代、阅读整段或清除关键词。','reader-empty'));return entries.length;
 }
 const items=(comparisonReaderData[{prehistory:'culturePrehistory',traditions:'cultureTraditions',questions:'cultureQuestions'}[readerCultureMode]]||[]).filter(e=>readerMatches(e,query));items.forEach(e=>root.append(cultureReviewCard(e,Boolean(query)&&items.length===1)));if(!items.length)root.append(historyEl('p','没有匹配的文化导读，可清除关键词。','reader-empty'));return items.length;
}
function openWorldCulture(id=null){
 if(typeof openPhilosophyAtlas==='function'){const node=id&&philosophyNode('ph-'+id);openPhilosophyAtlas(node?{entry:node.id}:{year:isOT()?-399:state.year});return;}
 openComparisonReader('culture');if(id)focusReaderEntity('culture',id);
}
function renderWorldCulture(){
 const root=$('#event-world-culture');root.replaceChildren();root.hidden=isOT();if(root.hidden)return;
 const phase=typeof philosophyPhase==='function'?philosophyPhase(state.year):null;if(!phase)return;
 root.append(historyEl('p','同期思想背景 · '+phase.title,'historical-kicker'),historyEl('p',phase.intro,'philosophy-main-brief'));
 const recent=(comparisonReaderData.cultureEvents||[]).filter(e=>e.year>=phase.range[0]&&e.year<=state.year).at(-1);
 if(recent)root.append(historyEl('small',`${recent.year}年 · ${recent.title}`,'philosophy-main-recent'));
 const button=historyEl('button','进入西方哲学史 ↗','reader-launch');button.type='button';button.addEventListener('click',()=>openWorldCulture());root.append(button);
}
function cultureMapEntries(year){
 const phase=cultureContext(year);if(!phase)return [];
 const list=(comparisonReaderData.cultureEvents||[]).filter(e=>e.year>=phase.range[0]&&e.year<=year).slice(-8);
 const groups=new Map();for(const e of list)groups.set(e.coordinates.lon.toFixed(1)+','+e.coordinates.lat.toFixed(1),e);
 return Array.from(groups.values());
}
function renderCultureMap(){
 let group=$('#culture-map-layer');if(!group){group=svgNode('g',{id:'culture-map-layer'});$('#map-world').append(group);}group.replaceChildren();
 const enabled=!isOT()&&$('#culture-check').checked;let key=$('#culture-legend');if(!key){key=historyEl('span','文 · 世界文化','culture-legend');key.id='culture-legend';$('#map-legend').append(key);}key.hidden=!enabled;group.style.display=enabled?'':'none';if(!enabled){$('#culture-map-focus').hidden=true;return;}
 const selected=(comparisonReaderData.cultureEvents||[]).find(e=>e.id===cultureFocusId&&e.year===state.year);if(!selected)cultureFocusId=null;
 const entries=cultureMapEntries(state.year);if(selected&&!entries.some(e=>e.id===selected.id))entries.push(selected);
 for(const entry of entries){const [x,y]=project(entry.coordinates.lon,entry.coordinates.lat),node=svgNode('g',{class:'culture-map-point'+(selected?.id===entry.id?' focused':''),transform:`translate(${x} ${y})`,role:'button',tabindex:'0','aria-label':`世界文化：${entry.title}，${entry.year}年`,'data-culture-id':entry.id});
  node.append(svgNode('circle',{class:'culture-hit',fill:'transparent'}),svgNode('circle',{class:'culture-point'}),svgNode('text',{class:'culture-glyph','text-anchor':'middle'},'文'));
  const activate=()=>{if(!drag?.moved)openWorldCulture(entry.id);};node.addEventListener('click',activate);node.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}});group.append(node);
 }
 $('#culture-map-focus').hidden=!selected;if(selected)$('#culture-focus-title').textContent=`文化定位 · ${selected.year}年 · ${selected.title}`;
 updateCultureMarkerScale();
}
function updateCultureMarkerScale(){
 const group=$('#culture-map-layer');if(!group)return;const box=$('#map').getBoundingClientRect(),factor=Math.max(.04,Math.min(box.width/1100,box.height/650)*camera.k);
 group.querySelectorAll('.culture-map-point').forEach(node=>{node.querySelector('.culture-hit').setAttribute('r',13/factor);node.querySelector('.culture-point').setAttribute('r',7/factor);const text=node.querySelector('text');text.setAttribute('y',3.5/factor);text.style.fontSize=9/factor+'px';});
}
function focusCultureEvent(entry){
 $('#culture-check').checked=true;cultureFocusId=entry.id;const [x,y]=project(entry.coordinates.lon,entry.coordinates.lat),k=1.15;camera={k,x:550-x*k,y:325-y*k};renderCultureMap();updateCamera();
}
function bindWorldCulture(){
 loadWorkComparison();
 $('#open-world-culture').addEventListener('click',()=>openWorldCulture());$('#culture-check').addEventListener('change',renderCultureMap);
 $('#culture-focus-title').addEventListener('click',()=>{if(cultureFocusId)openWorldCulture(cultureFocusId);});$('#culture-focus-close').addEventListener('click',()=>{cultureFocusId=null;renderCultureMap();});
}
