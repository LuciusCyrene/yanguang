'use strict';
const $ = (selector) => document.querySelector(selector);
const ns = 'http://www.w3.org/2000/svg';
let detailedLandMask, overviewLandMask;
let atlas, politicsData, state, timer = null, camera = {x: 0, y: 0, k: 1}, drag = null, labels = true;
const svgNode = (tag, attributes = {}, content = '') => {
  const node = document.createElementNS(ns, tag);
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
  if (content) node.textContent = content;
  return node;
};
const mercator = lat => Math.log(Math.tan(Math.PI/4+Math.max(-85.05,Math.min(85.05,lat))*Math.PI/360))*180/Math.PI;
const project = (lon, lat) => [(lon-7)*29,(mercator(46)-mercator(lat))*29];
const current = () => atlas.events.find(e => e.id === state.event);
const route = () => atlas.routes.find(r => r.id === state.route);
const routeEvents = () => atlas.events.filter(e => e.route === state.route);
function matches(event) {
  const place = atlas.places[event.place];
  const text = [event.title, event.summary, ...(event.narrative || []), event.ref, sourceLabel(event), String(event.year), event.yearLabel||'', event.category||'', place.name, place.english, place.modern, ...event.people].join(' ').toLowerCase();
  const personMatch = !state.person || event.people.includes(state.person) || (state.person === '保罗' && event.people.includes('扫罗'));
  const topicMatch=!state.topic||event.category===state.topic;
  return personMatch && topicMatch && (!state.query || text.includes(state.query.toLowerCase()));
}
function visibleEvents() {
  return atlas.events.filter(e => (isOT()?moduleOf(e)==='ot':moduleOf(e)!=='ot') && (state.query || state.person || state.topic || e.route === state.route) && matches(e));
}
function updateCamera() {
  const broad=state?.module==='world'&&camera.k<.5;
  $('#land').style.display=broad?'none':'';
  $('#terrain-layer').style.display=!broad&&$('#terrain-check').checked?'':'none';
  $('#water-layer').style.display=!broad&&$('#water-check').checked?'':'none';
  $('#geographic-labels').style.display=!broad&&$('#regions-check').checked?'':'none';
  $('#map-world').setAttribute('transform', `translate(${camera.x} ${camera.y}) scale(${camera.k})`);
  const bounds=$('#map').getBoundingClientRect();
  const screenScale=Math.max(.1,Math.min(bounds.width/1100,bounds.height/650));
  const factor=screenScale*camera.k;
  updateOTLayers();updateCultureMarkerScale();
  const nodes=[...document.querySelectorAll('.city, .context-city, .connection-node, .ot-site')];
  nodes.forEach(g=>{
    const selected=g.classList.contains('active'), text=g.querySelector('text');
    text.style.fontSize=`${10.5/factor}px`;text.style.strokeWidth=`${3/factor}px`;
    text.setAttribute('x',8/factor);
    text.setAttribute('y',(Number(text.getAttribute('y'))<0?-10:16)/factor);
    text.style.visibility='visible';text.setAttribute('opacity','1');
    g.querySelector('.point').setAttribute('r',(selected?5:g.classList.contains('context-city')?2:3)/factor);
    const hit=g.querySelector('.hit-target');if(hit)hit.setAttribute('r',(g.classList.contains('context-city')?5.5:9)/factor);
    const halo=g.querySelector('.halo');if(halo)halo.setAttribute('r',12/factor);
  });
  const occupied=[];
  nodes.sort((a,b)=>Number(b.classList.contains('active'))-Number(a.classList.contains('active'))).forEach(g=>{
    const text=g.querySelector('text'),r=text.getBoundingClientRect();
    const overlaps=occupied.some(o=>r.left<o.right+4&&r.right>o.left-4&&r.top<o.bottom+3&&r.bottom>o.top-3);
    if(overlaps&&!g.classList.contains('active'))text.style.visibility='hidden';
    else occupied.push(r);
  });
  document.querySelectorAll('#political-labels text, #geographic-labels text, .river-label, .ot-region-label').forEach(text=>{
    const sea=text.classList.contains('sea-label');
    text.style.fontSize=`${(sea||text.classList.contains('ot-region-label')?12:text.classList.contains('major-polity')?11:9)/factor}px`;
    text.style.letterSpacing=`${(sea?3:1)/factor}px`;
    text.style.strokeWidth=`${2/factor}px`;
    const r=text.getBoundingClientRect();
    const overlaps=occupied.some(o=>r.left<o.right+5&&r.right>o.left-5&&r.top<o.bottom+4&&r.bottom>o.top-4);
    text.style.visibility=overlaps?'hidden':'visible';if(!overlaps)occupied.push(r);
  });
  const centreLat=2*Math.atan(Math.exp((mercator(46)-(325-camera.y)/camera.k/29)*Math.PI/180))*180/Math.PI-90;
  const kmPerPixel=111.32*Math.cos(centreLat*Math.PI/180)/(29*camera.k*screenScale);
  const raw=80*kmPerPixel;
  const power=10**Math.floor(Math.log10(raw));
  const km=[1,2,5,10].map(n=>n*power).filter(n=>n<=raw).at(-1)||power;
  $('#scale-label').textContent=`${km} km`;
  $('#scale-line').style.width=`${km/kmPerPixel}px`;
}
function fitRoute() {
  const points = routeEvents().map(e => { const p = atlas.places[e.place]; return project(p.lon, p.lat); });
  const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const k = Math.min(isOT()?16:3.1, 820 / Math.max(isOT()?35:160, x1-x0), 370 / Math.max(isOT()?25:100, y1-y0));
  camera = {k, x:550 - (x0+x1)/2*k, y:355 - (y0+y1)/2*k};
  updateCamera();
}
function geometryPath(geometry) {
  const line=points=>points.map(([lon,lat],i)=>`${i?'L':'M'}${project(lon,lat).map(v=>v.toFixed(2)).join(',')}`).join(' ');
  if(geometry.type==='LineString')return line(geometry.coordinates);
  if(geometry.type==='MultiLineString')return geometry.coordinates.map(line).join(' ');
  const polygons=geometry.type==='Polygon'?[geometry.coordinates]:geometry.coordinates;
  return polygons.map(p=>p.map(ring=>line(ring)+' Z').join(' ')).join(' ');
}
function drawLand(land,rivers,lakes,geography,overview) {
  overviewLandMask=overview.features.map(f=>geometryPath(f.geometry)).join(' ');
  detailedLandMask=land.features.map(f=>geometryPath(f.geometry)).join(' ');
  overview.features.forEach(f=>$('#overview-land').append(svgNode('path',{d:geometryPath(f.geometry),class:'overview-land-shape','fill-rule':'evenodd'})));
  const fragments=document.createDocumentFragment();
  land.features.forEach(f=>fragments.append(svgNode('path',{d:geometryPath(f.geometry),class:'land-shape','fill-rule':'evenodd'})));
  $('#land').append(fragments);
  $('#political-land-mask').setAttribute('d',land.features.map(f=>geometryPath(f.geometry)).join(' '));
  $('#political-land-mask').setAttribute('fill-rule','evenodd');
  const [west,south,east,north]=geography.bounds;
  const [x,y]=project(west,north),[x1,y1]=project(east,south);
  const mask=$('#political-data-mask');Object.entries({x:x+4,y:y+4,width:x1-x-8,height:y1-y-8}).forEach(([key,value])=>mask.setAttribute(key,value));
  $('#terrain-layer').append(svgNode('image',{href:'data/terrain.webp',x,y,width:x1-x,height:y1-y,preserveAspectRatio:'none',class:'terrain-image'}));
  for(const [data,cls] of [[rivers,'river-shape'],[lakes,'lake-shape']]) data.features.forEach(f=>{
    const path=svgNode('path',{d:geometryPath(f.geometry),class:cls,'fill-rule':'evenodd'});
    path.append(svgNode('title',{},f.properties.name_zh||f.properties.name||'自然水系'));
    $('#water-layer').append(path);
  });
  [[35.58,32.82,'加利利海'],[35.48,31.47,'死海'],[31.12,30.7,'尼罗河'],[35.57,32.22,'约旦河']].forEach(([lon,lat,title])=>{
    const [x,y]=project(lon,lat);$('#water-layer').append(svgNode('text',{x,y,class:'river-label'},title));
  });
  atlas.mapLabels.forEach(([lon,lat,title,type])=>{
    const [x,y]=project(lon,lat);
    $('#geographic-labels').append(svgNode('text',{x,y,class:type==='sea'?'sea-label':type==='mountain'?'mountain-label':type==='island'?'island-label':'geographic-label','text-anchor':'middle'},title));
  });
}
function drawContextCities() {
  $('#context-cities').replaceChildren();
  if(!$('#context-check').checked)return;
  const routePlaces=new Set(routeEvents().map(e=>e.place));
  const modulePlaces=new Set(moduleEvents().map(e=>e.place));
  Object.entries(atlas.places).filter(([id])=>!routePlaces.has(id)&&modulePlaces.has(id)).forEach(([id,p])=>{
    const [x,y]=project(p.lon,p.lat);
    const g=svgNode('g',{transform:`translate(${x},${y})`,class:'context-city',role:'button',tabindex:'0','aria-label':`${p.name}，其他阶段地点`});
    g.append(svgNode('circle',{r:10,class:'hit-target'}),svgNode('circle',{r:3,class:'point'}),svgNode('text',{x:8,y:16},p.name));
    const select=()=>{selectEvent(atlas.events.find(e=>e.place===id&&moduleOf(e)===state.module).id);if(innerWidth<=1150)$('.detail').classList.add('open');};
    g.addEventListener('click',select);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select();}});
    $('#context-cities').append(g);
  });
}
function drawMap() {
  const events = routeEvents(), active = current(), index = events.indexOf(active);
  renderPolitics();
  $('#paths').replaceChildren(); $('#cities').replaceChildren();
  if (state.route !== 'beginnings' && route().type!=='overview') events.slice(1).forEach((e,i)=>{
    const a=atlas.places[events[i].place],b=atlas.places[e.place];
    const points=[[a.lon,a.lat],...(e.waypoints||[]),[b.lon,b.lat]];
    const d=points.map(([lon,lat],j)=>`${j?'L':'M'}${project(lon,lat).join(',')}`).join(' ');
    const path=svgNode('path',{d,class:`route-path ${e.arrivalMode} ${i<index?'visited':''} ${i===index-1?'current-leg':''}`});
    path.append(svgNode('title',{},e.arrivalMode==='drift'?'漂流方向示意：确切船迹未知':e.arrivalMode==='sea'?'海路示意：非精确航迹':'陆路示意：非古道复原'));
    $('#paths').append(path);
  });
  drawHistoryConnections();
  drawContextCities();drawOTSites();
  const ids = [...new Set(events.map(e=>e.place))];
  // Put the active marker last so it remains selectable at close geographical points.
  ids.sort((a,b)=>Number(a===active.place)-Number(b===active.place));
  const placements = [];
  ids.forEach(id => {
    const place = atlas.places[id], [x,y] = project(place.lon,place.lat);
    const selected = active.place === id;
    const g = svgNode('g',{transform:`translate(${x},${y})`, class:`city ${selected?'active':''}`,role:'button',tabindex:'0','aria-label':`${place.name}，选择相关纪事`});
    g.append(svgNode('title',{},`${place.name} · ${place.english}`));
    if (selected) g.append(svgNode('circle',{r:14,class:'halo'}));
    g.append(svgNode('circle',{r:12,class:'hit-target'}),svgNode('circle',{r:selected?5.7:3.3,class:'point'}));
    // Alternate nearby labels to reduce collisions without hiding the selected stop.
    const crowded = placements.some(p=>Math.abs(p[0]-x)<90 && Math.abs(p[1]-y)<22);
    const dy = crowded ? -12 : 18;
    const text = svgNode('text',{x:8,y:dy,'text-anchor':'start'},place.name);
    if (crowded && !selected && camera.k < 1.5) text.setAttribute('opacity','.7');
    g.append(text); placements.push([x,y+dy]);
    const select = () => {
      const candidates = events.filter(e=>e.place===id);
      const event = candidates.find(e=>e.id===state.event) || candidates[0];
      selectEvent(event.id);
      if(innerWidth<=1150) $('.detail').classList.add('open');
    };
    g.addEventListener('click',()=>{if(!drag?.moved) select();});
    g.addEventListener('keydown', e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select();}});
    $('#cities').append(g);
  });
  renderCultureMap();updateCamera();
}
function renderList() {
  const events = visibleEvents();
  $('#result-count').textContent = `${events.length} 则`;
  $('#list-heading').textContent = state.query || state.person || state.topic ? (isOT()?'旧约检索结果':'全站检索结果') : isOT()?'经文节点':isChurch()?'历史纪事':'旅程纪事';
  $('#event-list').replaceChildren();
  if(!events.length){const p=document.createElement('p');p.className='empty';p.textContent=isOT()?'没有匹配的经文节点。可尝试“耶利米”“尼尼微”或“圣殿”。':'没有匹配的纪事。可尝试“保罗”“以弗所”或“16:”。';$('#event-list').append(p);return;}
  events.forEach((event,i)=>{
    const button=document.createElement('button');button.className=`event-item ${event.id===state.event?'active':''}`;
    button.setAttribute('aria-current',event.id===state.event?'step':'false');
    const num=document.createElement('span');num.className='step-number';num.textContent=String(i+1).padStart(2,'0');
    const body=document.createElement('span'), title=document.createElement('strong'), meta=document.createElement('small');
    title.textContent=event.title;meta.textContent=moduleOf(event)==='ot'?event.ref:moduleOf(event)!=='acts'?`${eventYearLabel(event)} · ${event.category}`:`约 ${event.year} 年 · 徒 ${event.ref}`;body.append(title,meta);button.append(num,body);
    button.addEventListener('click',()=>{selectEvent(event.id);if(innerWidth<=1150)$('.detail').classList.add('open');});
    $('#event-list').append(button);
  });
  const active = $('#event-list .active');
  if(active){ const box=$('#event-list').getBoundingClientRect(), rect=active.getBoundingClientRect(); if(rect.top<box.top||rect.bottom>box.bottom) $('#event-list').scrollTop += rect.top-box.top-35; }
}
function renderDetails() {
  const e=current(), p=atlas.places[e.place], r=route(), events=routeEvents(), index=events.indexOf(e);
  document.documentElement.style.setProperty('--accent',r.color);
  $('#route-title').textContent=r.name; $('#route-subtitle').textContent=isOT()?`${r.section} · 经文顺序阅读`:isChurch()?`公元 ${r.years} 年 · 历史纪事与史料`:`${r.years} 年 · 使徒行传 ${r.ref}`;
  $('#map-kicker').textContent=`${isOT()?'NEVI’IM':state.module==='world'?'WORLD CHURCH':isChurch()?'EARLY CHURCH':'ACTS'} / ${String(atlas.routes.filter(item=>(item.module||'acts')===state.module).indexOf(r)+1).padStart(2,'0')} · ${r.short}`;
  $('#event-route').textContent=r.short;$('#folio').textContent=`${String(index+1).padStart(2,'0')} / ${events.length}`;
  $('#detail-date').textContent=isOT()?`${e.bookName} · ${e.storyKind} · 经文节点 ${e.position}`:isChurch()?`${eventYearLabel(e)} · ${e.certainty}${e.sourceType?' · '+e.sourceType:''}`:`约公元 ${e.year} 年 · 推定编年`;
  $('#event-title').textContent=e.title;$('#scripture-ref').textContent=sourceLabel(e);$('#event-summary').textContent=e.summary;
  renderNarrative();
  $('#read-scripture').href=e.primarySource.url;
  const sourceArrow=document.createElement('span');sourceArrow.textContent='↗';$('#read-scripture').replaceChildren(document.createTextNode(isChurch()?'阅读史料与参考':'阅读这一段经文'),sourceArrow);
  renderAdditionalSources(e);
  $('#place-name').textContent=p.name;$('#place-english').textContent=p.english;$('#place-modern').textContent=p.modern;
  $('#place-region').textContent=p.region;$('#place-context').textContent=eventPlaceContext(p);
  $('#place-coordinates').textContent=`${Math.abs(p.lat).toFixed(2)}° ${p.lat<0?'S':'N'} / ${Math.abs(p.lon).toFixed(2)}° ${p.lon<0?'W':'E'} · 近似定位`;
  $('#event-people').replaceChildren();
  e.people.forEach(person=>{const b=document.createElement('button');b.textContent=person;b.title=`检索全书中${person}的纪事`;b.addEventListener('click',()=>{$('#person').value=person;state.person=person;renderList();renderPlayback();if(innerWidth<=700)$('.detail').classList.remove('open');});$('#event-people').append(b);});
  $('#place-events').replaceChildren();
  atlas.events.filter(item=>item.place===e.place).forEach(item=>{const b=document.createElement('button');b.className='related-event';b.textContent=item.title;const s=document.createElement('small');s.textContent=moduleOf(item)==='ot'?item.ref:moduleOf(item)!=='acts'?`${eventYearLabel(item)} · ${item.category}`:`约 ${item.year} 年 · 徒 ${item.ref}`;b.append(s);b.addEventListener('click',()=>selectEvent(item.id));$('#place-events').append(b);});
  $('.evidence summary').textContent=isOT()?'经文顺序与地图依据':isChurch()?'年代与史料依据':'年代与路线依据';
  const comparison=$('.evidence a');comparison.href=isOT()?'data/OLD-TESTAMENT-SOURCES.md':isChurch()?`data/${state.module==='world'?'WORLD-CHURCH':'CHURCH-HISTORY'}-SOURCES.md`:'https://www.esv.org/resources/esv-global-study-bible/chart-44-06/';comparison.textContent=isOT()?'旧约经卷与地图说明 ↗':isChurch()?'查阅本篇章来源说明 ↗':'比较保罗生平年表 ↗';
  $('#evidence-note').textContent=isOT()?r.note:`${r.note} ${atlas.editorial}`;
  $('#year-display').replaceChildren(document.createTextNode(state.year)); const yearUnit=document.createElement('span');yearUnit.textContent=isOT()?'节点':'年';$('#year-display').append(yearUnit);
  $('#timeline-event').textContent=e.title;$('#timeline-position').textContent=isOT()?`${e.ref} · 本卷第 ${index+1} / ${events.length} 则`:state.year===e.year?`${r.short} · 第 ${index+1} / ${events.length} ${isChurch()?'则':'站'}`:`浏览 ${state.year} 年 · 所选纪事约 ${e.year} 年`;
  const range=$('#year-range');const [minYear,maxYear]=browsingRange();range.min=minYear;range.max=maxYear;range.value=state.year;
  range.setAttribute('aria-valuetext',isOT()?`经文节点${e.position}，${e.ref}：${e.title}`:`浏览约公元${state.year}年，所选纪事：${e.title}`);
  renderTimeline();
  document.querySelectorAll('.route-tab').forEach(b=>{const selected=b.dataset.route===state.route;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',selected);});
  $('#share-status').textContent=''; renderPlayback();
}
function renderNarrative(){
  const e=current(),p=atlas.places[e.place],r=route();
  $('#event-narrative').replaceChildren();$('#reading-body').replaceChildren();
  e.narrative.forEach((text,i)=>{
    const para=document.createElement('p');para.textContent=text;
    const title=e.narrativeHeadings[i]||'补充说明',heading=document.createElement('h3');heading.textContent=title;
    $('#reading-body').append(heading.cloneNode(true),para.cloneNode(true));
    if(i<e.narrative.length-1)$('#event-narrative').append(heading,para);
    else {$('#event-note-heading').textContent=title;$('#event-reading-note').textContent=text;}
  });
  const count=e.narrative.join('').length;
  $('#reading-length').textContent=`${count} 字 · 约 ${Math.max(1,Math.ceil(count/300))} 分钟`;
  $('#transport-label').textContent=isOT()?`经文文类 · ${e.storyKind} · 地点为阅读参照`:isChurch()?`历史主题 · ${e.category}${e.connections?.length?' · '+e.connections.map(c=>c.kind).filter((x,i,a)=>a.indexOf(x)===i).join(' / '):''}`:{context:'多人物活动 · 不连成连续路线',sea:'本段为海路示意',land:'本段为陆路示意',drift:'漂流示意 · 船迹未知'}[e.arrivalMode];
  $('#journey-intro').textContent=r.intro;
  $('#journey-connections').hidden=!e.connections?.length;$('#journey-connections').textContent=(e.connections||[]).map(c=>`${c.kind}：${atlas.places[c.from].name} ↔ ${atlas.places[c.to].name}`).join('；');
  $('#reading-title').textContent=e.title;$('#reading-meta').textContent=`${eventYearLabel(e)} · ${sourceLabel(e)} · ${p.name}`;
  $('#reading-place-title').textContent=`地点背景 · ${p.name}`;$('#reading-place-context').textContent=eventPlaceContext(p);
  $('#reading-source').href=e.primarySource.url;$('#reading-source').textContent=isChurch()?'查阅文献与研究 ↗':'对照完整经文 ↗';
}
function sequence() {
  return state.query || state.person || state.topic ? visibleEvents() : isOT()?moduleEvents():state.comparison?comparisonEvents():routeEvents();
}
function renderPlayback(){const seq=sequence(),i=seq.findIndex(e=>e.id===state.event);$('#previous').disabled=!seq.length||i<=0;$('#next').disabled=!seq.length||i===seq.length-1;$('#play').disabled=!seq.length;$('#reading-previous').disabled=!seq.length||i<=0;$('#reading-next').disabled=!seq.length||i===seq.length-1;}
function selectEvent(id, fit=false, browsingYear=null) {
  const event=atlas.events.find(e=>e.id===id);if(!event)return;
  if(moduleOf(event)==='ot'){if(state.module!=='ot')state.comparisonBeforeOT=state.comparison;state.comparison=false;}
  else if(state.module==='ot')state.comparison=state.comparisonBeforeOT??(moduleOf(event)==='world');
  const eventChanged=event.id!==state.event;const routeChanged=event.route!==state.route;if(moduleOf(event)==='acts'&&state.module!=='acts'){state.topic='';$('#topic').value='';}state.event=id;state.route=event.route;state.year=browsingYear??eventPosition(event);state.module=moduleOf(event);state.lastEvents??={};state.lastEvents[state.module]=id;renderModuleUI();
  renderDetails();renderList();if($('#reading-dialog').open)$('#reading-dialog').scrollTop=0;if(isOT())fitOTView();else if(routeChanged||fit)fitRoute();if(state.comparison&&(eventChanged||routeChanged||fit))fitComparisonMap();drawMap();
  const url=new URL(location.href);url.searchParams.set('route',state.route);url.searchParams.set('event',state.event);url.searchParams.set(isOT()?'node':'year',state.year);url.searchParams.delete(isOT()?'year':'node');url.searchParams.set('module',state.module);url.searchParams.set('compare',state.comparison?'1':'0');history.replaceState(null,'',url);if(typeof rememberHistoryPosition==='function'&&!isPhilosophyView())rememberHistoryPosition();
}
function stop(){clearInterval(timer);timer=null;$('#play').textContent='▶';$('#play').setAttribute('aria-label',isChurch()?'自动浏览纪事':'自动播放旅程');}
function step(delta){const seq=sequence();if(!seq.length)return;const i=seq.findIndex(e=>e.id===state.event);const next=i<0?0:i+delta;if(next>=0&&next<seq.length)selectEvent(seq[next].id);else stop();}
function togglePlay(){if(timer){stop();return;}const seq=sequence();if(!seq.length)return;if(seq.at(-1)?.id===state.event)selectEvent(seq[0].id);timer=setInterval(()=>step(1),2400);$('#play').textContent='Ⅱ';$('#play').setAttribute('aria-label','暂停播放');}
function zoom(factor,point={x:550,y:330}){const k=Math.max(.04,Math.min(isOT()?64:20,camera.k*factor));const f=k/camera.k;camera.x=point.x-(point.x-camera.x)*f;camera.y=point.y-(point.y-camera.y)*f;camera.k=k;updateCamera();}
function mapPoint(e){const pt=new DOMPoint(e.clientX,e.clientY);return pt.matrixTransform($('#map').getScreenCTM().inverse());}
function bindControls(){
  bindComparison();bindResearch();bindComparisonReader();bindWorldCulture();bindOldTestament();bindOTMap();
  document.querySelectorAll('[data-module-choice]').forEach(button=>button.addEventListener('click',()=>chooseModule(button.dataset.moduleChoice)));
  $('#topic').addEventListener('change',e=>{stop();state.topic=e.target.value;renderList();renderPlayback();});
  $('#politics-button').addEventListener('click',()=>$('#politics-dialog').showModal());
  $('#close-politics').addEventListener('click',()=>$('#politics-dialog').close());
  $('#politics-check').addEventListener('change',()=>{renderPolitics();updateCamera();});
  $('#administration-check').addEventListener('change',()=>{renderPolitics();updateCamera();});
  $('#layer-toggle').addEventListener('click',()=>{const open=$('#layer-options').hidden;$('#layer-options').hidden=!open;$('#layer-toggle').setAttribute('aria-expanded',open);});
  [['terrain-check','terrain-layer'],['water-check','water-layer'],['regions-check','geographic-labels']].forEach(([control,group])=>$('#'+control).addEventListener('change',e=>{$('#'+group).style.display=e.target.checked?'':'none';updateCamera();}));
  $('#context-check').addEventListener('change',()=>{drawContextCities();updateCamera();});
  $('#focus-place').addEventListener('click',()=>{const p=atlas.places[current().place],[x,y]=project(p.lon,p.lat);camera={k:10,x:550-x*10,y:350-y*10};updateCamera();if(innerWidth<=1150)$('.detail').classList.remove('open');});
  $('#expand-reading').addEventListener('click',()=>$('#reading-dialog').showModal());
  $('#close-reading').addEventListener('click',()=>$('#reading-dialog').close());
  $('#reading-previous').addEventListener('click',()=>{stop();step(-1);});$('#reading-next').addEventListener('click',()=>{stop();step(1);});
  $('#search').addEventListener('input',e=>{stop();state.query=e.target.value.trim();renderList();renderPlayback();});
  $('#person').addEventListener('change',e=>{stop();state.person=e.target.value;renderList();renderPlayback();});
  $('#clear-filters').addEventListener('click',()=>{state.person='';state.query='';state.topic='';$('#person').value='';$('#search').value='';$('#topic').value='';renderList();renderPlayback();});
  $('#previous').addEventListener('click',()=>{stop();step(-1);});$('#next').addEventListener('click',()=>{stop();step(1);});$('#play').addEventListener('click',togglePlay);
  bindTimeline();
  $('#zoom-in').addEventListener('click',()=>zoom(1.25));$('#zoom-out').addEventListener('click',()=>zoom(.8));$('#reset-map').addEventListener('click',()=>isOT()?fitOTView():fitRoute());
  $('#labels-button').addEventListener('click',()=>{labels=!labels;$('#map').classList.toggle('hide-labels',!labels);$('#labels-button').setAttribute('aria-pressed',labels);});
  $('#map').addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY<0?1.12:1/1.12,mapPoint(e));},{passive:false});
  $('#map').addEventListener('pointerdown',e=>{if(e.target.closest('.city, .context-city, .ot-site, .culture-map-point')||e.button!==0)return;const p=mapPoint(e);drag={start:p,x:camera.x,y:camera.y,moved:false};$('#map').setPointerCapture(e.pointerId);$('#map').classList.add('dragging');});
  $('#map').addEventListener('pointermove',e=>{if(!drag)return;const p=mapPoint(e);drag.moved=Math.hypot(p.x-drag.start.x,p.y-drag.start.y)>3;camera.x=drag.x+p.x-drag.start.x;camera.y=drag.y+p.y-drag.start.y;updateCamera();});
  const endDrag=()=>{drag=null;$('#map').classList.remove('dragging');};$('#map').addEventListener('pointerup',endDrag);$('#map').addEventListener('pointercancel',endDrag);
  $('#open-detail').addEventListener('click',()=>$('.detail').classList.add('open'));$('#close-detail').addEventListener('click',()=>$('.detail').classList.remove('open'));
  $('#sources-button').addEventListener('click',()=>$('#sources-dialog').showModal());$('#close-sources').addEventListener('click',()=>$('#sources-dialog').close());
  $('#sources-dialog').addEventListener('click',e=>{if(e.target===$('#sources-dialog')){const rect=e.target.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)e.target.close();}});
  $('#share').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);$('#share-status').textContent='链接已复制';}catch{$('#share-status').textContent=location.href;}});
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){$('.detail').classList.remove('open');stop();if(typeof stopPhilosophy==='function')stopPhilosophy();return;}
    if(typeof isPhilosophyView==='function'&&isPhilosophyView()){handlePhilosophyKey(e);return;}
    if(/INPUT|TEXTAREA|SELECT|BUTTON/.test(document.activeElement.tagName)||document.activeElement.getAttribute('role')==='button'||$('#sources-dialog').open||$('#reading-dialog').open||$('#politics-dialog').open||$('#reform-dialog').open||$('#directory-dialog').open||$('#ot-place-dialog').open||$('#historical-image-dialog').open||$('#comparison-reader-dialog').open)return;
    if(e.key==='/'){e.preventDefault();if(state.comparison&&!$('#directory-dialog').open)$('#directory-dialog').showModal();$('#search').focus();}else if(e.key==='ArrowRight'){e.preventDefault();stop();step(1);}else if(e.key==='ArrowLeft'){e.preventDefault();stop();step(-1);}else if(e.code==='Space'){e.preventDefault();togglePlay();}
  });
  window.addEventListener('pagehide',stop);
  window.addEventListener('resize',updateCamera);
}
async function init(){
  try{
    const responses=await Promise.all([fetch('data/atlas.json'),fetch('data/land.json'),fetch('data/rivers.json'),fetch('data/lakes.json'),fetch('data/geography.json'),fetch('data/politics.json'),fetch('data/politics-church.json'),fetch('data/land-overview.json'),fetch('data/politics-world.json'),fetch('data/ot-gazetteer.json'),fetch('data/ot-terrain.json'),fetch('data/ot-waterways.geojson'),fetch('data/historical-media.json'),fetch('data/comparison-reader.json'),fetch('data/philosophy-tree.json'),fetch('data/philosophy-gallery.json'),fetch('data/philosophy-atlas.json?v=25'),fetch('data/philosophy-guide.json?v=23')]);
    if(responses.some(r=>!r.ok))throw new Error('资源未能载入');
    const [data,land,rivers,lakes,geography,polities,churchPolities,overview,worldPolities,otGazetteerData,otTerrainData,otWaterData,mediaData,readerData,treeData,galleryData,philosophyData,guideData]=await Promise.all(responses.map(r=>r.json()));atlas=data;historicalMediaData=mediaData;comparisonReaderData=readerData;initPhilosophyTree(treeData,galleryData);philosophyAtlasData=philosophyData;politicsData={...polities,features:[...polities.features,...churchPolities.features,...worldPolities.features]};
    const params=new URLSearchParams(location.search);restoreHistoryPosition(params);const requestedReading=params.get('read');const requested=atlas.events.find(e=>e.id===params.get('event'));
    const requestedModule=atlas.modules.some(m=>m.id===params.get('module'))?params.get('module'):Number(params.get('year'))>451?'world':Number(params.get('year'))>62?'church':'acts';
    const validRoute=atlas.routes.some(r=>r.id===params.get('route')&&r.module===requestedModule)?params.get('route'):requestedModule==='ot'?'ot-joshua':requestedModule==='world'?'medieval-roots':requestedModule==='church'?'apostolic-after':'second';
    const initial=requested||atlas.events.find(e=>e.route===validRoute&&(validRoute!=='second'||e.place==='philippi'));
    state={comparison:moduleOf(initial)!=='ot'&&(params.get('compare')==='1'||(moduleOf(initial)==='world'&&params.get('compare')!=='0')),route:initial.route,event:initial.id,module:moduleOf(initial),query:'',person:'',topic:'',lastEvents:{}};
    [...new Set(atlas.events.filter(e=>e.module!=='acts').map(e=>e.category))].forEach(topic=>{const o=document.createElement('option');o.value=topic;o.textContent=topic;$('#topic').append(o);});
    [...new Set(atlas.events.flatMap(e=>e.people))].sort((a,b)=>a.localeCompare(b,'zh-CN')).forEach(person=>{const o=document.createElement('option');o.value=person;o.textContent=person;$('#person').append(o);});
    atlas.sources.forEach(source=>{const a=document.createElement('a');a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=`${source.title} ↗`;const p=document.createElement('p');p.textContent=source.usage;$('#sources-list').append(a,p);});
    $('#editorial-note').textContent=atlas.editorial;
    const requestedYear=Number(params.get(isOT()?'node':'year'));
    const [minYear,maxYear]=browsingRange();
    const initialYear=Number.isInteger(requestedYear)&&requestedYear>=minYear&&requestedYear<=maxYear?requestedYear:eventPosition(initial);
    drawLand(land,rivers,lakes,geography,overview);initOTGeography(otGazetteerData,otTerrainData,otWaterData);bindControls();selectEvent(initial.id,true,initialYear);
    if(!requested&&params.has(isOT()?'node':'year')&&requestedYear>=minYear&&requestedYear<=maxYear)browseYear(initialYear);
    initPhilosophyGuide(guideData);initPhilosophyAtlas(philosophyData,params);
    if(requestedReading&&typeof restoreReadingLink==='function')restoreReadingLink(requestedReading,params.get('readArea'));else if(isPhilosophyView()&&['guide','overview'].includes(philosophyView)&&guidePersonNode(params.get('phGuide')))openGuidePerson(params.get('phGuide'),true,{id:params.get('phGuide'),tab:validGuideTab(params.get('phGuideTab'))?params.get('phGuideTab'):'profile',scroll:0,details:[]});
  }catch(error){$('#load-error').hidden=false;$('#load-error').textContent=`地图未能载入：${error.message}。请在项目目录运行 python3 scripts/serve.py，然后访问 http://127.0.0.1:8001。`;console.error(error);}
}
init();
