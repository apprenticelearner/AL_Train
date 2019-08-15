from http.server import HTTPServer, SimpleHTTPRequestHandler
import os, sys, time
from datetime import datetime
from xml.etree import ElementTree
from xml.etree.ElementTree import ElementTree as ETree
from xml.dom import minidom 
from urllib.parse import unquote
import uuid, csv
import errno
import json
from nools_gen import generate_nools
from pprint import pprint
# 
def _read_data(handler):
    content_length = int(handler.headers['Content-Length']) # <--- Gets the size of data
    post_data = handler.rfile.read(content_length) # <--- Gets the data itself
    return post_data.decode('UTF-8')

def _print_and_resp(handler,outmode=sys.stdout):
    # content_length = int(handler.headers['Content-Length']) # <--- Gets the size of data
    # post_data = handler.rfile.read(content_length) # <--- Gets the data itself
    post_data = _read_data(handler)
    print(post_data,file=outmode)
    handler.send_response(200)
    handler.end_headers()

# output.write("Anon Student Id\tSession Id\tTime\tStudent Response Type\tTutor Response Type\tLevel (Unit)\tProblemName\tStep Name\tSelection\tAction\tInput\tFeedback Text\tOutcome\n");
LOG_HEADERS = {"user_guid"              :"Anon Student Id",
               "session_id"             :"Session Id",
               "transaction_id"         :"Transaction Id",
               "tutor_event_time"       :"Time",
               "timezone"               :"Time Zone",
               "student_resp_type"      :"Student Response Type",
               "tutor_resp_type"        :"Tutor Response Type",
               "level"                  :"Level (Domain)",
               "problem_name"           :"Problem Name",
               "step_id"                :"Step Name",
               "selection"              :"Selection",
               "action"                 :"Action",
               "input"                  :"Input",
               "tutor_advice"           :"Feedback Text",
               "action_evaluation"      :"Outcome",
               }

session_default_dict =  {key: None for key in LOG_HEADERS.values()}
output_file_path = None
tool_dict = {}
completeness_dict = {}
completeness_file_name = "" 

def _fill_from_elm(log_dict, elm):
    if(elm.tag == "custom_field"):
        name = next(elm.iter("name")).text
        if(name in LOG_HEADERS):
            if(name == "tutor_event_time"):
                dt = datetime.strptime(next(elm.iter("value")).text, "%Y-%m-%d %H:%M:%S.%f %Z")#--> microseconds works on this one
                t = time.strptime(next(elm.iter("value")).text, "%Y-%m-%d %H:%M:%S.%f %Z") #--> timezone works on this one
                log_dict[LOG_HEADERS["tutor_event_time"]] = dt.strftime("%Y-%m-%d %H:%M:%S.") + str(dt.microsecond // 1000)
                log_dict[LOG_HEADERS["timezone"]] = time.strftime("%Z", t)
            else:
                log_dict[LOG_HEADERS[name]] = next(elm.iter("value")).text 
    elif(elm.tag == "event_descriptor"):
        log_dict[LOG_HEADERS["selection"]] = next(elm.iter("selection")).text 
        log_dict[LOG_HEADERS["action"]] = next(elm.iter("action")).text 
        log_dict[LOG_HEADERS["input"]] = next(elm.iter("input")).text 
    elif(elm.tag == "semantic_event"):
        rt = elm.attrib["name"]
        log_dict[LOG_HEADERS["transaction_id"]] = elm.attrib["transaction_id"]
        if(log_dict is tool_dict):
            log_dict[LOG_HEADERS["student_resp_type"]] = rt
        else:
            log_dict[LOG_HEADERS["tutor_resp_type"]] = rt
        # log_dict[LOG_HEADERS["student_resp_type"]] = {"RESULT":"ATTEMPT","HINT_MSG":"HINT_REQUEST"}.get(trt,None)

    elif(elm.tag == "dataset"):
        for level in elm.iter("level"):
            name = next(level.iter("name")).text
            level_header = "Level (%s)" % level.attrib["type"]
            if(level_header in LOG_HEADERS.values()):
                log_dict[level_header] = name
            elm = level

        problem = next(elm.iter("problem"))
        log_dict[LOG_HEADERS["problem_name"]] = next(problem.iter("name")).text 

    elif(elm.tag in LOG_HEADERS):
        log_dict[LOG_HEADERS[elm.tag]] = elm.text

    else:
        for key,value in elm.attrib.items():
            if(key in LOG_HEADERS):
                log_dict[LOG_HEADERS[key]] = value       


class StoppableHttpRequestHandler (SimpleHTTPRequestHandler):
    """http request handler with QUIT stopping the server"""

    def do_GEN_NOOLS(self):
        post_data = _read_data(self)
        d = json.loads(post_data)

        nools_dir = d['nools_dir']
        del d["nools_dir"]

        if not os.path.exists(nools_dir):
            try:
                os.makedirs(nools_dir)
            except OSError as exc: # Guard against race condition
                if exc.errno != errno.EEXIST:
                    raise

        print("---------------------------")
        print(json.dumps(d))
        print("---------------------------")
    
        generate_nools(d,nools_dir)
        with open(os.path.join(nools_dir, "rules.json"),'w') as f:
            json.dump(d,f)
        # json.dump()
        self.send_response(200)
        self.end_headers()
    def do_START_COMPLETENESS(self):
        post_data = _read_data(self)
        d = json.loads(post_data)

        c_dir = d['dir']
        del d["dir"]

        global completeness_dict, completeness_file_name
        completeness_dict = {}



        now = datetime.now() # current date and time
        completeness_file_name = now.strftime("c_%Y-%m-%d-%H_%M_%S") + ".json"

        if not os.path.exists(c_dir):
            try:
                os.makedirs(c_dir)
            except OSError as exc: # Guard against race condition
                if exc.errno != errno.EEXIST:
                    raise

        open(os.path.join(c_dir, completeness_file_name),'a').close()
        
        self.send_response(200)
        self.end_headers()


    def do_APPEND_COMPLETENESS(self):
        post_data = _read_data(self)
        d = json.loads(post_data)

        c_dir = d['dir']
        del d["dir"]

        
        state_str = json.dumps(d['state'])
        # print("---------------------------")
        # print(state_str)
        # print("---------------------------")

    
        if(state_str not in completeness_dict):
            with open(os.path.join(c_dir, completeness_file_name),'a') as f:
                json.dump(d,f)
                f.write("\n")
                completeness_dict[state_str] = True

        # json.dump()
        self.send_response(200)
        self.end_headers()

    def do_QUIT (self):
        _print_and_resp(self)
        self.server.stop = True

    def do_POST (self):
        global session_default_dict
        global output_file_path
        global tool_dict

        # print("POST")

        if(output_file_path == None):
            print("Received log message, but no output_file specifed.")
            return
            

        
        # print("ITS A POST\n")
        post_data = _read_data(self)

        # print(post_data)
        # print(minidom.parseString(post_data).toprettyxml())

        # https://github.com/CMUCTAT/CTAT/wiki/Logging-Documentation
        envelope = ElementTree.fromstring(post_data)
        # print("START \n\n")


        for x in envelope.iter():
            if(x.tag == "log_session_start"):
                # print("Message Type: ", x.tag)
                session_default_dict = {key: None for key in LOG_HEADERS.values()}
                _fill_from_elm(session_default_dict, x)

            if(x.tag == "log_action"):
                payload = ElementTree.fromstring(unquote(x.text))

                # print(minidom.parseString(ElementTree.tostring(payload, encoding='utf8', method='xml')).toprettyxml())

                for msg in payload.iter("context_message"):
                    # print("Message Type: ", "context_message")
                    _fill_from_elm(session_default_dict, msg)
                    for elm in list(msg):
                        _fill_from_elm(session_default_dict,elm)

                for msg in payload.iter("tool_message"):
                    tool_dict = {}
                    for elm in list(msg):
                        _fill_from_elm(tool_dict, elm)
                    # print("TOOL TRANS", msg.attrib)


                for msg in payload.iter("tutor_message"):
                    # print("Message Type: ", "tutor_message")
                    log_dict = session_default_dict.copy()
                    for elm in list(msg):
                        _fill_from_elm(log_dict, elm)

                    # print("------MESSAGE-------")
                    # mstring = ElementTree.tostring(msg, encoding='utf8', method='xml')                    
                    # print(minidom.parseString(mstring).toprettyxml())
                    # print("------LOG_DICT-------")
                    # for key,val in log_dict.items():
                    #     print(key, ":", val)
                    # print("-------------------")

                    # print("------TOOL_DICT-------")
                    # for key,val in tool_dict.items():
                    #     print(key, ":", val)
                    # print("-------------------")

                    if(tool_dict != None and log_dict != None and 
                        tool_dict.get(LOG_HEADERS['transaction_id'],"bleep") == log_dict.get(LOG_HEADERS['transaction_id'],"bloop")):

                        log_dict = {**log_dict, **tool_dict}
                        tool_dict = {}

                    # print("------JOINED DICT-------")
                    # for key,val in log_dict.items():
                    #     print(key, ":", val)
                    # print("-------------------")
                    

                    with open(output_file_path, 'a') as f: 
                        csv_writer = csv.DictWriter(f, LOG_HEADERS.values(),delimiter="\t")
                        csv_writer.writerow(log_dict)

                # print(payload.attrib)
        # print("\nEND\n")
        # print(repr(post_data))
        


        self.send_response(200)
        self.end_headers()
        # _print_and_resp(self)

        # self.server.stop = True

    def do_PRINT (self):
        _print_and_resp(self)

    def do_ERROR (self):
        _print_and_resp(self,sys.stderr)

    def log_message(self, format, *args):
        return
    def log_request(self,code='-', size='-'):
        return



class StoppableHttpServer (HTTPServer):
    """http server that reacts to self.stop flag"""

    def serve_forever (self):
        """Handle one request at a time until stopped."""
        self.stop = False
        while not self.stop:
            self.handle_request()

assert len(sys.argv) > 1, "Error, correct usage: %s <port number>" % sys.argv[0]
assert sys.argv[1].isdigit(), "invalid port %r" % sys.argv[1]
port = int(sys.argv[1])
if (len(sys.argv) > 2):
    output_file_path = sys.argv[2]

    # Make path if not exist
    if not os.path.exists(os.path.dirname(output_file_path)):
        try:
            os.makedirs(os.path.dirname(output_file_path))
        except OSError as exc: # Guard against race condition
            if exc.errno != errno.EEXIST:
                raise


    with open(output_file_path, 'w') as f: 
        csv_writer = csv.DictWriter(f, LOG_HEADERS.values(),delimiter="\t")
        csv_writer.writeheader()


server = StoppableHttpServer(("localhost", port), StoppableHttpRequestHandler)
print("HOST SERVER STARTED")
server.serve_forever()
