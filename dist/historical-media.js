'use strict';
let historicalMediaData={cards:[]};
function historicalCardFor(side,year){return historicalMediaData.cards.find(c=>c.side===side&&c.range[0]<=year&&year<=c.range[1]);}
function historicalFactsFor(card,year){
 const facts=card.facts.slice();
 if(typeof comparisonReaderData!=='undefined'){
  for(const e of (card.side==='china'?comparisonReaderData.chinaEvents:comparisonReaderData.worldEvents||[]).filter(e=>e.year>=card.range[0]&&e.year<=card.range[1]))if(!facts.some(f=>f.year===e.year))facts.push({year:e.year,text:e.title,eventId:e.eventIds?.[0]||null,cultureId:e.culture?e.id:null});
 }
 return facts.filter(f=>f.year<=year).sort((a,b)=>a.year-b.year);
}
function historyEl(tag,text,cls){const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;}
function historicalFactList(card,year,compact=false){
 const list=historyEl('ol',null,'historical-facts'),facts=historicalFactsFor(card,year);
 (compact?facts.slice(-2):facts).forEach(f=>{
  const li=historyEl('li'),label=`${f.year}年 · ${f.text}`;
  if(f.year>=30){
   const button=historyEl('button',label);button.type='button';button.title=`浏览${f.year}年${f.eventId?'并阅读相关纪事':''}`;
   button.addEventListener('click',()=>{stop();$('#historical-image-dialog').close();if(f.cultureId){openWorldCulture(f.cultureId);return;}if(f.eventId)selectEvent(f.eventId);else browseYear(f.year);});li.append(button);
  }else li.textContent=label;
  list.append(li);
 });
 if(!facts.length)list.append(historyEl('li','此阶段的已编选纪事尚未发生；可先阅读上方阶段背景。'));
 return list;
}
function historicalImage(card){const img=historyEl('img');img.src=card.image;img.alt=card.caption;img.loading='lazy';img.decoding='async';img.width=240;img.height=180;return img;}
function openHistoricalImage(card,year){
 const dialog=$('#historical-image-dialog'),root=$('#historical-image-content');root.replaceChildren();
 root.append(historyEl('p',`浏览 ${year} 年 · 阶段 ${card.range.join('—')} 年`,'eyebrow'),historyEl('h2',card.title),historyEl('p',card.person,'historical-person'),historicalImage(card),historyEl('p',card.imageKind,'historical-image-kind'),historyEl('p',card.caption),historyEl('p',card.summary),historyEl('h3','关键纪事 · 当年及此前'),historicalFactList(card,year));
 const credit=historyEl('p',`${card.credit} · ${card.license} · ${card.transform}`,'historical-credit');
 const links=historyEl('div',null,'historical-source-links');
 for(const [label,url] of [['图像原始出处 ↗',card.imageSource],['许可说明 ↗',card.licenseUrl],['历史资料入口 ↗',card.historySource]]){const a=historyEl('a',label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';links.append(a);}
 root.append(credit,links,historyEl('p','图像是辅助阅读材料；作品的制作年代与所描绘事件的年代分别标注。同时发生不代表存在直接联系。','dialog-foot'));
 dialog.showModal();
}
function renderHistoricalMedia(){
 for(const [side,id] of [['west','event-historical-media'],['china','china-historical-media']]){
  const root=$('#'+id);root.replaceChildren();root.hidden=isOT()||(side==='china'&&!state.comparison);if(root.hidden)continue;
  const card=historicalCardFor(side,state.year);if(!card){root.hidden=true;continue;}
  root.dataset.card=card.id;root.dataset.year=state.year;
  const heading=historyEl('p',`时代图像 · ${card.range.join('—')}年阶段背景`,'historical-kicker');
  const button=historyEl('button',null,'historical-image-button');button.type='button';button.setAttribute('aria-label',`放大图像并查看出处：${card.title}`);
  const image=historicalImage(card),label=historyEl('span',null,'historical-image-label');label.append(historyEl('strong',card.title),historyEl('small',card.person),historyEl('small','放大与出处 ↗'));
  button.append(image,label);button.addEventListener('click',()=>{stop();openHistoricalImage(card,state.year);});
  root.append(heading,button,historyEl('p',`${card.imageKind} · ${card.caption}`,'historical-caption'));
  root.append(historyEl('small',`截至 ${state.year} 年的关键纪事`,'historical-facts-label'),historicalFactList(card,state.year,true));
  const details=historyEl('details',null,'historical-context-details');details.append(historyEl('summary','人物、事件与对照线索'),historyEl('p',card.summary),historyEl('small',`纪事截至 ${state.year} 年；点击年份移动时间轴`),historicalFactList(card,state.year));root.append(details,readerLaunchButton(side));
 }
}
