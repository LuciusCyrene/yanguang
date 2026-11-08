'use strict';
// A native range supplies pointer, touch and keyboard behavior over a proportional rail.
let timelineModule=null, timelineViewKey=null, timelineZoom=false, timelineFrame=null, timelinePendingYear=null, timelinePendingModule=null;
const timelineDomain=()=>timelineZoom?[Math.min(route().range[0],state.year),Math.max(route().range[1],state.year)]:browsingRange();
const timelinePercent=year=>{const [lo,hi]=timelineDomain();return 100*(year-lo)/(hi-lo);};
function renderTimeline(){
 const scopeKey=`${state.module}:${state.comparison}`;
 if(timelineModule!==scopeKey){timelineZoom=false;timelineModule=scopeKey;timelinePendingYear=null;if(timelineFrame!==null)cancelAnimationFrame(timelineFrame);timelineFrame=null;}
 const [lo,hi]=timelineDomain();
 const events=(state.comparison?comparisonEvents():moduleEvents()).filter(e=>eventPosition(e)>=lo&&eventPosition(e)<=hi);
 const viewKey=`${state.comparison?'comparison':state.module}:${lo}:${hi}`;
 $('#year-range').min=lo;$('#year-range').max=hi;$('#year-range').value=state.year;
 $('#timeline-scope').textContent=isOT()?(timelineZoom?'查看全部经卷 ↙':'放大本卷 ↗'):timelineZoom?(state.comparison?'查看全时段 ↙':'查看全篇 ↙'):'放大当前阶段 ↗';$('#timeline-scope').setAttribute('aria-pressed',String(timelineZoom));
 if(timelineViewKey!==viewKey){
  timelineViewKey=viewKey;
  $('#timeline-bands').replaceChildren();$('#timeline-ticks').replaceChildren();$('#timeline-markers').replaceChildren();
  const phases=atlas.routes.filter(r=>state.comparison?r.module!=='ot':(r.module||'acts')===state.module);
  phases.forEach((r,i)=>{
   const start=Math.max(lo,r.range[0]),end=Math.min(hi,i===phases.length-1?hi:phases[i+1].range[0]);
   if(end<=start)return;
   const band=document.createElement('span');band.className='timeline-band';band.dataset.route=r.id;
   band.style.left=timelinePercent(start)+'%';band.style.width=(timelinePercent(end)-timelinePercent(start))+'%';band.style.setProperty('--band-color',r.color);
   band.textContent=r.short;band.title=`${r.name} · ${r.range[0]}—${r.range[1]}${isOT()?'节点':'年'}`;$('#timeline-bands').append(band);
  });
  const interval=hi-lo>500?200:hi-lo>100?50:10;
  const ticks=[lo];for(let y=Math.ceil((lo+1)/interval)*interval;y<hi;y+=interval)if(y-lo>(hi-lo)*.12&&hi-y>(hi-lo)*.12)ticks.push(y);ticks.push(hi);
  ticks.forEach((year,i)=>{const tick=document.createElement('span');tick.textContent=year;tick.style.left=timelinePercent(year)+'%';if(i===0)tick.className='first';if(i===ticks.length-1)tick.className='last';$('#timeline-ticks').append(tick);});
  const groups=new Map();events.forEach(e=>{const position=eventPosition(e);if(!groups.has(position))groups.set(position,[]);groups.get(position).push(e);});
  groups.forEach((group,year)=>{
   const marker=document.createElement('button');marker.className='timeline-marker';marker.dataset.year=year;marker.style.left=timelinePercent(year)+'%';
   const count=group.length>1?`（${group.length}则，点击依次浏览）`:'';
   marker.title=isOT()?`节点 ${year} · ${group[0].ref} · ${group[0].title}`:`约 ${year} 年 · ${group.map(e=>e.title).join('；')}${count}`;
   marker.setAttribute('aria-label',isOT()?`节点 ${year} · ${group[0].ref} · ${group[0].title}`:`约 ${year} 年 · ${group[0].title}${count}`);
   if(group.length>1)marker.classList.add('multiple');
   marker.addEventListener('click',()=>{stop();const index=group.findIndex(e=>e.id===state.event);selectEvent(group[(index+1)%group.length].id);});
   $('#timeline-markers').append(marker);
  });
 }
 $('#timeline-period').textContent=isOT()?`${timelineZoom?route().name:'希伯来先知书'} · 经文顺序`: `${timelineZoom?route().short:state.comparison?'全时段对照':moduleConfig().name} · ${lo}—${hi}`;
 $('.date-display>.eyebrow').textContent=isOT()?'经文进度 · 非公历年':'ANNO DOMINI · 约公元';
 $('#timeline-dock').setAttribute('aria-label',isOT()?'旧约经文进度轴':'历史时间轴');
 $('label[for="year-range"]').textContent=isOT()?'浏览经文节点':'浏览年份';
 $('#year-input').setAttribute('aria-label',isOT()?'输入经文节点':'输入浏览年份');
 $('#jump-unit').textContent=isOT()?'节点':'年';
 $('#timeline-help').textContent=isOT()?'拖动进度轴切换经文节点 · 按经卷顺序阅读 · 节点不是公历年':'拖动色带逐年浏览 · 点击圆点查看纪事 · 同年多则可反复点击';
 $('#timeline-cursor').style.left=timelinePercent(state.year)+'%';$('#timeline-year-bubble').textContent=state.year;
 $('#year-input').min=browsingRange()[0];$('#year-input').max=browsingRange()[1];$('#year-input').value=state.year;
 document.querySelectorAll('.timeline-band').forEach(b=>b.classList.toggle('active',b.dataset.route===state.route));
 document.querySelectorAll('.timeline-marker').forEach(b=>{const selected=Number(b.dataset.year)===eventPosition(current());b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});
}
function bindTimeline(){
 $('#timeline-scope').addEventListener('click',()=>{timelineZoom=!timelineZoom;renderTimeline();});
 const range=$('#year-range');
 const flush=()=>{if(timelineFrame!==null)cancelAnimationFrame(timelineFrame);timelineFrame=null;if(timelinePendingYear!==null){const year=timelinePendingYear;timelinePendingYear=null;if(timelinePendingModule===state.module)browseYear(year);}};
 range.addEventListener('input',()=>{timelinePendingYear=Number(range.value);timelinePendingModule=state.module;if(timelineFrame===null)timelineFrame=requestAnimationFrame(flush);});
 range.addEventListener('change',flush);
 range.addEventListener('pointerdown',()=>{stop();$('#timeline-dock').classList.add('scrubbing');});
 const end=()=>$('#timeline-dock').classList.remove('scrubbing');
 range.addEventListener('pointerup',end);range.addEventListener('pointercancel',end);range.addEventListener('blur',end);
 $('#year-input').addEventListener('change',e=>{if(e.target.value!==''&&Number.isFinite(Number(e.target.value)))browseYear(Number(e.target.value));else e.target.value=state.year;});
 $('#year-input').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.target.blur();}});
}
