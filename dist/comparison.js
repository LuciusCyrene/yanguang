'use strict';
let chinaReady=false,chinaLoading=false,chinaSentYear=null,chinaTimeout=null;
let directoryAnchor=null;
function layoutComparison(enabled){
 const sidebar=$('.sidebar'),dialog=$('#directory-dialog'),context=$('#china-context');
 if(!directoryAnchor){directoryAnchor=document.createComment('事件目录原位置');sidebar.before(directoryAnchor);}
 if(enabled){if(sidebar.parentElement!==$('#directory-content'))$('#directory-content').append(sidebar);}
 else{if(dialog.open)dialog.close();if(sidebar.parentElement!==directoryAnchor.parentElement)directoryAnchor.after(sidebar);}
 if(context.parentElement!==$('.workspace'))$('.workspace').append(context);
 context.hidden=!enabled;
 $('.detail-top .eyebrow').textContent=enabled?(isChurch()?'教会史叙事':'使徒行传叙事'):'TEXT & PLACE';
 $('#comparison-early-nav').hidden=!enabled;
}
function renderComparison(){
 const enabled=state.comparison&&!isOT();
 document.body.classList.toggle('comparison-mode',enabled);
 layoutComparison(enabled);
 $('#comparison-toolbar').hidden=isOT();$('#china-panel').hidden=!enabled;
 $('#comparison-toggle').textContent=enabled?'切回单图':'中西同年对照';$('#comparison-toggle').setAttribute('aria-pressed',String(enabled));
 $('#comparison-year').textContent=`公元 ${state.year} 年`;
 $('#china-open').href=`/jiangshan/?year=${state.year}`;
 if(!enabled)return;
 renderChinaResearch();
 if($('#china-panel').dataset.year!==String(state.year)){$('#china-context').setAttribute('aria-busy','true');$('#china-context-year').textContent=`公元 ${state.year} 年`;}
 if(!chinaLoading){
  chinaLoading=true;$('#china-status').textContent='正在载入江山时序中国地图…';
  fetch('comparison-status.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(config=>{
   if(!config.available)throw Error();
   const frame=$('#china-frame');frame.src=`/jiangshan/?embed=1&from=30&to=1648&year=${state.year}&comparison=1`;
   chinaTimeout=setTimeout(()=>{if(!chinaReady)$('#china-status').textContent='中国地图仍在载入，可点击“重新载入”重试。';},12000);
  }).catch(()=>{$('#china-status').textContent='中国地图尚未连接。请使用项目的 scripts/serve.py 启动，并保留相邻的“江山时序”目录。';});
 }
 if(chinaReady&&chinaSentYear!==state.year){
  chinaSentYear=state.year;$('#china-status').textContent=`正在同步 ${state.year} 年…`;
  $('#china-frame').contentWindow.postMessage({type:'bible-atlas:year',year:state.year},location.origin);
 }
}
function fitComparisonMap(){
 const p=atlas.places[current().place],[x,y]=project(p.lon,p.lat),k=.85;
 camera={k,x:550-x*k,y:325-y*k};updateCamera();
}
function renderChinaContext(data){
 const body=$('#china-context-body');
 $('#china-context').dataset.year=data.year;$('#china-context').setAttribute('aria-busy','false');
 $('#china-context-year').textContent=`公元 ${data.year} 年`;
 $('#china-caption').textContent=data.caption||'按当前历史阶段浏览中国局势';
 $('#china-caption').title=data.note||'';
 $('#china-summary').textContent=data.summary||'本阶段暂无朝代概览。';
 $('#china-overview-span').textContent=Array.isArray(data.span)?`${data.span[0]}—${data.span[1]}年全时期`:'';
 const events=(data.recent||[]).filter(e=>Number.isInteger(e.year)&&e.year<=data.year&&e.year>=30&&e.headline);
 $('#china-recent-title').textContent=events.some(e=>e.year===data.year)?'当年纪事':'此前近事';
 $('#china-recent').replaceChildren();$('#china-no-events').hidden=events.length>0;
 events.forEach(e=>{
  const item=document.createElement('li'),button=document.createElement('button'),description=document.createElement('p');
  button.textContent=`${e.year} 年${e.site?' · '+e.site:''}`;button.setAttribute('aria-label',`查看${e.year}年中西对照：${e.headline}`);button.addEventListener('click',()=>browseYear(e.year));
  description.textContent=e.headline;item.append(button,description);$('#china-recent').append(item);
 });
 body.scrollTop=0;
}
function bindComparison(){
 $('#open-directory').addEventListener('click',()=>$('#directory-dialog').showModal());
 $('#close-directory').addEventListener('click',()=>$('#directory-dialog').close());
 $('#directory-content').addEventListener('click',event=>{if(event.target.closest('.event-item'))$('#directory-dialog').close();});
 $('#china-context-toggle').addEventListener('click',()=>{const button=$('#china-context-toggle'),body=$('#china-context-body');body.hidden=!body.hidden;button.textContent=body.hidden?'展开简介':'收起';button.setAttribute('aria-expanded',String(!body.hidden));});
 $('#comparison-toggle').addEventListener('click',()=>{
  state.comparison=!state.comparison;
  const [lo,hi]=browsingRange(),year=Math.max(lo,Math.min(hi,state.year));
  selectEvent(current().id,false,year);
  if(state.comparison)fitComparisonMap();else fitRoute();
 });
 $('#comparison-focus').addEventListener('click',fitComparisonMap);
 document.querySelectorAll('[data-century-year]').forEach(b=>b.addEventListener('click',()=>{if(!state.comparison)state.comparison=true;browseYear(Number(b.dataset.centuryYear));}));
 $('#china-retry').addEventListener('click',()=>{clearTimeout(chinaTimeout);chinaLoading=false;chinaReady=false;chinaSentYear=null;$('#china-frame').src='about:blank';$('#china-context').setAttribute('aria-busy','true');renderComparison();});
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==$('#china-frame').contentWindow)return;
  const data=event.data;
  if(data?.type==='china-atlas:request-year'&&state.comparison&&Number.isInteger(data.year)&&data.year>=30&&data.year<=1648){browseYear(data.year);}
  else if(data?.type==='china-atlas:play'&&state.comparison){togglePlay();}
  else if(data?.type==='china-atlas:ready'){chinaReady=true;chinaSentYear=null;clearTimeout(chinaTimeout);renderComparison();}
  else if(data?.type==='china-atlas:year'){
   if(data.year!==state.year)return;
   $('#china-era').textContent=data.era.startsWith(data.dynasty)?data.era:`${data.dynasty} · ${data.era}`;
   $('#china-status').textContent=`已同步 · 公元 ${data.year} 年`;
   $('#china-panel').dataset.year=data.year;
   renderChinaContext(data);
  }else if(data?.type==='china-atlas:error')$('#china-status').textContent=data.message;
 });
}
