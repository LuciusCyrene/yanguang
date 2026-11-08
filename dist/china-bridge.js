'use strict';
// Adapter injected by our preview server. The Jiangshan checkout stays unchanged.
(()=>{
 const params=new URLSearchParams(location.search);
 if(params.get('comparison')!=='1'||window.parent===window)return;
 let app=null,pending=Number(params.get('year'))||1517,frame=null,ready=false,syncing=false;
 const send=(type,payload={})=>parent.postMessage({type,...payload},location.origin);
 const apply=()=>{
  frame=null;if(!ready)return;
  const year=pending;
  try{
   app.stopAutoplay();syncing=true;try{app.jumpToYear(year);}finally{syncing=false;}
   requestAnimationFrame(()=>{
    if(year!==pending)return;
    const dynasty=app.dynasties[app.dynastyIdx];
    const milestones=(dynasty.milestones||[]).filter(m=>Number.isInteger(m.year)&&m.year>=30&&m.year<=app.year).sort((a,b)=>b.year-a.year);
    const exact=milestones.filter(m=>m.year===app.year);
    const recent=(exact.length?exact:milestones).slice(0,3).map(m=>({year:m.year,headline:m.headline,site:m.site||''}));
    send('china-atlas:year',{summary:app.dynastySummary(dynasty),span:[dynasty.fromYear,dynasty.toYear],recent,year:app.year,dynasty:app.dynastyName(dynasty),era:app.formatEraLabel(app.year,dynasty),caption:app.lastRenderedSnap?.caption||'',note:app.lastRenderedSnap?.note||''});
   });
  }catch(error){send('china-atlas:error',{message:'中国地图暂未完成年份切换，请重试。'});}
 };
 document.addEventListener('keydown',event=>{
  if(/INPUT|SELECT|TEXTAREA/.test(event.target.tagName))return;
  if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();event.stopImmediatePropagation();send('china-atlas:request-year',{year:Math.max(30,Math.min(1648,pending+(event.key==='ArrowRight'?1:-1)*(event.shiftKey?10:1)))});}
  else if(event.code==='Space'){event.preventDefault();event.stopImmediatePropagation();send('china-atlas:play');}
 },true);
 window.addEventListener('message',event=>{
  if(event.source!==parent||event.origin!==location.origin||event.data?.type!=='bible-atlas:year')return;
  const year=Number(event.data.year);if(!Number.isInteger(year)||year<30||year>1648)return;
  pending=year;if(frame===null)frame=requestAnimationFrame(apply);
 });
 const init=async()=>{
  app=window.atlasApp;if(!app){setTimeout(init,80);return;}
  try{
   await app._ensureFullSnapshots();
   app._syncAutoMilestoneBalloon=()=>{};app.closeMilestoneBalloon();
   const originalJump=app.jumpToYear.bind(app);
   app.jumpToYear=year=>{
    if(syncing)return originalJump(year);
    const value=Math.max(30,Math.min(1648,Math.round(Number(year))));
    if(Number.isFinite(value))send('china-atlas:request-year',{year:value});
   };
   ready=true;
   document.documentElement.classList.add('bible-comparison');
   // The outer atlas owns chronology. Keep map gestures and place inspection available.
   document.querySelector('#embed-shield')?.classList.add('is-hidden');
   app._embedActive=true;
   send('china-atlas:ready');apply();
  }catch(error){send('china-atlas:error',{message:'中国地图资源未能载入，请检查本地江山时序目录。'});}
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
