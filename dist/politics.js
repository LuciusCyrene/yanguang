'use strict';
const polityKinds={empire:'帝国',kingdom:'地方王国',client:'附属 / 地方王国',province:'罗马内部行政区',contested:'争夺区域',polity:'地方政权 / 群体'};
function politicalFeatures(all=false){
  if(isOT())return [];
  return politicsData.features.filter(f=>f.properties.from<=state.year&&f.properties.to>=state.year&&(all||$('#administration-check').checked||!f.properties.parent));
}
function containsCoordinate(geometry,lon,lat){
  const inRing=ring=>{
    let inside=false;
    for(let i=0,j=ring.length-1;i<ring.length;j=i++){
      const [xi,yi]=ring[i],[xj,yj]=ring[j];
      if((yi>lat)!==(yj>lat)&&lon<(xj-xi)*(lat-yi)/(yj-yi)+xi)inside=!inside;
    }
    return inside;
  };
  const polygons=geometry.type==='Polygon'?[geometry.coordinates]:geometry.coordinates;
  return polygons.some(rings=>inRing(rings[0])&&!rings.slice(1).some(inRing));
}
function browseYear(year){
  stop();const [minYear,maxYear]=browsingRange();year=Math.max(minYear,Math.min(maxYear,Math.round(year)));
  if(isOT()){const e=moduleEvents().find(e=>e.position===year);if(e)selectEvent(e.id);return;}
  const target=state.comparison?yearModule(year):state.module;
  const r=route(),phase=moduleOf(current())===target&&year>=r.range[0]&&year<=r.range[1]?r:atlas.routes.find(r=>(r.module||'acts')===target&&year>=r.range[0]&&year<=r.range[1]);
  const candidates=atlas.events.filter(e=>moduleOf(e)===target);
  let pool=phase?candidates.filter(e=>e.route===phase.id):candidates;
  let available=pool.filter(e=>e.year<=year);
  if(state.comparison&&!available.length){pool=comparisonEvents();available=pool.filter(e=>e.year<=year);}
  const closestYear=available.length?Math.max(...available.map(e=>e.year)):pool[0].year;
  const event=current().year===closestYear&&pool.includes(current())?current():pool.find(e=>e.year===closestYear);
  selectEvent(event.id,false,year);
}
function judaeaStatus(year){
  if(year>451)return '本篇章以选取的政治实体提供历史背景，不绘制全部省区或小邦。边界依历史数据分期，不能把国家、王室或殖民势力的疆域当作居民信仰分布、教区界线或当地群体对传教的同意。';
  if(year>=395)return '政治底图依来源区分东、西罗马及其他政权。帝国分治不等于教会已按后来宗派格局分裂，政治色块也不表示教会辖区或信徒人口。';
  if(year>=224)return '罗马与萨珊等政权构成这一时期的政治背景。亚美尼亚、波斯与阿克苏姆的教会线索不能都写成罗马帝国内部的同一过程；各地信徒也不与国家边界完全重合。';
  if(year>=135)return '135年前后耶路撒冷及所在地区经历罗马统治下的重建与制度变化。教会、犹太群体及其他居民的经历不同，地图不把政治变化等同于一种宗教的即时替代。';
  if(year>=70)return '70年的围城与圣殿毁坏改变了耶路撒冷和周边群体的环境。这里显示罗马时期的政治范围，不表示所有犹太人或基督徒都同时迁离，亦不等于教会活动从此结束。';
  if(year>=63)return '帝国与地方政权轮廓依历史数据时段显示。原有30—62年的精细犹太地区示意不延伸套用到所有后续年份；政治疆域不是教会分布图。';
  if(year<=33)return '犹太、撒马利亚与以土买由罗马行政长官管理；加利利与比利亚属希律安提帕，东北主要领地属腓力。地方分封统治仍在罗马体系内。';
  if(year<=36)return '犹太本部继续由罗马管理。腓力死后，东北主要领地处于转由罗马管理的过渡阶段；安提帕仍统治加利利与比利亚。';
  if(year<=38)return '亚基帕一世获授东北主要领地；犹太本部仍由罗马管理，加利利与比利亚尚属安提帕。';
  if(year<=40)return '亚基帕一世又获加利利与比利亚。犹太、撒马利亚本部此时尚未交给他。';
  if(year<=43)return '41年，克劳狄将犹太与撒马利亚授给亚基帕一世，其主要领地在图上合并。这里是罗马附属王国，不是脱离罗马的独立国家。';
  if(year<=52)return '44年亚基帕一世死后，罗马重新派行政长官管理其主要地区。44年是交接年，本图按其死后局面显示；亚基帕二世后来受封的东北领地尚未从此处另列。';
  return '犹太本部仍由罗马行政长官管理；53年起，亚基帕二世另获原腓力等东北主要领地。其54年以后获赐的个别加利利城市等未逐一细绘，不能把他误作统治耶路撒冷的犹太王。';
}
function focusPoliticalFeature(feature){
  const points=[];
  const walk=value=>{if(typeof value[0]==='number')points.push(project(value[0],value[1]));else value.forEach(walk);};
  walk(feature.geometry.coordinates);
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
  const k=Math.min(14,800/Math.max(50,x1-x0),370/Math.max(40,y1-y0));
  camera={k,x:550-(x0+x1)/2*k,y:350-(y0+y1)/2*k};
  updateCamera();$('#politics-dialog').close();
}
function openPoliticalInfo(feature){
  if(feature){
    document.querySelectorAll('.polity-record').forEach(n=>n.open=n.dataset.id===feature.properties.id);
  }
  if(!$('#politics-dialog').open)$('#politics-dialog').showModal();
  if(feature)document.querySelector(`.polity-record[data-id="${feature.properties.id}"]`)?.scrollIntoView({block:'nearest'});
}
function renderPolitics(){
 if(isOT()){$('#political-shapes').replaceChildren();$('#political-labels').replaceChildren();$('#political-layer').style.display='none';$('#politics-key').hidden=true;$('#place-polity').textContent='经文地点参照 · 不绘制政治疆界';return;}
  const priority=['rome','east-rome','west-rome','sasanian','aksum','parthia','judaea','agrippa1','agrippa2','antipas','philip','northeast-roman','nabataea','armenia'];
  const rank=f=>priority.includes(f.properties.key)?priority.indexOf(f.properties.key):99;
  const all=politicalFeatures(true).sort((a,b)=>rank(a)-rank(b)),visible=politicalFeatures();
  $('#administration-check').disabled=state.year>62;
  $('#politics-context-heading').textContent=isChurch()?'政治与教会：怎样读这张图':'犹太地区的统治变化';
  const enabled=$('#politics-check').checked;
  $('#political-layer').style.display=enabled?'':'none';$('#politics-key').hidden=!enabled;
  $('#political-shapes').replaceChildren();$('#political-labels').replaceChildren();
  visible.sort((a,b)=>{const rank=p=>p.kind==='empire'?0:p.parent?2:1;return rank(a.properties)-rank(b.properties);}).forEach(feature=>{
    const p=feature.properties,d=geometryPath(feature.geometry);
    const path=svgNode('path',{d,class:`polity-shape ${p.kind}`,'fill-rule':'evenodd',fill:p.color,stroke:p.color,'data-polity':p.key,'clip-path':state.module==='world'?'none':'url(#political-data-clip)'});
    $('#political-shapes').append(path);
    if(p.kind==='contested')$('#political-shapes').append(svgNode('path',{d,class:'disputed-texture','fill-rule':'evenodd'}));
    const [x,y]=project(...p.anchor);
    // Names outside the cropped data extent are not projected into this map.
    if(state.module!=='world'&&(p.anchor[0]<-7||p.anchor[0]>48||p.anchor[1]<10||p.anchor[1]>54))return;
    $('#political-labels').append(svgNode('text',{x,y,class:`polity-label ${p.kind==='empire'?'major-polity':''}`,'text-anchor':'middle',fill:p.color},p.name));
  });
  $('#politics-button').textContent=`政权图例 · 约 ${state.year} 年 ↗`;
  $('#polity-swatches').replaceChildren();
  const keys=isChurch()?['rome','east-rome','west-rome','sasanian','parthia','aksum']:['rome','parthia','nabataea',all.some(f=>f.properties.key==='agrippa1'&&f.properties.from>=41)?'agrippa1':'judaea'];
  const chosen=state.module==='world'?all.filter(f=>!f.properties.parent).slice(0,5):keys.map(key=>all.find(f=>f.properties.key===key)).filter(Boolean);
  chosen.forEach(feature=>{
    const b=document.createElement('button');b.className='polity-key';b.style.setProperty('--polity-color',feature.properties.color);
    const square=document.createElement('i');square.setAttribute('aria-hidden','true');
    const short={rome:'罗马',parthia:'帕提亚',nabataea:'纳巴泰',judaea:'犹太政区',agrippa1:'亚基帕一世','east-rome':'东罗马','west-rome':'西罗马',sasanian:'萨珊',aksum:'阿克苏姆'};
    b.append(square,document.createTextNode(short[feature.properties.key]||feature.properties.name));b.addEventListener('click',()=>openPoliticalInfo(feature));$('#polity-swatches').append(b);
  });
  if(all.length>chosen.length){const b=document.createElement('button');b.className='polity-key';b.textContent=`其他 ${all.length-chosen.length} 项`;b.addEventListener('click',()=>openPoliticalInfo());$('#polity-swatches').append(b);}
  $('#politics-year-title').textContent=`当前浏览：约公元 ${state.year} 年 · ${all.length} 项政权 / 行政范围`;
  $('#judaea-status').textContent=judaeaStatus(state.year);
  $('#politics-milestones').replaceChildren();
  (state.module==='world'?[[800,'800年 · 帝国与教会'],[1054,'1054年 · 东西分歧'],[1453,'1453年 · 君士坦丁堡'],[1517,'1517年 · 改革争论'],[1555,'1555年 · 奥格斯堡'],[1648,'1648年 · 和约']]:isChurch()?[[70,'70年 · 耶路撒冷'],[224,'224年 · 波斯转折'],[313,'313年 · 政策变化'],[325,'325年 · 尼西亚'],[395,'395年 · 帝国分治'],[439,'439年 · 北非变化'],[451,'451年 · 迦克墩']]:[[30,'30年 · 分封与直辖'],[37,'37年 · 亚基帕受封'],[41,'41年 · 王国合并'],[44,'44年 · 恢复直辖'],[46,'46年 · 色雷斯设省'],[53,'53年 · 亚基帕二世'],[60,'60年 · 亚美尼亚争夺']]).forEach(([year,label])=>{
    const b=document.createElement('button');b.textContent=label;b.classList.toggle('active',year===state.year);b.addEventListener('click',()=>browseYear(year));$('#politics-milestones').append(b);
  });
  $('#politics-list').replaceChildren();
  all.forEach(feature=>{
    const p=feature.properties,details=document.createElement('details');details.className='polity-record';details.dataset.id=p.id;
    const summary=document.createElement('summary'),square=document.createElement('i'),title=document.createElement('strong'),type=document.createElement('small');
    square.style.setProperty('--polity-color',p.color);title.textContent=p.name;type.textContent=polityKinds[p.kind];summary.append(square,title,type);details.append(summary);
    const body=document.createElement('p');body.textContent=p.description;details.append(body);
    const period=document.createElement('p');period.className='polity-method';
    period.textContent=`本图适用：${p.from}—${p.to} 年。${p.sourcePeriod?`源数据区间：${p.sourcePeriod[0]<0?'前'+(-p.sourcePeriod[0]):p.sourcePeriod[0]}—${p.sourcePeriod[1]} 年。`:'作者概略行政 / 领地示意。'}${p.parent?'统属说明：'+p.parent+'。':''}`;
    details.append(period);const method=document.createElement('p');method.className='polity-method';method.textContent=p.changes;details.append(method);
    const source=document.createElement('a');source.href=p.source;source.target='_blank';source.rel='noopener noreferrer';source.textContent='查看边界或史料来源 ↗';details.append(source);
    const zoom=document.createElement('button');zoom.className='polity-zoom';zoom.textContent='在地图中查看 ⌖';zoom.addEventListener('click',()=>focusPoliticalFeature(feature));details.append(zoom);
    $('#politics-list').append(details);
  });
  $('#politics-corrections').replaceChildren();
  const sourceHeading=document.createElement('h3');sourceHeading.textContent='编纂修订依据';$('#politics-corrections').append(sourceHeading);
  politicsData.metadata.corrections.filter(record=>!isChurch()||state.year<=62).forEach(record=>{const a=document.createElement('a');a.href=record.source;a.target='_blank';a.rel='noopener noreferrer';a.textContent=record.topic+' ↗';$('#politics-corrections').append(a);});
  if(isChurch()&&state.year>62){const a=document.createElement('a');a.href='https://github.com/Seshat-Global-History-Databank/cliopatria';a.target='_blank';a.rel='noopener noreferrer';a.textContent='扩展底图：Cliopatria v0.2.1，按源时段显示 ↗';$('#politics-corrections').append(a);}
  const place=atlas.places[current().place];
  const containing=all.filter(f=>containsCoordinate(f.geometry,place.lon,place.lat));
  const local=containing.find(f=>f.properties.parent)||containing.find(f=>f.properties.key!=='rome')||containing[0];
  $('#place-polity').textContent=local?`约 ${state.year} 年 · 地图政治范围：${local.properties.name}${local.properties.parent?'（'+local.properties.parent+'）':''}。边缘地点为近似判断。`:`约 ${state.year} 年 · 此点未在当前政权数据中确定归属。未着色不表示无政权。`;
}
