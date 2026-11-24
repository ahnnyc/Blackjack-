# A local stand-in for GitHub Pages: serves files with "keep for 10 minutes", like GitHub does.
import http.server, functools, sys

class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'max-age=600')
        super().end_headers()
    def log_message(self, *a):
        pass

root, port = sys.argv[1], int(sys.argv[2])
http.server.ThreadingHTTPServer(('127.0.0.1', port), functools.partial(H, directory=root)).serve_forever()
