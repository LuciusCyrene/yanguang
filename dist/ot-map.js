'use strict';
let otGazetteer=null,otMapView='passage';
const otCoreAliases={'ot-jerusalem':'Jerusalem','ot-jericho':'Jericho 1','ot-gilgal':'Gilgal 1','ot-gibeon':'Gibeon','ot-shechem':'Shechem','ot-shiloh':'Shiloh','ot-bethel':'Bethel 1','ot-tabor':'Mount Tabor','ot-ophrah':'Ophrah 2','ot-gaza':'Gaza','ot-gibeah':'Gibeah 1','ot-ramah':'Ramah 4','ot-michmash':'Michmash','ot-bethlehem':'Bethlehem 1','ot-elah':'Valley of Elah','ot-hebron':'Hebron','ot-samaria':'Samaria 1','ot-carmel':'Mount Carmel','ot-beersheba':'Beersheba 1','ot-jezreel':'Jezreel 1','ot-nineveh':'Nineveh','ot-babylon':'Babylon 1','ot-tahpanhes':'Tahpanhes','ot-joppa':'Joppa','ot-tekoa':'Tekoa'};
const otBibleNames={'Josh':'Joshua','Judg':'Judges','1Sam':'1 Samuel','2Sam':'2 Samuel','1Kgs':'1 Kings','2Kgs':'2 Kings','Isa':'Isaiah','Jer':'Jeremiah','Ezek':'Ezekiel','Hos':'Hosea','Joel':'Joel','Amos':'Amos','Obad':'Obadiah','Jonah':'Jonah','Mic':'Micah','Nah':'Nahum','Hab':'Habakkuk','Zeph':'Zephaniah','Hag':'Haggai','Zech':'Zechariah','Mal':'Malachi'};
function initOTGeography(gazetteer,terrain,water){
 otGazetteer=gazetteer;
 const clip=svgNode('clipPath',{id:'ot-land-clip'});clip.append(svgNode('path',{d:detailedLandMask,'fill-rule':'evenodd'}));$('#map defs').append(clip);
 const relief=svgNode('g',{id:'ot-terrain-layer','clip-path':'url(#ot-land-clip)'}),[w,s,e,n]=terrain.bounds,[x,y]=project(w,n),[xe,ys]=project(e,s);
 relief.append(svgNode('image',{href:terrain.image,x,y,width:xe-x,height:ys-y,preserveAspectRatio:'none'}));$('#water-layer').before(relief);
 const waterways=svgNode('g',{id:'ot-water-layer'});
 water.features.forEach(f=>{const path=svgNode('path',{d:geometryPath(f.geometry),class:f.geometry.type.includes('Polygon')?'ot-water-area':'ot-water-line','fill-rule':'evenodd'});path.append(svgNode('title',{},f.properties.name+' · 现代水系参照'));waterways.append(path);});$('#water-layer').after(waterways);
 const labels=svgNode('g',{id:'ot-geo-labels'});
 gazetteer.labels.forEach(l=>{const [x,y]=project(l.lon,l.lat);labels.append(svgNode('text',{x,y,class:`ot-region-label ${l.kind}`,'text-anchor':'middle'},l.name));});$('#context-cities').before(labels,svgNode('g',{id:'ot-sites'}));
 const list=$('#ot-map-options');gazetteer.sites.forEach(p=>{const option=document.createElement('option');option.value=p.name;option.label=p.english;list.append(option);});
 $('#ot-map-stats').textContent=`${gazetteer.sites.length}处经文地名 · 迦南地形约${terrain.groundResolutionMetres}米/像素`;
}
function updateOTLayers(){
 if(!otGazetteer)return;
 $('#ot-terrain-layer').style.display=isOT()&&$('#terrain-check').checked?'':'none';
 $('#ot-water-layer').style.display=isOT()&&$('#water-check').checked?'':'none';
 $('#ot-geo-labels').style.display=isOT()&&$('#regions-check').checked?'':'none';
 $('#ot-sites').style.display=isOT()&&$('#ot-extra-check').checked?'':'none';
 if(isOT()){$('#geographic-labels').style.display='none';const p=atlas.places[current().place];if(camera.k>=8&&p.lon>=33.8&&p.lon<=36.8&&p.lat>=30.7&&p.lat<=33.6)$('#water-layer').style.display='none';}
}
function drawOTSites(){
 const root=$('#ot-sites');root.replaceChildren();if(!isOT()||!otGazetteer)return;
 const core=new Set(routeEvents().map(e=>otCoreAliases[e.place]));
 otGazetteer.sites.filter(p=>!core.has(p.english)).forEach(p=>{
  const [x,y]=project(p.lon,p.lat),g=svgNode('g',{transform:`translate(${x},${y})`,class:`ot-site ${p.uncertain?'uncertain':''} ${p.kind}`,role:'button',tabindex:'0','aria-label':`${p.name}，查看地名与经文出处`});
  g.append(svgNode('title',{},p.name+' · '+p.certainty),svgNode('circle',{r:6,class:'hit-target'}),svgNode('circle',{r:2.6,class:'point'}),svgNode('text',{x:8,y:16},p.name));
  const open=()=>openOTPlace(p);g.addEventListener('click',()=>{if(!drag?.moved)open();});g.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();open();}});root.append(g);
 });
 updateOTLayers();
}
function fitOTPassage(){
 const p=atlas.places[current().place],[x,y]=project(p.lon,p.lat),k=p.lon>=33.8&&p.lon<=36.8&&p.lat>=30.7&&p.lat<=33.6?20:12;
 camera={k,x:550-x*k,y:345-y*k};updateCamera();
}
function fitOTView(){
 if(otMapView==='passage'){fitOTPassage();return;}
 if(otMapView==='book'){fitRoute();return;}
 const points=moduleEvents().map(e=>{const p=atlas.places[e.place];return project(p.lon,p.lat);}),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys),k=Math.min(8,850/Math.max(30,xmax-xmin),440/Math.max(30,ymax-ymin));camera={k,x:550-(xmin+xmax)/2*k,y:340-(ymin+ymax)/2*k};updateCamera();
}
function otReferenceUrl(r){return 'https://www.biblegateway.com/passage/?search='+encodeURIComponent(`${otBibleNames[r.book]} ${r.chapter}:${r.verse}`)+'&version=CUVS';}
function openOTPlace(p){
 $('#ot-place-title').textContent=p.name;$('#ot-place-english').textContent=p.english;$('#ot-place-note').textContent=p.certainty+'。'+p.note;
 const candidates=$('#ot-place-candidates');candidates.replaceChildren();
 p.candidates.forEach((c,index)=>{const row=document.createElement('p'),button=document.createElement('button');button.textContent=`聚焦${index?'其他':'优先'}候选 · ${c.name}`;button.addEventListener('click',()=>{const [x,y]=project(c.lon,c.lat),k=32;camera={k,x:550-x*k,y:325-y*k};updateCamera();$('#ot-place-dialog').close();});const location=document.createElement('small');location.textContent=`${c.lon.toFixed(4)}°, ${c.lat.toFixed(4)}° · ${c.pointType||'现代地理参照'}`;row.append(button,location);candidates.append(row);});
 const refs=$('#ot-place-references');refs.replaceChildren();p.references.slice(0,24).forEach(r=>{const a=document.createElement('a');a.href=otReferenceUrl(r);a.target='_blank';a.rel='noopener noreferrer';a.textContent=r.label+' ↗';refs.append(a);});
 if(p.references.length>24){const note=document.createElement('small');note.textContent='此处列出前24处；完整经文索引见下方地名来源。';refs.append(note);}
 const related=$('#ot-place-events');related.replaceChildren();
 moduleEvents().filter(e=>p.references.some(r=>{const first=e.chapters.split('-')[0],last=e.chapters.split('-')[1],lo=Number(first.split(':')[0]),hi=first.includes(':')?lo:Number(last||lo);return otBibleNames[r.book]===e.bibleBook&&r.chapter>=lo&&r.chapter<=hi;})).forEach(e=>{const b=document.createElement('button');b.textContent=`${e.ref} · ${e.title}`;b.addEventListener('click',()=>{$('#ot-place-dialog').close();selectEvent(e.id,true);if(innerWidth<=1150)$('.detail').classList.add('open');});related.append(b);});
 $('#ot-place-source').href=p.sourceUrl;$('#ot-place-source').textContent='OpenBible 地名候选与参考资料 ↗';
 if(!$('#ot-place-dialog').open)$('#ot-place-dialog').showModal();
}
function bindOTMap(){
 $('#ot-map-view').addEventListener('change',()=>{otMapView=$('#ot-map-view').value;fitOTView();});$('#ot-extra-check').addEventListener('change',updateOTLayers);$('#close-ot-place').addEventListener('click',()=>$('#ot-place-dialog').close());
 const search=()=>{const query=$('#ot-map-search').value.trim().toLowerCase(),p=otGazetteer.sites.find(p=>p.name.toLowerCase()===query||p.english.toLowerCase()===query)||otGazetteer.sites.find(p=>p.name.toLowerCase().includes(query)||p.english.toLowerCase().includes(query));if(query&&p){$('#ot-map-search-status').textContent='';openOTPlace(p);}else $('#ot-map-search-status').textContent='未找到匹配地名，可尝试“拉吉”“隐基底”或“艾城”。';};
 $('#ot-map-find').addEventListener('click',search);$('#ot-map-search').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();search();}});
}
