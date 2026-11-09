from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
import os,base64,re
P=Path(__file__).resolve().parent;os.chdir(P)
class Handler(SimpleHTTPRequestHandler):
 def do_POST(self):
  m=re.fullmatch('/save/(combo|hit[123])/(frame-[0-9]{3}\\.png)',self.path)
  if not m:self.send_error(400);return
  out=P/'frames'/m[1];out.mkdir(parents=True,exist_ok=True)
  (out/m[2]).write_bytes(base64.b64decode(self.rfile.read(int(self.headers['Content-Length']))))
  self.send_response(200);self.end_headers();self.wfile.write(b'ok')
 def log_message(self,*args):pass
print('http://127.0.0.1:5200/preview.html',flush=True)
ThreadingHTTPServer(('127.0.0.1',5200),Handler).serve_forever()
