from flask import Flask, request, send_from_directory, g, make_response

import threading
from queue import Queue, PriorityQueue
from http.client import HTTPConnection
import os, sys, time, logging
from datetime import datetime
from xml.etree import ElementTree
from xml.etree.ElementTree import ElementTree as ETree
from xml.dom import minidom 
from urllib.parse import unquote
import uuid, csv
import errno
import json
from al_hostserver.nools_gen import generate_nools
from pprint import pprint
import colorama
from colorama import Fore, Back, Style
import atexit
import signal
from glob import glob
# from flask import Flask, 

FETCH_ABOVE_ROOT = str(os.environ.get("AL_HOST_FETCH_ABOVE_ROOT","False")).lower() == "true"
debuggingState = str(os.environ.get("DEBUGGING_STATE", "False")).lower() == "true"

print("FETCH_ABOVE_ROOT", FETCH_ABOVE_ROOT)

host_dir = os.path.dirname(__file__)
al_train_dir = os.path.join(host_dir,"..")
build_dir = os.path.abspath(os.path.join(al_train_dir,"react_interface","build"))
release_dir = os.path.abspath(os.path.join(al_train_dir,"react_interface","release"))
dist_dir = release_dir
if(os.path.isdir(build_dir)): dist_dir = build_dir

static_dir = os.path.abspath(os.path.join(dist_dir,"static"))


print("RELEASE DIR", release_dir)
if(not os.path.exists(build_dir)): build_dir = release_dir

colorama.init(autoreset=True)

HOST_DOMAIN = '127.0.0.1' #Use this instead of localhost on windows
# PORT = 8000
post_queue = Queue(maxsize=0)
write_queue = Queue(maxsize=0)

# session_events = {}
session_data_lock = threading.Lock()
context_data_lock = threading.Lock()
write_lock = threading.Lock()
timer_lock = threading.Lock()
# transaction_lock = threading.Lock()
session_dicts = {}
write_timers = {}

# IGNORE_TOOL_MESSAGES = False
WRITE_WAIT_TIME = 1.0 #seconds
POST_THREADS = 4
WRITE_THREADS = 1

GLOBAL_TICKER = 0
OVERRIDE_TIME = True
RUNNING = True

#defining function to run on shutdown
def cleanup(*args):
    global write_queue
    global post_queue
    global log_file_handle

    RUNNING = False
    post_queue.join()
    time.sleep(2*WRITE_WAIT_TIME)
    write_queue.join()
    log_file_handle.close()
    # print("CLEANUP")

#Register the function to be called on exit
atexit.register(cleanup)
signal.signal(signal.SIGTERM, cleanup)



def check_started(host,port):
    started = False
    while not started:
        try:
            conn = HTTPConnection("%s:%d" % (host,port))
            j_msg = json.dumps({"type" : "info", "message" : "Server Started"})
            conn.request("PRINT", "/", j_msg)
            resp = conn.getresponse()
            if resp.status == 200:
                started = True
            
        except:
            time.sleep(.001)
    print("HOST SERVER STARTED")


class HostServer(Flask):
    def run(self, host=None, port=None, debug=debuggingState, load_dotenv=True, **options):
        thread = threading.Thread(target=lambda : check_started(host,port))
        thread.start() 
        super(HostServer, self).run(host=host, port=port, debug=debug, load_dotenv=load_dotenv, **options)
    
print("HOST CWD", os.getcwd(), __name__)
# app = HostServer(__name__,static_folder='.',root_path=os.getcwd())
app = HostServer(__name__,static_folder=".")#,root_path=os.getcwd())

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
               "problem_start_time"     :"Problem Start Time",
               "step_id"                :"Step Name",
               "selection"              :"Selection",
               "action"                 :"Action",
               "input"                  :"Input",
               "tutor_advice"           :"Feedback Text",
               "action_evaluation"      :"Outcome",
               "problem_context"        :"CF (Problem Context)",
               "single_kc"              :"KC (Single-KC)",
               }

session_default_dict =  {key: None for key in LOG_HEADERS.values()}
output_file_path = None
tool_dict = {}

def _fill_from_elm(log_dict, elm,typ='tutor', date_time=None, timezone=None):
    global GLOBAL_TICKER

    if(elm.tag == "custom_field"):
        name = next(elm.iter("name")).text
        if(name in LOG_HEADERS):
            if(name == "tutor_event_time"):
                dt = datetime.strptime(next(elm.iter("value")).text, "%Y-%m-%d %H:%M:%S.%f %Z")#--> microseconds works on this one
                t = time.strptime(next(elm.iter("value")).text, "%Y-%m-%d %H:%M:%S.%f %Z") #--> timezone works on this one
                log_dict[LOG_HEADERS["tutor_event_time"]] = dt.strftime("%Y-%m-%d %H:%M:%S.") + str(dt.microsecond // 1000)
                log_dict[LOG_HEADERS["timezone"]] = time.strftime("%Z", t)
                # print(log_dict[LOG_HEADERS["tutor_event_time"]])
            else:
                log_dict[LOG_HEADERS[name]] = next(elm.iter("value")).text 
    elif(elm.tag == "event_descriptor" and typ == "tool"):
        log_dict[LOG_HEADERS["selection"]] = next(elm.iter("selection")).text 
        log_dict[LOG_HEADERS["action"]] = next(elm.iter("action")).text 
        log_dict[LOG_HEADERS["input"]] = next(elm.iter("input")).text 

        
    elif(elm.tag == "semantic_event"):
        rt = elm.attrib["name"]
        log_dict[LOG_HEADERS["transaction_id"]] = elm.attrib["transaction_id"]
        if(typ == "tool"):
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
        log_dict[LOG_HEADERS["problem_name"]] = os.path.basename(next(problem.iter("name")).text)
        log_dict[LOG_HEADERS["problem_context"]] = next(problem.iter("context")).text 
        log_dict[LOG_HEADERS["single_kc"]] = 'Single-KC'

    elif(elm.tag == "context_message" and elm.attrib.get("name",None) == "START_PROBLEM"):
        if(OVERRIDE_TIME):
            log_dict[LOG_HEADERS['problem_start_time']] = time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime(GLOBAL_TICKER))#GLOBAL_TICKER * 1000
        else:
            log_dict[LOG_HEADERS['problem_start_time']] = date_time

    elif(elm.tag in LOG_HEADERS):
        log_dict[LOG_HEADERS[elm.tag]] = elm.text

    else:
        for key,value in elm.attrib.items():
            if(key in LOG_HEADERS):
                log_dict[LOG_HEADERS[key]] = value       



def shutdown_server():
    func = request.environ.get('werkzeug.server.shutdown')
    if func is None:
        raise RuntimeError('Not running with the Werkzeug Server')
    func()
        

def _print_and_resp(message=None,m_type="default",outmode=sys.stdout):
    # content_length = int(handler.headers['Content-Length']) # <--- Gets the size of data
    # post_data = handler.rfile.read(content_length) # <--- Gets the data itself
    if(message is None):
        post_data = json.loads(request.get_data())
        # print(post_data)
        m_type = post_data.get('type', 'default').lower()
        message = post_data.get('message', None)
    
    # print("message",message)
    if(message is not None):
        if m_type == 'correct':
            print(Back.GREEN + Fore.BLACK  + message)
        elif m_type == 'incorrect':
            print(Back.RED + Fore.BLACK + message)
        elif m_type == 'example':
            print(Back.BLUE + Fore.YELLOW  +  message)#, file=outmode)
        elif m_type == 'info':
            print(Back.WHITE + Fore.BLACK + message)
        elif m_type == 'warning':
            print(Back.BLACK + Fore.YELLOW + message)#, file=outmode)
        elif m_type == 'error':
            print(Back.BLACK + Fore.RED + message)#, file=outmode)
        else:
            print(message)#, file=outmode)
    # handler.send_response(200)
    # handler.end_headers()

# f = with open(output_file_path, 'a', newline='') as f: 


def write_rows(rows,count):
    global write_lock
    global csv_writer
    global log_file_handle
    # print("WRITE(%s) %d" %( count, len(rows)))
    write_lock.acquire()
    for row in rows:
        csv_writer.writerow(row)
    write_lock.release()
    log_file_handle.flush()


write_count = -1

def write_problem(session_id,context_id,order=None):
    global output_file_path
    global session_dicts
    global write_count
    global context_data_lock

    write_count += 1
    
    c_dict = session_dicts[session_id]['logs'][context_id]
    tool_logs = c_dict['tool']
    tutor_logs = c_dict['tutor']
    session_start_dict = session_dicts[session_id]['start']
    context_dict = c_dict['context']
    # print("COUNT(%d) %d:%d" % (write_count, len(tool_logs.keys()),len(tutor_logs.keys())))
    if(order is None):
        context_data_lock.acquire()
        order = sorted([k for k,v in c_dict["time"].items()], key=lambda x: c_dict["time"][x])
        c_dict['time'] = {}
        context_data_lock.release()
        # print(c_dict["time"])
        # print(order)
         
    rows = []
    default_dict = {**{key: None for key in LOG_HEADERS.values()},
                     **session_start_dict,
                     **context_dict}
    for t_id in order:
        rows.append({**default_dict,
                     **tool_logs.get(t_id,{}),
                     **tutor_logs.get(t_id,{})})
        # if(t_id not in tool_logs):
        #     pprint(tool_logs)
        #     pprint(tutor_logs)
        if(t_id in tool_logs): del tool_logs[t_id]
        if(t_id in tutor_logs): del tutor_logs[t_id]
        # transaction_lock.acquire()
        # tool_logs[]

    write_rows(rows,write_count)

    # del session_dicts[session_id]['logs'][context_id]

context_counter = 0

def get_context_dict(session_id,context_id):
    global context_data_lock
    global session_dict
    global context_counter
    context_data_lock.acquire()

    if(context_id not in session_dicts[session_id]['logs']):
        logs = session_dicts[session_id]['logs']
        c_dict = {}
        logs[context_id] = c_dict
        c_dict["context"] = {}
        c_dict["tool"] = {}
        c_dict["tutor"] = {}
        c_dict["priority"] = context_counter

        context_counter += 1
    else:
        c_dict = session_dicts[session_id]['logs'][context_id]

    context_data_lock.release()
    return c_dict


def assign_time(context_dict,d,T):
    global context_data_lock
    global GLOBAL_TICKER
    global OVERRIDE_TIME
    transaction_id = d['Transaction Id']
    context_data_lock.acquire()
    if('time' not in context_dict): context_dict['time'] = {}
    if(transaction_id not in context_dict['time']):
        context_dict['time'][transaction_id] = T
    if(OVERRIDE_TIME): d['Time'] = time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime(GLOBAL_TICKER))#GLOBAL_TICKER * 1000
    context_data_lock.release()

# def assign_message_dict(c_dict, typ, T,d):
#     transaction_lock.acquire()
#     c_dict[typ][T] = d
#     transaction_lock.release()

def reset_write_timer(session_id, context_id):
    global timer_lock
    global write_queue
    global write_timers
    global WRITE_WAIT_TIME

    timer_lock.acquire()
    # print("RESET", scontext_id)
    sd = write_timers.get(session_id,{})
    wt = sd.get(context_id,None)
    if(wt is not None): wt.cancel()
    wt = threading.Timer(WRITE_WAIT_TIME,lambda :write_queue.put((session_id,context_id)))
    sd[context_id] = wt
    write_timers[session_id] = sd
    timer_lock.release()

def start_write_timer(session_id, context_id):
    global write_timers
    global timer_lock
    with timer_lock:
        timer = write_timers[session_id][context_id]
        if(not timer.is_alive()):
            timer.start()

    
#####################
def handle_post(post_data,T):
    global session_data_lock
    global context_counter

    # global session_events
    global session_dicts
    # print(minidom.parseString(post_data).toprettyxml())

    # https://github.com/CMUCTAT/CTAT/wiki/Logging-Documentation
    envelope = ElementTree.fromstring(post_data)

    for x in envelope.iter():
        session_id = x.attrib["session_id"]

        session_data_lock.acquire()
        if(session_id not in session_dicts):
            session_dict = {}
            session_dict['logs'] = {}
            session_dict['start'] = {}
            session_dicts[session_id] = session_dict

        session_data_lock.release()

        # for date_time in x.iter("date_time"):
        date_time = x.attrib.get('date_time',None)
        timezone = x.attrib.get('timezone',None)

        # print(minidom.parseString(ElementTree.tostring(x, encoding='utf8', method='xml')).toprettyxml())

        # print("TAG",x.tag)
        if(x.tag == "log_session_start"):
            session_start_dict = {}
            _fill_from_elm(session_start_dict, x)
            session_dicts[session_id]['start'] = session_start_dict
            # print(minidom.parseString(ElementTree.tostring(x, encoding='utf8', method='xml')).toprettyxml())
        
        elif(x.tag == "log_action"):
            payload = ElementTree.fromstring(unquote(x.text))
            # print(minidom.parseString(ElementTree.tostring(payload, encoding='utf8', method='xml')).toprettyxml())

            ## CONTEXT MESSAGES
            for msg in payload.iter("context_message"):
                context_id = msg.attrib['context_message_id']
                context_dict = {}
                _fill_from_elm(context_dict, msg, 'context', date_time, timezone)
                for elm in list(msg):
                    _fill_from_elm(context_dict,elm)


                c_dict = get_context_dict(session_id,context_id)
                c_dict['context'] = context_dict
    
            ## TOOL MESSAGES
            for msg in payload.iter("tool_message"):
                # tool_queue.put((session_id,msg))
                context_id = msg.attrib['context_message_id']

                tool_dict = {}
                for elm in list(msg):
                    _fill_from_elm(tool_dict, elm,"tool")

                reset_write_timer(session_id,context_id)
                c_dict = get_context_dict(session_id,context_id)
                assign_time(c_dict,tool_dict,T)
                # assign_message_dict(c_dict, 'tool', tool_dict['Transaction Id'], tool_dict)
                c_dict['tool'][tool_dict['Transaction Id']] = tool_dict

                # with timer_lock: write_timers[session_id][context_id].start()
                start_write_timer(session_id,context_id)
                

            ## TUTOR MESSAGES
            for msg in payload.iter("tutor_message"):
                context_id = msg.attrib['context_message_id']
                log_dict = {}

                sel = None
                for elm in list(msg):
                    _fill_from_elm(log_dict, elm,"tutor")
                    if(elm.tag == "event_descriptor"):
                        sel = next(elm.iter("selection")).text 

                reset_write_timer(session_id,context_id)
                c_dict = get_context_dict(session_id,context_id)
                assign_time(c_dict,log_dict,T)
                # assign_message_dict(c_dict, 'tutor', log_dict['Transaction Id'], log_dict)
                c_dict['tutor'][log_dict['Transaction Id']] = log_dict
                start_write_timer(session_id,context_id)
                # if(sel == "done" and log_dict.get("Outcome",None) == "CORRECT"):
                #     timer = threading.Timer(WRITE_WAIT_TIME,lambda :write_queue.put((session_id,context_id)))
                #     timer.start()

    return ""


class PostItem(object):
    def __init__(self, xml_tree, session_id, priority):
        self.xml_tree = xml_tree
        self.session_id = session_id
        self.priority = priority

        
    def __eq__(self, other):
        return self.priority == other.priority

    def __ne__(self, other):
        return self.priority != other.priority

    def __lt__(self, other):
        return self.priority < other.priority

    def __le__(self, other):
        return self.priority <= other.priority

    def __gt__(self, other):
        return self.priority > other.priority

    def __ge__(self, other):
        return self.priority >= other.priority


def work_on_write_queue():
    while True:
        session_id,context_id = write_queue.get()
        # print("POP", session_id,context_id)
        # print("TYYPE", type(data))
        write_problem(session_id,context_id)
        write_queue.task_done()

def work_on_post_queue():
    while True:
        data = post_queue.get()
        # print("TYYPE", type(data))
        post_data, T = data
        handle_post(post_data, T)
        post_queue.task_done()

for i in range(POST_THREADS):
    thread = threading.Thread(target=work_on_post_queue)
    thread.setDaemon(True)
    thread.start()

for i in range(WRITE_THREADS):
    thread = threading.Thread(target=work_on_write_queue)
    thread.setDaemon(True)
    thread.start()


def do_PRINT():
    _print_and_resp()
    return ""

def do_QUIT():
    _print_and_resp()
    shutdown_server()
    return 'Server shutting down...'

def do_GLOB():
    r = json.loads(request.get_data())
    print("GLOB IT", r)
    if(FETCH_ABOVE_ROOT): r = r.replace("!u","..")
    g = glob(r.lstrip("/"))
    return json.dumps(g)

def do_GEN_NOOLS():
    post_data = request.get_data()
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

    return ""

def do_PROBLEM_DONE():
    r = json.loads(request.get_data())
    timer = threading.Timer(WRITE_WAIT_TIME,lambda :write_queue.put((r['session_id'],r['context_id'])))
    timer.start()
    return ""


completeness_dict = None
completeness_file_name = None  
def do_START_BEHAVIOR_PROFILE():
    global completeness_dict, completeness_file_name
    post_data = request.get_data()
    d = json.loads(post_data)
    c_dir = d['dir']
    elapse_minutes = d.get('elapse_minutes',None)

    completeness_dict = {}
    now = datetime.now() # current date and time
    completeness_file_name = now.strftime("bp_%Y-%m-%d-%H_%M_%S") + ".json"

    if not os.path.exists(c_dir):
        try:
            os.makedirs(c_dir)
        except OSError as exc: # Guard against race condition
            if exc.errno != errno.EEXIST:
                raise

    with open(os.path.join(c_dir, completeness_file_name),'a') as f:
        if(elapse_minutes != None): f.write("# Elapsed Minutes: %s\n" % elapse_minutes)
    return ""

def do_APPEND_BEHAVIOR_PROFILE():
    global completeness_dict, completeness_file_name
    post_data = request.get_data()
    d = json.loads(post_data)
    c_dir = d['dir']
    del d["dir"]

    state_str = json.dumps(d['state'])

    if(state_str not in completeness_dict):
        with open(os.path.join(c_dir, completeness_file_name),'a') as f:
            json.dump(d,f)
            f.write("\n")
            completeness_dict[state_str] = True
    return ""



# counter = 0
ticker_lock = threading.Lock()
def do_POST ():
    global GLOBAL_TICKER

    if(not RUNNING):
        print("Shutting down... POST ignored. ")
        return ""

    ticker_lock.acquire()
    GLOBAL_TICKER += 1    
    ticker_lock.release()

    if(output_file_path == None):
        print("Received log message, but no output_file specifed.")
        return
    
    post_data = request.get_data()
    post_queue.put((post_data,GLOBAL_TICKER))

    return ""

    
##SHOULD PROBABLY EVENTUALLY MAKE THIS SAFE BY ONLY RETRIEVE FROM STATIC DIR
def do_GET(path):
    # if(path == ""): #handle_static("index.html")#path = "index.html"
    # print("GET", path[:])
    if(path == ""): 
        # headers = {}
        return send_from_directory(os.path.join(al_train_dir,"al_hostserver"),"index.html")
        # p = os.path.join(static_dir,"index.html")
        # if(os.path.isfile(p)):
            # with open(p, 'r') as f:
                # body = f.read()
            # return make_response((body, headers))   
        # else:
            # return make_response("Not found.", 404) 
        # return handle_static("index.html")
    # print("GET", os.path.join(wd,path[:]),path[:])
    

    # return app.send_static_file(os.path.join(wd,path[:]))
    
    # os.path.dirname()
    # os.path.basename()
    if(FETCH_ABOVE_ROOT):
        return send_from_directory(os.path.join(os.getcwd(),os.path.dirname(path))
                                ,os.path.basename(path))
    else:
        return send_from_directory(os.getcwd(),path)#app.send_static_file(path)

def do_WRITE():
    write_data = request.get_data()
    with open(write_data['path'],'w') as f:
        f.write(write_data['data'])


do_switch = {"PRINT":do_PRINT,
             "ERROR":do_PRINT,
             "QUIT": do_QUIT,
             "POST": do_POST,
             "GET" : do_GET,
             "START_BEHAVIOR_PROFILE" : do_START_BEHAVIOR_PROFILE,
             "APPEND_BEHAVIOR_PROFILE" : do_APPEND_BEHAVIOR_PROFILE,
             "GLOB" : do_GLOB,
             "WRITE" : do_WRITE,
             }



@app.route('/', defaults={'path': ''},methods=list(do_switch.keys()))
@app.route('/<path:path>')
def handle_root(path):
    if(FETCH_ABOVE_ROOT): path = path.replace("!u","..")
    func = do_switch.get(request.method,None)
    # print("METHOD: %s" % request.method)
    if(func is not None):
        if(request.method == "GET"):
            return func(path)
        else:
            return func()
    else:
        return make_response("Method not recognized", 400)
  

# ...
# @app.route('/file_downloads/<filename>')
# def file_downloads(filename):
#     headers = {"Content-Disposition": "attachment; filename=%s" % filename}
#     with open('../tmp/you_private_file.zip', 'r') as f:
#         body = f.read()
#     return  make_response((body, headers))

@app.route('/static/<path:path>')
def handle_static(path):
    print("STATIC",path)
    return send_from_directory(static_dir,path)

@app.route('/al_train/<path:path>')
def handle_al_train(path):
    print("AL_TRAIN (dir)",path)
    return send_from_directory(al_train_dir,path)

@app.route('/build/<path:path>')
def handle_build(path):
    print("BUILD",path)
    return send_from_directory(build_dir,path)

@app.route('/release/<path:path>')
def handle_release(path):
    print("RELEASE",path)
    return send_from_directory(release_dir,path)

@app.route('/dist/<path:path>')
def handle_dist(path):
    print("DIST",path)
    return send_from_directory(dist_dir,path)

@app.route('/host/<path:path>')
def handle_host(path):
    print("HOST",path)
    return send_from_directory(host_dir,path)

    # if(request.method == "GET"):
    #     headers = {}
    #     p = os.path.join(static_dir,path[:])
    #     print(p)
    #     if(os.path.isfile(p)):
    #         with open(p, 'r') as f:
    #             body = f.read()
    #         return make_response((body, headers))    
    #     else:
    #         return make_response("Not found.", 404)
    # else:
    #     return make_response("Method not recognized", 400)


if __name__ == '__main__':
    # logging.basicConfig(level=logging.ERROR)
    print("FILE",static_dir)

    assert len(sys.argv) > 1, "Error, correct usage: %s <port number>" % sys.argv[0]
    assert sys.argv[1].isdigit(), "invalid port %r" % sys.argv[1]
    port = int(sys.argv[1])
    # static_dir = sys.argv[2]
    if (len(sys.argv) > 2):
        output_file_path = sys.argv[2]

        # Make path if not exist
        if not os.path.exists(os.path.dirname(output_file_path)):
            try:
                os.makedirs(os.path.dirname(output_file_path))
            except OSError as exc: # Guard against race condition
                if exc.errno != errno.EEXIST:
                    raise

        with open(output_file_path, 'w', newline='') as f: 
            csv_writer = csv.DictWriter(f, LOG_HEADERS.values(),delimiter="\t")
            csv_writer.writeheader()

        log_file_handle = open(output_file_path, 'a', newline='') 
        csv_writer = csv.DictWriter(log_file_handle, LOG_HEADERS.values(),delimiter="\t")
    log = logging.getLogger('werkzeug')
    log.disabled

    app.run(HOST_DOMAIN,port,threaded=True)
   # print("IT DIED")
