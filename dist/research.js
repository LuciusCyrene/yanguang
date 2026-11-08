'use strict';
// Source cards are local text; external resources are opened only by the reader.
function referenceCard(c){
 const card=document.createElement('article');card.className='reference-card';
 const tag=document.createElement('small');tag.className='reference-kind';tag.textContent=`${c.kind} · ${c.status}`;
 const link=document.createElement('a');link.href=c.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=c.title+' ↗';
 const byline=document.createElement('p');byline.textContent=`${c.author} · ${c.edition}`;
 const locator=document.createElement('p');locator.className='reference-locator';locator.textContent='定位：'+c.locator;
 const note=document.createElement('p');note.className='reference-note';note.textContent=c.note;
 card.append(tag,link,byline,locator,note);return card;
}
function citationDisclosure(citations,label){
 const details=document.createElement('details');details.className='citation-disclosure';
 const summary=document.createElement('summary');summary.textContent=label||`出处与证据 · ${citations.length}项`;
 details.append(summary);citations.forEach(c=>details.append(referenceCard(c)));return details;
}
function renderResearch(event){
 renderHistoricalMedia();renderWorldCulture();
 for(const id of ['event-evidence','reading-evidence']){
  const root=$('#'+id);root.replaceChildren();
  const date=document.createElement('p');date.className='date-evidence';date.textContent=`${isOT()?'阅读次序':'年代依据'} · ${event.dateEvidence.kind}：${event.dateEvidence.note}`;
  root.append(date,citationDisclosure(event.citations));
 }
 const related=event.chinaRelated;
 $('#event-local-reading').hidden=!related;$('#reading-local-reading').hidden=!related;
 for(const id of ['event-local-reading','reading-local-reading']){
  const root=$('#'+id);root.replaceChildren();if(!related)continue;
  const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='本地文献 · 延伸阅读';details.append(summary);
  const note=document.createElement('p');note.textContent='相关书籍已作目录或重点页面筛查；未核对的正文页码不作逐条事实依据。';details.append(note);
  atlas.localReading.filter(b=>event.year<1000?b.topic.includes('唐代')||b.title.includes('景教'):event.year<1400?b.title.includes('陈垣'):b.title.includes('礼仪')).forEach(b=>{const p=document.createElement('p');p.textContent=`${b.author} ${b.title} · ${b.edition}。${b.status}。`;details.append(p);});
  root.append(details);
 }
}
let chinaView='church',chinaResearchYear=null;
function renderChinaResearch(){
 if(!state.comparison)return;
 const changed=chinaResearchYear!==state.year;chinaResearchYear=state.year;
 document.querySelector('[data-china-view="culture"]').textContent=state.year<635?'文化比较':'文化回应';
 $('#china-context-year').textContent=`公元 ${state.year} 年`;
 document.querySelectorAll('[data-china-view]').forEach(b=>{const selected=b.dataset.chinaView===chinaView;b.setAttribute('aria-pressed',String(selected));$('#china-'+b.dataset.chinaView+'-content').hidden=!selected;});
 const context=atlas.chinaContexts.find(c=>c.range[0]<=state.year&&state.year<=c.range[1]);
 $('#china-church-title').textContent=context.title;
 $('#china-church-summary').textContent=context.church;
 $('#china-context-span').textContent=`${context.range[0]}—${context.range[1]}年 · 阶段背景`;
 const events=atlas.events.filter(e=>e.chinaRelated&&e.year<=state.year).sort((a,b)=>b.year-a.year||a.id.localeCompare(b.id)).slice(0,3);
 const root=$('#china-church-events');root.replaceChildren();
 $('#china-church-events-heading').textContent=events.some(e=>e.year===state.year)?'当年与此前教会纪事':'此前教会纪事 · 各列实际年份';
 $('#china-church-empty').hidden=events.length>0;
 events.forEach(e=>{
  const li=document.createElement('li'),button=document.createElement('button'),p=document.createElement('p');
  button.textContent=`${e.yearLabel} · ${atlas.places[e.place].name} · ${e.title}`;
  button.addEventListener('click',()=>{stop();selectEvent(e.id);$('.detail').classList.add('open');});
  p.textContent=e.summary;li.append(button,p);root.append(li);
 });
 $('#china-culture-title').textContent=context.title;
 $('#china-culture-description').textContent=context.culture;
 $('#china-research-question').textContent=context.question;
 $('#china-interpretation-note').textContent=context.interpretation;
 const sourceRoot=$('#china-culture-sources');sourceRoot.replaceChildren();
 if(context.citations.length)sourceRoot.append(citationDisclosure(context.citations,'本段参考与证据性质'));
 else{const p=document.createElement('p');p.textContent='本段为证据范围及比较阅读提示；相关已收录事件可在“教会活动”中查阅出处。';sourceRoot.append(p);}
 if(changed)$('#china-context-body').scrollTop=0;
}
function bindResearch(){
 $('#close-historical-image').addEventListener('click',()=>$('#historical-image-dialog').close());
 document.querySelectorAll('[data-china-view]').forEach(b=>b.addEventListener('click',()=>{chinaView=b.dataset.chinaView;renderChinaResearch();$('#china-context-body').scrollTop=0;}));
 $('#reform-traditions').addEventListener('click',()=>$('#reform-dialog').showModal());
 $('#close-reform').addEventListener('click',()=>$('#reform-dialog').close());
 const body=$('#reform-traditions-list');
 atlas.reformTraditions.forEach(t=>{
  const card=document.createElement('article');card.className='tradition-card';
  const title=document.createElement('h3');title.textContent=t.name;
  const years=document.createElement('small');years.textContent=`${t.range[0]}—${t.range[1]}年 · 专题阅读范围`;
  const text=document.createElement('p');text.textContent=t.text;
  const question=document.createElement('p');question.className='tradition-question';question.textContent='比较提问：'+t.question;
  card.append(title,years,text,question);
  t.eventIds.forEach(id=>{
   const e=atlas.events.find(e=>e.id===id),b=document.createElement('button');b.textContent=`${e.year} · ${e.title} →`;
   b.addEventListener('click',()=>{$('#reform-dialog').close();stop();selectEvent(id);$('.detail').classList.add('open');});card.append(b);
  });body.append(card);
 });
}
