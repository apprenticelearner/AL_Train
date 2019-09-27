from http.client import HTTPConnection
import sys, urllib.parse, json


def print_it(message,tp,REST_TARGET='PRINT'):
    conn = HTTPConnection("localhost:%d" % port)
    j_msg = json.dumps({"type" : tp, "message" : message})
    conn.request("PRINT", "/", j_msg)
    resp = conn.getresponse()

def stop_server (port):
    """send QUIT request to http server running on localhost:<port>"""
    print_it("THIS IS INFO", 'info')
    print_it("THIS IS AN ERROR", 'error')
    print_it("THIS IS IT QUITTING", 'info',"QUIT")

    
    # conn = HTTPConnection("localhost:%d" % port)
    # conn.request("QUIT", "/", "THIS IS IT QUITTING")
    # resp = conn.getresponse()
    # print(resp)

assert len(sys.argv) > 1, "Error, correct usage: %s <port number>" % sys.argv[0]
assert sys.argv[1].isdigit(), "invalid port %r" % sys.argv[1]
port = int(sys.argv[1])

stop_server(port)