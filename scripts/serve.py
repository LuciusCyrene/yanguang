#!/usr/bin/env python3
"""Serve the Bible atlas and optionally mount the sibling Jiangshan atlas read-only."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, parse_qs
import argparse,json,re
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description='启动言光本地预览与中国地图对照')
parser.add_argument('--port',type=int,default=8001)
parser.add_argument('--china-root',type=Path,default=ROOT.parent/'江山时序',help='只读载入的江山时序目录')
args=parser.parse_args()
china=args.china_root.resolve()
class AtlasHandler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT/'dist'),**kw)
 def translate_path(self,path):
  if urlsplit(path).path.startswith('/jiangshan/'):
   previous=self.directory
   try:
    self.directory=str(china)
    candidate=Path(super().translate_path(path[len('/jiangshan'):])).resolve()
    return str(candidate if candidate.is_relative_to(china) else ROOT/'dist/.missing')
   finally:self.directory=previous
  return super().translate_path(path)
 def do_GET(self):
  url=urlsplit(self.path)
  if url.path=='/comparison-status.json':
   body=json.dumps({'available':(china/'index.html').is_file() and (china/'js/app.js').is_file()}).encode()
   self.send_response(200);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body);return
  if url.path in ('/jiangshan/','/jiangshan/index.html') and parse_qs(url.query).get('comparison')==['1']:
   if not (china/'index.html').is_file():self.send_error(404,'Local Jiangshan atlas not found');return
   html=(china/'index.html').read_text()
   # Comparison is local: omit remote telemetry and font requests in the served response only.
   html=re.sub(r'<script\b[^>]*src=[\"\']https?://[^>]*>.*?</script>','',html,flags=re.I|re.S)
   html=re.sub(r'<link\b[^>]*(?:href=[\"\']https?://fonts\.[^>]*|rel=[\"\']preconnect[\"\'][^>]*)>','',html,flags=re.I)
   html=html.replace('</head>','<link rel="stylesheet" href="/china-bridge.css?v=11"><script defer src="/china-bridge.js?v=11"></script></head>')
   body=html.encode();self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body);return
  super().do_GET()
print(f'言光：http://127.0.0.1:{args.port}/',flush=True)
print(f'中国地图只读挂载：{china}',flush=True)
try:
 with ThreadingHTTPServer(('127.0.0.1',args.port),AtlasHandler) as server:server.serve_forever()
except KeyboardInterrupt:print('\n已停止')
