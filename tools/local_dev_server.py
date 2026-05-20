import http.server
import pathlib
import re
import socketserver
import sys
from urllib.parse import urlsplit


ROOT = pathlib.Path(__file__).resolve().parents[1]
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8876
BLOCKED_PATH_RE = re.compile(r"^/(?:artifacts(?:/|$)|admin-tools-standalone(?:\.dom)?\.html$)", re.IGNORECASE)


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_head(self):
        if BLOCKED_PATH_RE.match(urlsplit(self.path).path):
            self.send_error(404)
            return None
        return super().send_head()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


if __name__ == "__main__":
    with ReusableTCPServer(("127.0.0.1", PORT), NoCacheHandler) as httpd:
        print(f"KIU local dev server listening on http://127.0.0.1:{PORT}")
        httpd.serve_forever()
