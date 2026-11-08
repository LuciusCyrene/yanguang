import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const data=JSON.parse(readFileSync(new URL('../dist/data/politics.json',import.meta.url)));
const active=year=>data.features.filter(f=>f.properties.from<=year&&year<=f.properties.to);
const ctx={};vm.runInNewContext(readFileSync(new URL('../dist/politics.js',import.meta.url),'utf8'),ctx);
const contains=(f,lon,lat)=>ctx.containsCoordinate(f.geometry,lon,lat);
assert.equal(data.metadata.license,'CC BY 4.0');
assert.match(data.metadata.sha256,/^[0-9a-f]{64}$/);
const ids=new Set();
for(const feature of data.features){
 const p=feature.properties;
 assert(!ids.has(p.id));ids.add(p.id);
 assert(p.from>=30&&p.to<=62&&p.from<=p.to,`年代范围错误 ${p.id}`);
 assert(['Polygon','MultiPolygon'].includes(feature.geometry.type),`几何类型错误 ${p.id}`);
 assert(p.source.startsWith('https://')&&p.description&&p.changes&&p.precision,`来源或精度说明缺失 ${p.id}`);
}
for(let year=30;year<=62;year++){
 const features=active(year),keys=features.map(f=>f.properties.key);
 assert.equal(new Set(keys).size,keys.length,`${year} 年同政权出现重叠时段`);
 for(const name of ['rome','parthia','nabataea'])assert(keys.includes(name),`${year} 年缺少 ${name}`);
 const local=features.filter(f=>f.properties.parent&&contains(f,35.23,31.78));
 assert.equal(local.length,1,`${year} 年耶路撒冷应有且仅有一个地方统治覆盖`);
 assert.equal(local[0].properties.key,year>=41&&year<=43?'agrippa1':'judaea',`${year} 年耶路撒冷统治错误`);
 const northeast=features.filter(f=>f.properties.parent&&contains(f,36.0,33.0));
 assert.equal(northeast.length,1,`${year} 年东北领地覆盖错误`);
 assert.equal(northeast[0].properties.key,year<=33?'philip':year<=36?'northeast-roman':year<=43?'agrippa1':year<=52?'judaea':'agrippa2',`${year} 年东北领地时序错误`);
 assert.equal(keys.includes('thrace'),year<=45,`${year} 年色雷斯应于46年撤去王国`);
 assert.equal(keys.includes('armenia'),true,`${year} 年缺少亚美尼亚区域`);
}
const hole={type:'Polygon',coordinates:[[[0,0],[4,0],[4,4],[0,4],[0,0]],[[1,1],[3,1],[3,3],[1,3],[1,1]]]};
assert(ctx.containsCoordinate(hole,.5,.5));assert(!ctx.containsCoordinate(hole,2,2));assert(!ctx.containsCoordinate(hole,5,5));
const from43=active(43).find(f=>f.properties.key==='rome');
const from46=active(46).find(f=>f.properties.key==='rome');
assert.notDeepEqual(from43.geometry,from46.geometry,'46年色雷斯并入未改变罗马几何');
assert.equal(active(50).find(f=>f.properties.key==='armenia').properties.kind,'kingdom');
assert.equal(active(54).find(f=>f.properties.key==='armenia').properties.kind,'contested');
assert(active(60).find(f=>f.properties.key==='armenia').properties.kind==='contested');
console.log(`政权验证通过：${data.features.length} 个分期要素，30—62年逐年覆盖，耶路撒冷/东北领地统治变化、46年色雷斯、60年争夺区与多边形孔洞判定通过。`);
