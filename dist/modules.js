'use strict';
const moduleOf=e=>e.module||'acts';
const isOT=()=>state.module==='ot';
const isChurch=()=>['church','world'].includes(state.module);
const eventPosition=e=>moduleOf(e)==='ot'?e.position:e.year;
const comparisonEvents=()=>atlas.events.filter(e=>moduleOf(e)!=='ot');
const moduleConfig=()=>atlas.modules.find(m=>m.id===state.module);
const moduleEvents=()=>atlas.events.filter(e=>moduleOf(e)===state.module);
const browsingRange=()=>state.comparison?atlas.comparisonRange:moduleConfig().range;
const yearModule=year=>year<=62?'acts':year<=451?'church':'world';
const eventYearLabel=e=>moduleOf(e)==='ot'?`经文节点 ${e.position}`:e.yearLabel||`约 ${e.year} 年`;
const sourceLabel=e=>moduleOf(e)!=='acts'?e.ref:`使徒行传 ${e.ref}`;
const eventPlaceContext=p=>isOT()?(p.otContext||p.context):state.module==='world'?(p.worldContext||p.historyContext||p.context):isChurch()?(p.historyContext||p.context):p.context;
function chooseModule(id){
 stop();state.query='';state.person='';state.topic='';$('#search').value='';$('#person').value='';$('#topic').value='';
 const saved=state.lastEvents?.[id];selectEvent(saved||atlas.events.find(e=>moduleOf(e)===id).id,true);
}
function renderModuleUI(){
 const config=moduleConfig(),church=isChurch(),ot=isOT();
 document.body.classList.toggle('ot-mode',ot);
 renderComparison();
 document.title=`言光 · ${config.name}交互地图`;
 $('.atlas').setAttribute('aria-label',`${config.name}地图与时间轴`);
 $('#map').setAttribute('aria-label',`${config.name}地点交互地图，支持拖动、缩放及选择城市`);
 document.body.classList.toggle('church-mode',church);
 document.body.classList.toggle('world-mode',state.module==='world');
 $('#political-land-mask').setAttribute('d',state.module==='world'?overviewLandMask:detailedLandMask);
 $('#module-label').textContent=config.name;$('#module-period').textContent=ot?'希伯来圣经 · 先知书':church?`${config.range[0]}—${config.range[1]}年`:'公元一世纪';
 $('#sidebar-eyebrow').textContent=config.eyebrow;$('#sidebar-heading').replaceChildren();
 config.heading.forEach((line,i)=>{if(i)$('#sidebar-heading').append(document.createElement('br'));$('#sidebar-heading').append(document.createTextNode(line));});
 $('#sidebar-lead').textContent=config.lead;
 $('#sidebar-book').textContent=ot?'NEVI’IM':state.module==='world'?'WORLD CHURCH':church?'EARLY CHURCH':'ACTS';$('#sidebar-span').textContent=ot?'19个阅读单位':church?config.range.join('—'):'01—28';
 $('.map-credit').innerHTML=ot?'地名：OpenBible / CC BY 4.0 · 水系：<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a> / <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener noreferrer">ODbL 1.0</a> · 地形：Mapzen':state.module==='world'?'Natural Earth 全球概览 · 地中海地区含精细地形 · Cliopatria / CC BY 4.0':'Natural Earth · Mapzen · Cliopatria / CC BY 4.0';
 $('#sidebar-note').textContent=ot?'以经文为主 · 节点不是公历年':church?'文献、传统与考古材料分开标注':'按叙事顺序阅读 · 年代为近似值';
 $('#topic-row').hidden=!(church||ot);
 $('#culture-layer-option').hidden=ot;$('#ot-book-bar').hidden=!ot;$('#ot-map-bar').hidden=!ot;
 if(ot)$('#ot-book-select').value=current().book;
 $('#search').placeholder=ot?'搜索经卷、人物、地点或章节':'搜索地点、人物、经文章节';
 $('#politics-check').closest('label').hidden=ot;$('#administration-check').closest('label').hidden=ot;
 if(ot)$('#politics-dialog').close();
 renderModuleSources();renderScriptureFilters();
 document.querySelectorAll('[data-module-choice]').forEach(b=>{const selected=b.dataset.moduleChoice===state.module;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',selected);});
 if($('#route-tabs').dataset.module!==state.module){
  $('#route-tabs').replaceChildren();$('#route-tabs').dataset.module=state.module;
  atlas.routes.filter(r=>(r.module||'acts')===state.module).forEach((r,i)=>{
   const b=document.createElement('button');b.className='route-tab';b.dataset.route=r.id;
   const number=document.createElement('span');number.className='tab-num';number.textContent=String(i+1).padStart(2,'0');
   b.append(number,document.createTextNode(r.short));b.title=r.intro;
   b.addEventListener('click',()=>{stop();state.query='';state.person='';state.topic='';$('#search').value='';$('#person').value='';$('#topic').value='';selectEvent(atlas.events.find(e=>e.route===r.id).id,true);});
   $('#route-tabs').append(b);
  });
 }
 if(!timer)$('#play').setAttribute('aria-label',church?'自动浏览纪事':'自动播放旅程');
 $('#reading-kicker').textContent=ot?'NEVI’IM · 经文详读':state.module==='world'?'WORLD CHURCH · 史料详读':church?'EARLY CHURCH · 史料详读':'ACTS · 事件详读';
 const legend=$('#map-legend');legend.replaceChildren();
 const dot=document.createElement('span');dot.className='legend-dot';const text=document.createElement('span');text.textContent=ot?'经文相关地点':church?'历史地点':'叙事地点';legend.append(dot,text);
 const line=document.createElement('span');line.className='legend-line';const caption=document.createElement('span');caption.textContent=ot?'经文联系示意':church?'文献 / 人物联系示意':'陆路示意';legend.append(line,caption);
 if(!church&&!ot){const sea=document.createElement('span');sea.className='legend-line sea';const label=document.createElement('span');label.textContent='海路 / 漂流示意';legend.append(sea,label);}
 $('#timeline-event').setAttribute('aria-label',church?'当前历史纪事':'当前经文纪事');
}
function renderAdditionalSources(event){
 renderResearch(event);
 for(const target of ['event-sources','reading-sources']){
  const root=$('#'+target);root.replaceChildren();
  if(!(event.references||[]).length){root.hidden=true;continue;}root.hidden=false;
  const label=document.createElement('small');label.textContent='比较与延伸资料';root.append(label);
  event.references.forEach(ref=>{const a=document.createElement('a');a.href=ref.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=ref.label+' ↗';root.append(a);});
 }
}
function drawHistoryConnections(){
 if(!isChurch()&&!isOT())return;
 const event=current();
 const phasePlaces=new Set(routeEvents().map(e=>e.place)),labeled=new Set();
 (event.connections||[]).forEach(connection=>{
  const from=atlas.places[connection.from],to=atlas.places[connection.to];
  const [x1,y1]=project(from.lon,from.lat),[x2,y2]=project(to.lon,to.lat);
  const d=`M${x1},${y1} Q${(x1+x2)/2},${(y1+y2)/2-Math.min(45,Math.hypot(x2-x1,y2-y1)*.1)} ${x2},${y2}`;
  const path=svgNode('path',{d,class:'history-connection'});path.append(svgNode('title',{},`${connection.kind}：${connection.label}；非精确行路。`));$('#paths').append(path);
  [connection.from,connection.to].forEach(id=>{
   if(phasePlaces.has(id)||labeled.has(id))return;labeled.add(id);
   const p=atlas.places[id],[x,y]=project(p.lon,p.lat),g=svgNode('g',{class:'connection-node',transform:`translate(${x},${y})`});
   g.append(svgNode('circle',{r:3,class:'point'}),svgNode('text',{x:8,y:16},p.name));$('#paths').append(g);
  });
 });
}

function renderModuleSources(){
 const ot=isOT();
 $('#sources-intro').textContent=ot?'旧约先知书按希伯来圣经经卷组织，以经文为叙事主依据。撒母耳、列王各合并阅读，十二先知书展开为十二个阅读单位；中文章节使用和合本编号。':'本版包含旧约先知书、使徒行传、初代教会史与世界教会史。经文与后世史料分开标注，正文为自行撰写的阅读说明。';
 $('#sources-scope').textContent=ot?'当前是先知书选编，不是完整旧约。律法书和圣卷尚待扩展；丹以理、历代志、哀歌等按希伯来目录不放在先知书内。节点进度不是公历年，异象涉及地点不等于先知实际行程。':'书内分期不表示所有人物沿一条路线同行。世界教会史至1648年；旧约先知书独立按经文顺序阅读，不与中国对照。';
 const root=$('#sources-list');root.replaceChildren();
 atlas.sources.filter(source=>!ot||source.url==='data/OLD-TESTAMENT-SOURCES.md').forEach(source=>{const a=document.createElement('a');a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=source.title+' ↗';const p=document.createElement('p');p.textContent=source.usage;root.append(a,p);});
 $('#editorial-note').textContent=ot?'本模块不赋未经经文明说的公历年。地点是现代地理近似参照，不表示相关建筑、河道或遗址均已确认。叙事、异象、神谕与诗歌分别说明；经文摘要不是原文全文，也不替代对完整上下文的阅读。':atlas.editorial;
}
function bindOldTestament(){
 const select=$('#ot-book-select');
 for(const section of ['前先知书','后先知书','十二先知书']){
  const group=document.createElement('optgroup');group.label=section;
  atlas.otBooks.filter(b=>b.section===section).forEach(b=>{const option=document.createElement('option');option.value=b.id;option.textContent=b.name;group.append(option);});select.append(group);
 }
 select.addEventListener('change',()=>{stop();state.query='';state.person='';state.topic='';$('#search').value='';$('#person').value='';$('#topic').value='';selectEvent(atlas.events.find(e=>e.module==='ot'&&e.book===select.value).id,true);});
}

function renderScriptureFilters(){
 const scope=isOT()?'ot':'history';if($('#person').dataset.scope===scope)return;
 $('#person').dataset.scope=scope;
 const events=atlas.events.filter(e=>isOT()?moduleOf(e)==='ot':moduleOf(e)!=='ot');
 for(const [id,label,values] of [['person','所有人物',[...new Set(events.flatMap(e=>e.people))].sort((a,b)=>a.localeCompare(b,'zh-CN'))],['topic','全部主题',[...new Set(events.map(e=>e.category).filter(Boolean))]]]){
  const select=$('#'+id);select.replaceChildren();const all=document.createElement('option');all.value='';all.textContent=label;select.append(all);
  values.forEach(value=>{const o=document.createElement('option');o.value=value;o.textContent=value;select.append(o);});select.value=state[id]||'';
 }
}
