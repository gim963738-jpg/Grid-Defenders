from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
import base64,os
P=Path(__file__).resolve().parent
os.chdir(P)
class Handler(SimpleHTTPRequestHandler):
    def do_POST(self):
        name=self.path.removeprefix('/save/')
        if not self.path.startswith('/save/frame-') or '/' in name or not name.endswith('.png'):
            self.send_error(400);return
        dest=P/'frames';dest.mkdir(exist_ok=True)
        (dest/name).write_bytes(base64.b64decode(self.rfile.read(int(self.headers['Content-Length']))))
        self.send_response(200);self.end_headers();self.wfile.write(b'ok')
    def log_message(self,*args): pass
print('http://127.0.0.1:5197/preview.html',flush=True)
ThreadingHTTPServer(('127.0.0.1',5197),Handler).serve_forever()
