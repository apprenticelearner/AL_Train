from http.client import HTTPConnection
import sys, urllib.parse

def stop_server (port):
    """send QUIT request to http server running on localhost:<port>"""
    conn = HTTPConnection("localhost:%d" % port)
    conn.request("PRINT", "/", "THIS IS IT PRINTING")
    resp = conn.getresponse()

    conn = HTTPConnection("localhost:%d" % port)
    conn.request("ERROR", "/", "THIS IS IT ERORRING")
    resp = conn.getresponse()

    conn = HTTPConnection("localhost:%d" % port)
    conn.request("QUIT", "/", "THIS IS IT QUITTING")
    resp = conn.getresponse()
    print(resp)

assert len(sys.argv) > 1, "Error, correct usage: %s <port number>" % sys.argv[0]
assert sys.argv[1].isdigit(), "invalid port %r" % sys.argv[1]
port = int(sys.argv[1])

stop_server(port)