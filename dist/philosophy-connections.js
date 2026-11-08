'use strict';
let philosophyConnectionsPerson='kant',philosophyConnectionsType='all',philosophyConnectionsOpen=false,philosophyConnectionsSelected=null;
function philosophyConnectionPeople(){return philosophyAtlasData.nodes.filter(n=>n.kind==='person');}
function philosophyConnectionsRelations(){
 const people=new Set(philosophyConnectionPeople().map(n=>n.personId)),seen=new Set(),result=[];
 for(const relation of [...comparisonReaderData.cultureRelations,...philosophyTreeData.relations]){
  const key=[relation.fromId,relation.toId,relation.type].join(':');
  if(seen.has(key)||!people.has(relation.fromId)||!people.has(relation.toId))continue;
  seen.add(key);result.push(relation);
 }
 return result;
}
function philosophyConnectionsFor(id=philosophyConnectionsPerson){return philosophyConnectionsRelations().filter(r=>(r.fromId===id||r.toId===id)&&(philosophyConnectionsType==='all'||r.type===philosophyConnectionsType));}
function philosophyConnectionPerson(id){return philosophyConnectionPeople().find(n=>n.personId===id);}
function philosophyConnectionWorks(id=philosophyConnectionsPerson){return philosophyAtlasData.nodes.filter(n=>n.kind==='work'&&n.personIds?.includes(id));}
function setPhilosophyConnections(open){
 philosophyConnectionsOpen=open;$('#philosophy-connections-hint').hidden=!open;$('#philosophy-connections-panel').hidden=!open;$('#philosophy-overview-connections').setAttribute('aria-expanded',String(open));
 if(open){const matches=$('#philosophy-overview-search').value.trim()?searchPhilosophyOverview(false):[],found=matches[philosophyOverviewSearchIndex],selected=philosophyNode(found?.dataset.overviewNode||philosophyState.entry),id=selected.personId||selected.personIds?.[0];if(philosophyConnectionPerson(id))philosophyConnectionsPerson=id;renderPhilosophyConnections();}
 else{$('#philosophy-connections-lines')?.remove();document.querySelectorAll('[data-overview-node]').forEach(b=>b.classList.remove('connection-focus','connection-related'));}
 requestAnimationFrame(()=>{sizePhilosophyOverview();if(open)focusPhilosophyOverviewNode(philosophyConnectionPerson(philosophyConnectionsPerson).id);});
}
function locatePhilosophyConnectionNode(id){if(innerWidth<=760)setPhilosophyConnections(false);requestAnimationFrame(()=>focusPhilosophyOverviewNode(id));}
function selectPhilosophyConnectionPerson(id,focus=true){
 if(!philosophyConnectionPerson(id))return;philosophyConnectionsPerson=id;philosophyConnectionsSelected=null;renderPhilosophyConnections();
 if(focus)requestAnimationFrame(()=>focusPhilosophyOverviewNode(philosophyConnectionPerson(id).id));
}
function selectPhilosophyConnection(relation){
 philosophyConnectionsSelected=relation.id;renderPhilosophyConnections();const target=$('#philosophy-connections-panel [data-overview-relation="'+relation.id+'"]');if(target){target.open=true;target.scrollIntoView({block:'nearest'});target.querySelector('summary').focus({preventScroll:true});}
}
function renderPhilosophyConnections(){
 const root=$('#philosophy-connections-panel');root.replaceChildren();root.scrollTop=0;const person=philosophyConnectionPerson(philosophyConnectionsPerson);if(!person)return;
 const head=historyEl('div',null,'connections-heading');head.append(historyEl('h2','人物与著作关系'),libraryButton('关闭',()=>{$('#philosophy-overview-connections').focus();setPhilosophyConnections(false);},'connections-close'));root.append(head);
 const controls=historyEl('div',null,'connections-controls'),label=historyEl('label','聚焦人物 '),select=document.createElement('select');select.id='philosophy-connections-person';select.setAttribute('aria-label','选择全图关系人物');for(const node of philosophyConnectionPeople())select.append(new Option(node.title,node.personId));select.value=person.personId;select.addEventListener('change',()=>selectPhilosophyConnectionPerson(select.value));label.append(select);controls.append(label);
 const typeLabel=historyEl('label','思想关系 '),type=document.createElement('select');type.id='philosophy-connections-type';type.setAttribute('aria-label','筛选全图关系类型');for(const [id,title] of [['all','全部类型'],...philosophyTypes])type.append(new Option(title,id));type.value=philosophyConnectionsType;type.addEventListener('change',()=>{philosophyConnectionsType=type.value;philosophyConnectionsSelected=null;renderPhilosophyConnections();});typeLabel.append(type);controls.append(typeLabel);root.append(controls);
 root.append(historyEl('h3',person.title),historyEl('p',person.dateLabel,'connections-life'));const biography=historyEl('details',null,'connections-biography');biography.append(historyEl('summary','人物简介'),historyEl('p',person.summary,'connections-summary'));root.append(biography);
 const actions=historyEl('div',null,'connections-actions');actions.append(libraryButton('人物详读 →',()=>{setPhilosophyView('timeline',false);selectPhilosophyNode(person.id);}),libraryButton('定位人物',()=>locatePhilosophyConnectionNode(person.id)));root.append(actions);
 root.append(historyEl('p','实线箭头按条目的起点与终点连接，表示学习、接受或回应的阅读方向；批评线不等同“箭头起点批评终点”。共同问题比较为无箭头虚线；相关文本为点线。','connections-direction'));
 const relations=philosophyConnectionsFor(),works=philosophyConnectionWorks();root.append(historyEl('h3','思想联系 · '+relations.length));
 if(!relations.length)root.append(historyEl('p','当前筛选下尚无已编选的关系记录；这不表示该人物没有思想联系。','connections-empty'));
 for(const relation of relations){
  const detail=historyEl('details',null,'connections-relation');detail.dataset.overviewRelation=relation.id;detail.open=philosophyConnectionsSelected===relation.id;
  const from=philosophyConnectionPerson(relation.fromId),to=philosophyConnectionPerson(relation.toId),summary=historyEl('summary');summary.append(historyEl('small',philosophyRelationLabel(relation.type)),historyEl('strong',from.title+(relation.type==='context'?' ↔ ':' → ')+to.title),historyEl('span',relation.title));detail.append(summary,historyEl('p',relation.summary));if(relation.evidenceStatus)detail.append(historyEl('small',relation.evidenceStatus,'connections-evidence'));
  const other=relation.fromId===person.personId?to:from;detail.append(libraryButton('转向 '+other.title,()=>selectPhilosophyConnectionPerson(other.personId)),readerSources(relation));root.append(detail);
 }
 root.append(historyEl('h3','相关文本 · '+works.length),historyEl('p','关联包括作者、整理者、对话人物等角色；请按作品的归属说明阅读。','connections-direction'));
 if(!works.length)root.append(historyEl('p','当前编选中尚无单列著作节点。','connections-empty'));
 for(const work of works){const card=historyEl('section',null,'connections-work');card.dataset.overviewWork=work.id;const original=work.readRef?cultureEntity(work.readRef.id):null;card.append(historyEl('h4',work.title),historyEl('small',work.dateLabel));if(original?.attribution)card.append(historyEl('p',original.attribution));card.append(libraryButton('在全图定位',()=>locatePhilosophyConnectionNode(work.id)),libraryButton('阅读著作 →',()=>{setPhilosophyView('timeline',false);selectPhilosophyNode(work.id);}));root.append(card);}
 drawPhilosophyConnections();
}
function drawPhilosophyConnections(){
 $('#philosophy-connections-lines')?.remove();if(!philosophyConnectionsOpen||!philosophyOverviewReady||!$('#philosophy-overview-viewport').clientWidth)return;
 const root=$('#philosophy-overview-tree'),rect=root.getBoundingClientRect(),scale=philosophyOverviewScale,person=philosophyConnectionPerson(philosophyConnectionsPerson),relations=philosophyConnectionsFor(),works=philosophyConnectionWorks(),relatedIds=new Set(works.map(n=>n.id));
 for(const r of relations){relatedIds.add(philosophyConnectionPerson(r.fromId).id);relatedIds.add(philosophyConnectionPerson(r.toId).id);}
 document.querySelectorAll('[data-overview-node]').forEach(button=>{button.classList.toggle('connection-focus',button.dataset.overviewNode===person.id);button.classList.toggle('connection-related',relatedIds.has(button.dataset.overviewNode)&&button.dataset.overviewNode!==person.id);});
 const svg=svgNode('svg',{id:'philosophy-connections-lines',width:root.offsetWidth,height:root.offsetHeight,'aria-label':'当前人物的思想关系与相关文本连线',role:'group'}),defs=svgNode('defs');
 for(const [id] of philosophyTypes){const marker=svgNode('marker',{id:'overview-arrow-'+id,viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:7,markerHeight:7,orient:'auto'});marker.append(svgNode('path',{d:'M0 0 L10 5 L0 10z',fill:({learning:'#9b6d3e',translation:'#5b8b82',reception:'#797293',critique:'#a15a4f',context:'#8a8968'})[id]}));defs.append(marker);}svg.append(defs);
 function connect(fromId,toId,type,label,action,key){
  const from=document.querySelector('[data-overview-node="'+fromId+'"]'),to=document.querySelector('[data-overview-node="'+toId+'"]');if(!from||!to)return;
  const a=from.getBoundingClientRect(),b=to.getBoundingClientRect(),differentRow=Math.abs(a.top-b.top)>60*scale;let x1,y1,x2,y2,d;
  if(differentRow){const down=b.top>a.top;x1=(a.left+a.width/2-rect.left)/scale;y1=((down?a.bottom:a.top)-rect.top)/scale;x2=(b.left+b.width/2-rect.left)/scale;y2=((down?b.top:b.bottom)-rect.top)/scale;const bend=Math.max(45,Math.abs(y2-y1)*.4);d=`M${x1} ${y1} C${x1} ${y1+(down?bend:-bend)} ${x2} ${y2+(down?-bend:bend)} ${x2} ${y2}`;}
  else{const right=b.left>a.left;x1=((right?a.right:a.left)-rect.left)/scale;y1=(a.top+a.height/2-rect.top)/scale;x2=((right?b.left:b.right)-rect.left)/scale;y2=(b.top+b.height/2-rect.top)/scale;d=`M${x1} ${y1} C${x1+(right?50:-50)} ${y1-45} ${x2+(right?-50:50)} ${y2-45} ${x2} ${y2}`;}
  const path=svgNode('path',{d,class:'overview-connection-edge connection-'+type,tabindex:0,role:'button','aria-label':label,'data-overview-edge':key});if(!['context','work'].includes(type))path.setAttribute('marker-end','url(#overview-arrow-'+type+')');path.append(svgNode('title',{},label));path.addEventListener('click',action);path.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();action();}});svg.append(path);
 }
 for(const r of relations)connect(philosophyConnectionPerson(r.fromId).id,philosophyConnectionPerson(r.toId).id,r.type,philosophyRelationLabel(r.type)+'：'+r.title,()=>selectPhilosophyConnection(r),r.id);
 for(const work of works)connect(person.id,work.id,'work','相关文本：'+work.title,()=>locatePhilosophyConnectionNode(work.id),work.id);
 root.prepend(svg);
}
function initPhilosophyConnections(){
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&philosophyConnectionsOpen&&philosophyView==='overview'&&!document.querySelector('dialog[open]')){setPhilosophyConnections(false);$('#philosophy-overview-connections').focus();}});
 $('#philosophy-overview-connections').addEventListener('click',()=>setPhilosophyConnections(!philosophyConnectionsOpen));
 $('#philosophy-overview-tree').addEventListener('click',event=>{if(!philosophyConnectionsOpen)return;const button=event.target.closest('[data-overview-node]'),node=button&&philosophyNode(button.dataset.overviewNode);if(node?.kind==='person'){event.preventDefault();event.stopImmediatePropagation();selectPhilosophyConnectionPerson(node.personId);}},true);
}
