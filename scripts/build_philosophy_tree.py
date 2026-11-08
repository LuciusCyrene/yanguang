#!/usr/bin/env python3
"""Lossless LF topic import; additive review and independent typed relations."""
from pathlib import Path
import json,hashlib
from philosophy_tree_notes import REVIEWS,EXTRA_FIGURES,ALIASES,MODERN_RELATIONS
ROOT=Path(__file__).resolve().parents[1]
def main():
 if not (ROOT/'scripts/sources/philosophy-tree-original.txt').exists():
  public=json.loads((ROOT/'dist/data/philosophy-tree.json').read_text())
  if public.get('publication',{}).get('edition')=='public':
   print('公开版不分发原始笔记，保留31个人物资料和25条独立编写的关系。');return
  raise SystemExit('本地原始笔记文件不存在；未改动现有数据。')
 raw=(ROOT/'scripts/sources/philosophy-tree-original.txt').read_bytes();lines=raw.decode('utf-8-sig').split('\n');assert len(lines)==5676
 reader=json.loads((ROOT/'dist/data/comparison-reader.json').read_text());people={p['id']:p for p in reader['people']};figures=[]
 for id,aliases in ALIASES.items():
  p=people[id];figures.append(dict(id=id,name=p['name'],aliases=list(dict.fromkeys(aliases+[p['name']])),lifeLabel=p['lifeLabel'],summary=p['sections'][1]['text'],questions=[],works=[],sources=p['sources'],readerPersonId=id,workIds=p.get('workIds',[]),questionIds=p.get('questionIds',[])))
 figures+=EXTRA_FIGURES;byAlias={a:f['id'] for f in figures for a in f['aliases']};nodes=[];stack=[];roots=[]
 for i,line in enumerate(lines):
  depth=len(line)-len(line.lstrip('\t'));title=line[depth:];id=f'tree-{i+1:05}';assert depth<=len(stack),(i,depth,len(stack))
  stack=stack[:depth];parent=stack[-1] if stack else None
  node=dict(id=id,title=title,parentId=parent,depth=depth,order=i+1,childIds=[],figureId=byAlias.get(title))
  if parent:nodes[int(parent[5:])-1]['childIds'].append(id)
  else:roots.append(id)
  stack.append(id);nodes.append(node)
 reviews=[]
 for review in REVIEWS:
  note=dict(review);note['nodeId']=f"tree-{note.pop('line'):05}";note['status']='初步辨析';note['scope']='本条增补；未覆盖整支内容';reviews.append(note)
 for n in nodes:n['subtreeSize']=1
 for n in reversed(nodes):
  if n['parentId']:nodes[int(n['parentId'][5:])-1]['subtreeSize']+=n['subtreeSize']
 figureMap={f['id']:f for f in figures}
 for f in figures:
  f['nodeIds']=[n['id'] for n in nodes if n['figureId']==f['id']]
  f['primaryNodeId']=max(f['nodeIds'],key=lambda id:nodes[int(id[5:])-1]['subtreeSize'],default=None)
 # Imported hierarchy is kept separate from selected historical relations.
 relations=[]
 for r in reader['cultureRelations']:
  if r['fromId'] in figureMap and r['toId'] in figureMap:relations.append(dict(r,evidenceStatus='既有编选关系 · 见逐项出处',provenance='本站思想系谱；非由原导图父子线自动推断'))
 relations+=MODERN_RELATIONS
 archive=ROOT/'output/西方哲学史-原始归档.emmx'
 archiveMeta=ROOT/'scripts/sources/philosophy-tree-archive.json'
 if archive.exists():archiveMeta.write_text(json.dumps(dict(fileName=archive.name,bytes=archive.stat().st_size,sha256=hashlib.sha256(archive.read_bytes()).hexdigest(),note='原始格式、截图及单页PDF保存在本机output目录；此处记录校验和，未随网页发布原始二进制文件。'),ensure_ascii=False,indent=2)+'\n')
 data=dict(version=1,title='西方哲学史 · 完整原始树',source=dict(fileName='西方哲学史-树状图审阅.txt',sha256=hashlib.sha256(raw).hexdigest(),topicCount=len(nodes),format='LF分隔主题、前导Tab表示层级，保留主题内部CR',textDownload='data/philosophy-tree-original.txt',nativeArchive=json.loads(archiveMeta.read_text())),editorial='原笔记逐字保留；仅首批条目有初步辨析，其余待审核。父子线表示原有分类，不自动等同人物影响；自由关系线由本地原始格式与PDF留存，网页中的语义关系另编。完整树含1648年之后人物，与主地图年轴分开阅读。',rootIds=roots,nodes=nodes,reviews=reviews,figures=figures,relations=relations)
 (ROOT/'dist/data/philosophy-tree-original.txt').write_bytes(raw)
 (ROOT/'dist/data/philosophy-tree.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n')
 print(f'{len(nodes)} topics / {len(roots)} roots / {len(reviews)} additive reviews / {len(figures)} selected figures / {len(relations)} typed relations')
if __name__=='__main__':main()
