'use strict';
let philosophyView='guide',philosophyOverviewScale=1,philosophyOverviewReady=false,philosophyOverviewSearchIndex=-1;
function setPhilosophyView(view,sync=true){
 if(!['guide','overview','timeline'].includes(view))return;if(philosophyView==='guide'&&view!=='guide'&&typeof saveGuideReading==='function')saveGuideReading();stopPhilosophy();philosophyView=view;
 $('#philosophy-workspace').classList.toggle('philosophy-overview-mode',view==='overview');document.body.classList.toggle('philosophy-overview-view',view==='overview');
 document.querySelectorAll('[data-philosophy-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.philosophyView===view)));
 $('#philosophy-overview').hidden=view!=='overview';$('#philosophy-guide').hidden=view!=='guide';$('#philosophy-workspace').classList.toggle('philosophy-guide-mode',view==='guide');document.body.classList.toggle('philosophy-guide-view',view==='guide');if(view==='guide')renderGuideContext();
 if(view==='overview'&&philosophyOverviewReady)requestAnimationFrame(()=>{sizePhilosophyOverview();renderPhilosophyOverviewSelection();});
 if(typeof renderGuideTimelineReturn==='function')renderGuideTimelineReturn();if(sync&&isPhilosophyView())syncPhilosophyURL();
}
function overviewTitle(node){return node.title.replace(/^(?:巴鲁赫·|戈特弗里德·威廉·|格奥尔格·威廉·弗里德里希·|约翰·戈特利布·|弗里德里希·威廉·约瑟夫·)/,'');}
function buildPhilosophyOverview(){
 const root=$('#philosophy-overview-tree');root.replaceChildren();
 const heading=historyEl('header',null,'philosophy-tree-heading');heading.append(historyEl('p','WESTERN PHILOSOPHY · THE WHOLE STORY','eyebrow'),historyEl('h2','西方哲学史 · 全史位置'),historyEl('p','九个编选时期 · 151个阅读节点 · 前650年至1831年'));root.append(heading);
 philosophyAtlasData.phases.forEach((phase,index)=>{
  const row=historyEl('section',null,'philosophy-overview-row');row.dataset.overviewPhase=phase.id;row.style.setProperty('--phase-color',phase.color);
  const label=historyEl('header',null,'philosophy-overview-phase');label.append(historyEl('span',String(index+1).padStart(2,'0'),'overview-phase-number'),historyEl('h3',phase.title),historyEl('p',philosophySpan(phase.range)),historyEl('small',phase.short));row.append(label);
  const branches=historyEl('div',null,'philosophy-overview-branches');branches.style.gridTemplateColumns=philosophyKinds.slice(1).map(([kind])=>philosophyAtlasData.nodes.filter(n=>n.phaseId===phase.id&&n.kind===kind).length).filter(Boolean).map(n=>Math.max(2,n)+'fr').join(' ');
  for(const [kind,title] of philosophyKinds.slice(1)){
   const nodes=philosophyAtlasData.nodes.filter(n=>n.phaseId===phase.id&&n.kind===kind),branch=historyEl('section',null,'philosophy-overview-branch kind-'+kind);branch.append(historyEl('h4',title+' · '+nodes.length));
   const cards=historyEl('div',null,'philosophy-overview-cards');
   for(const node of nodes){const card=libraryButton('',()=>{setPhilosophyView('timeline',false);selectPhilosophyNode(node.id);},'philosophy-overview-card');card.dataset.overviewNode=node.id;card.title=node.title+' · '+node.dateLabel;card.append(historyEl('small',philosophyDate(node.anchor)+' · 定位'),historyEl('strong',overviewTitle(node)));if(node.kind==='person')card.append(historyEl('span',node.dateLabel,'overview-card-note'));else if(node.kind==='work')card.append(historyEl('span',node.dateLabel,'overview-card-note'));const image=node.imageId?cultureImage(node.imageId):node.personId?(philosophyGalleryData.find(i=>i.personIds.includes(node.personId)&&i.id.startsWith('portrait-'))||(node.personId==='plato'?cultureImage('plato-bust'):null)):null;if(image){const img=document.createElement('img');img.src=image.image;img.alt='';img.loading='lazy';const icon=historyEl('span',null,'overview-card-icon');icon.setAttribute('aria-hidden','true');icon.append(img);card.prepend(icon);card.classList.add('has-portrait');}if(!image){const icon=historyEl('span',node.kind==='person'?overviewTitle(node).split('·').at(-1).slice(0,1):node.kind==='work'?'书':'事','overview-card-icon overview-card-mark');icon.setAttribute('aria-hidden','true');card.prepend(icon);}cards.append(card);}
   if(!nodes.length)branch.hidden=true;if(!nodes.length)cards.append(historyEl('p','本阶段尚未编选此类条目。','overview-branch-empty'));branch.append(cards);branches.append(branch);
  }
  row.append(branches);root.append(row);
 });
 root.append(historyEl('p',philosophyTreeData.publication?.notice||'分期与枝线用于阅读导航，不表示思想在某一年突然开始，也不将分类关系视为师承。完整原始树的5,676个主题与待审核标识仍保存在阅读中心。','philosophy-overview-footnote'));
 philosophyOverviewReady=true;renderPhilosophyOverviewSelection();
}
function sizePhilosophyOverview(){
 if(!philosophyOverviewReady)return;const tree=$('#philosophy-overview-tree'),space=$('#philosophy-overview-space');tree.style.transform=`scale(${philosophyOverviewScale})`;space.style.width=tree.offsetWidth*philosophyOverviewScale+'px';space.style.height=tree.offsetHeight*philosophyOverviewScale+'px';$('#philosophy-overview-scale').value=Math.round(philosophyOverviewScale*100)+'%';if(typeof drawPhilosophyConnections==='function')drawPhilosophyConnections();updateOverviewRegion();
}
function zoomPhilosophyOverview(value){
 const viewport=$('#philosophy-overview-viewport'),tree=$('#philosophy-overview-tree'),view=viewport.getBoundingClientRect(),before=tree.getBoundingClientRect();
 const cx=view.left+viewport.clientWidth/2,cy=view.top+viewport.clientHeight/2,x=(cx-before.left)/philosophyOverviewScale,y=(cy-before.top)/philosophyOverviewScale;
 philosophyOverviewScale=Math.max(.05,Math.min(1.6,value));sizePhilosophyOverview();const after=tree.getBoundingClientRect();
 viewport.scrollLeft+=after.left+x*philosophyOverviewScale-cx;viewport.scrollTop+=after.top+y*philosophyOverviewScale-cy;
}
function focusPhilosophyOverviewNode(id){
 const button=document.querySelector(`[data-overview-node="${id}"]`),viewport=$('#philosophy-overview-viewport');if(!button)return;
 if(philosophyOverviewScale<.75){philosophyOverviewScale=1;sizePhilosophyOverview();}
 const card=button.getBoundingClientRect(),view=viewport.getBoundingClientRect();viewport.scrollLeft+=card.left+card.width/2-view.left-viewport.clientWidth/2;viewport.scrollTop+=card.top+card.height/2-view.top-viewport.clientHeight/2;
 button.focus({preventScroll:true});
}
function stepPhilosophyOverviewSearch(delta){
 const matches=searchPhilosophyOverview(false);if(!matches.length)return;
 philosophyOverviewSearchIndex=(philosophyOverviewSearchIndex+delta+matches.length)%matches.length;
 const button=matches[philosophyOverviewSearchIndex];focusPhilosophyOverviewNode(button.dataset.overviewNode);$('#philosophy-overview-search-position').value=`${philosophyOverviewSearchIndex+1} / ${matches.length}`;
}
function fitPhilosophyOverview(all=false){const viewport=$('#philosophy-overview-viewport'),tree=$('#philosophy-overview-tree');if(!viewport.clientWidth)return;philosophyOverviewScale=Math.max(.05,Math.min(1,(viewport.clientWidth-24)/tree.offsetWidth,all?(viewport.clientHeight-24)/tree.offsetHeight:1));sizePhilosophyOverview();viewport.scrollTo(0,0);}
function scrollPhilosophyOverviewPhase(id){const viewport=$('#philosophy-overview-viewport'),row=document.querySelector(`[data-overview-phase="${id}"]`);if(row){if(philosophyOverviewScale<1){philosophyOverviewScale=1;sizePhilosophyOverview();}viewport.scrollTo({left:0,top:row.offsetTop*philosophyOverviewScale,behavior:'auto'});updateOverviewRegion();}}
function updateOverviewRegion(){
 const viewport=$('#philosophy-overview-viewport');if(!viewport.clientWidth)return;const view=viewport.getBoundingClientRect(),x=view.left+viewport.clientWidth/2,y=view.top+Math.min(90,viewport.clientHeight/3),rows=[...document.querySelectorAll('[data-overview-phase]')];
 const row=rows.filter(e=>e.getBoundingClientRect().top<=y).at(-1)||rows[0];if(!row)return;const phase=philosophyAtlasData.phases.find(p=>p.id===row.dataset.overviewPhase),branches=[...row.querySelectorAll('.philosophy-overview-branch:not([hidden])')],branch=branches.find(e=>{const b=e.getBoundingClientRect();return b.left<=x&&b.right>=x;});
 $('#philosophy-overview-region').textContent='视窗：'+phase.title+(branch?' · '+branch.querySelector('h4').textContent:'');
}
function renderPhilosophyOverviewSelection(){if(!philosophyOverviewReady)return;document.querySelectorAll('[data-overview-node]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.overviewNode===philosophyState.entry)));document.querySelectorAll('[data-overview-phase]').forEach(r=>r.classList.toggle('current-phase',r.dataset.overviewPhase===philosophyPhase()?.id));}
function searchPhilosophyOverview(reset=true){if(reset)philosophyOverviewSearchIndex=-1;const query=$('#philosophy-overview-search').value.trim().toLocaleLowerCase(),matches=[];for(const button of document.querySelectorAll('[data-overview-node]')){const node=philosophyNode(button.dataset.overviewNode),hit=Boolean(query)&&[node.title,node.summary,...(node.people||[])].join(' ').toLocaleLowerCase().includes(query);button.classList.toggle('overview-match',hit);button.classList.toggle('overview-dim',Boolean(query)&&!hit);if(hit)matches.push(button);}matches.sort((a,b)=>Number(philosophyNode(b.dataset.overviewNode).title.toLocaleLowerCase().includes(query))-Number(philosophyNode(a.dataset.overviewNode).title.toLocaleLowerCase().includes(query)));$('#philosophy-overview-count').textContent=query?`${matches.length} 个匹配 · 保留完整结构`:'9个时期 · 151个节点';$('#philosophy-overview-search-nav').hidden=!matches.length;$('#philosophy-overview-search-position').value=matches.length?(philosophyOverviewSearchIndex<0?'0':String(philosophyOverviewSearchIndex+1))+' / '+matches.length:'';return matches;}
function initPhilosophyOverview(params){
 if(philosophyTreeData.publication)$('#philosophy-overview-original').textContent='原始资料公开范围 ↗';
 buildPhilosophyOverview();setPhilosophyView(params.get('phView')==='guide'?'guide':params.get('phView')==='overview'?'overview':params.get('phView')==='timeline'||philosophyNode(params.get('phEntry'))?'timeline':'guide',false);
 document.querySelectorAll('[data-philosophy-view]').forEach(b=>b.addEventListener('click',()=>setPhilosophyView(b.dataset.philosophyView)));
 $('#philosophy-overview-original').addEventListener('click',()=>philosophyOpenRaw(philosophyTreeData.rootIds[0]));$('#philosophy-overview-search').addEventListener('input',()=>searchPhilosophyOverview());$('#philosophy-overview-search').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();stepPhilosophyOverviewSearch(1);}});
 $('#philosophy-overview-search-prev').addEventListener('click',()=>stepPhilosophyOverviewSearch(philosophyOverviewSearchIndex<0?0:-1));$('#philosophy-overview-search-next').addEventListener('click',()=>stepPhilosophyOverviewSearch(1));$('#philosophy-overview-locate').addEventListener('click',()=>focusPhilosophyOverviewNode(philosophyState.entry));
 initPhilosophyConnections();
 $('#philosophy-overview-top').addEventListener('click',()=>{$('#philosophy-overview-viewport').scrollTo(0,0);updateOverviewRegion();});$('#philosophy-overview-native').addEventListener('click',()=>zoomPhilosophyOverview(1));$('#philosophy-overview-in').addEventListener('click',()=>zoomPhilosophyOverview(philosophyOverviewScale*1.2));$('#philosophy-overview-out').addEventListener('click',()=>zoomPhilosophyOverview(philosophyOverviewScale/1.2));$('#philosophy-overview-width').addEventListener('click',()=>fitPhilosophyOverview());$('#philosophy-overview-fit').addEventListener('click',()=>fitPhilosophyOverview(true));
 const viewport=$('#philosophy-overview-viewport');let drag=null;viewport.addEventListener('scroll',updateOverviewRegion,{passive:true});
 viewport.addEventListener('keydown',e=>{if(e.target!==viewport)return;if(['+','=','-','0'].includes(e.key)){e.preventDefault();if(e.key==='0')fitPhilosophyOverview(true);else zoomPhilosophyOverview(philosophyOverviewScale*(e.key==='-'?1/1.2:1.2));}});
 viewport.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('button,[data-overview-edge]'))return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};viewport.setPointerCapture(e.pointerId);viewport.classList.add('panning');});viewport.addEventListener('pointermove',e=>{if(drag&&drag.id===e.pointerId){viewport.scrollLeft=drag.left+drag.x-e.clientX;viewport.scrollTop=drag.top+drag.y-e.clientY;}});const end=()=>{drag=null;viewport.classList.remove('panning');};viewport.addEventListener('pointerup',end);viewport.addEventListener('pointercancel',end);
 let first=true;new ResizeObserver(()=>{if(!viewport.clientWidth)return;if(first){first=false;philosophyOverviewScale=1;sizePhilosophyOverview();viewport.scrollTo(0,0);}else sizePhilosophyOverview();}).observe(viewport);searchPhilosophyOverview();
}
