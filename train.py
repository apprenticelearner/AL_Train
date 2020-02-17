# Used to start training an Apprentice Learner agent interactively or via example/model tracing.
#

import argparse,sys,os, atexit,re
import subprocess, threading
from subprocess import check_output
import socket, errno
import signal, time
from datetime import datetime

al_process = None
ctat_process = None
browser_process = None
outer_loop_process = None
# al_thread = None
# ctat_thread = None
calling_dir = None
CONFIG_DEFAULT = "net.conf"
HOST_DOMAIN = '127.0.0.1' #Use this instead of localhost on windows


def read_conf(ns, path):
    # args = {}

    with open(path,'r') as f:
        for line in f:
            x = line.split("=")
            if(len(x) > 1 and getattr(ns,x[0],None) == None):
                key = x[0].lower();
                val = x[1].strip('\"\'\n \t\f\r');
                if(val == ""):
                    continue
                if("port" in key):
                    try:
                        val  = int(val)
                    except ValueError as e:
                        if(val.strip() != ""):
                            print("Invalid port %s for %s." % (val,key), file=sys.stderr)
                            sys.exit()
                elif("args" in key):
                    val= list(filter(None,re.split(';|,| |\t|\n', val))) # turn into a list of args


                setattr(ns, key, val); #Strip quotes and whitespace
    return ns


def force_kill_port(port):
    print("Attempting force kill...")
    tokill = []
    if("linux" in sys.platform):
        try:
            tokill =  [int(x) for x in check_output(["lsof", "-Pi", ":" + str(port), "-sTCP:LISTEN", "-t"]).splitlines()]
            print("Found processes: %s bound to %s" % (tokill, port))
        except Exception as e:
            #At this point nothing popped up so we're good
            return True;
    else:
        raise Warning("Force kill (-f/--force) not implemented for operating system %r" % sys.platform)
        return False;
    print("Killing processes: %s" % tokill)
    for pid in tokill:
        kill_group(pid)
    return True
    # os.kill(pid, signal.SIGTERM)


def check_port(host, port, force=False):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    try:
        s.bind((host, port))
    except socket.error as e:
        if(force):

            return force_kill_port(port)
            # time.sleep(.1)
            # return check_port(host,port,False)
        else:
            print(e)
        return False
    try:
        s.shutdown(socket.SHUT_RDWR)
    except:
        pass
    s.close()
    return True

def port_error(nm, port):
    raise socket.error( "Failed to start %s at port %s. Port already in use." %(nm,port) )
    sys.exit()

def waitAndExit(proc, onExit):

    proc.wait()
    onExit()

def kill_group(p):
    if(isinstance(p,int)):
        pgid = os.getpgid(p)
    else:
        pgid = os.getpgid(p.pid)
    print("PGID", pgid)
    os.killpg(pgid, signal.SIGTERM)

def kill_all():
    global al_process,ctat_process, browser_process
    # al_process.stderr = None
    # ctat_process.stderr = None
    # al_process.stdout = None
    # ctat_process.stdout = None
    # al_process.stderr.close()
    # ctat_process.stderr.close()
    # temp_stderr = sys.stderr
    # sys.stderr = None
    # sys.stdout = None
    # if(hasattr(os, "killpg")):
    #     os.killpg(os.getpgid(), signal.SIGTERM)
    # else:
    if(al_process != None): al_process.terminate()
    if(ctat_process != None): ctat_process.terminate()
    if(browser_process != None): browser_process.terminate()
    if(outer_loop_process != None): outer_loop_process.terminate()
    # sys.stderr = temp_stderr
    # if(al_process != None): kill_group(al_process)
    # if(ctat_process != None): kill_group(ctat_process)



def apply_wd(path):
    path = os.path.expandvars(path)
    if(not os.path.isabs(path)):
        path = os.path.join(calling_dir,path)
    return path

def get_open_port():
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.bind(("",0))
        s.listen(1)
        port = s.getsockname()[1]
        s.close()
        return port


def parse_args(argv):
    parser = argparse.ArgumentParser(description='Convert ROOT data to numpy arrays stored as HDF5 for Machine Learning use.')
    parser.add_argument('training', type=str, metavar="<training_file>.json",
        help="A JSON file that specifies the sequence of problems to train on.")
    parser.add_argument('-f', '--force', action='store_true',default=False, dest = "force",
        help="Force kill processes that hold up ports we want to use. Only implemented for Linux systems.")
    parser.add_argument('-i', '--interactive', action='store_true',default=False, dest = "interactive",
        help="Indicates that AL should trained interactively by the user instead of automatically by example/model tracing.")
    parser.add_argument('--foci', action='store_true',default=False, dest = "use_foci",
        help="Indicates that AL should trained interactively by the user instead of automatically by example/model tracing.")

    parser.add_argument('-a', '--al-port' , default=None, dest = "al_port",     metavar="<AL_port>",
        type=int, help="The port for the apprentice learner server.")
    parser.add_argument('-c', '--ctat-port',default=None, dest = "ctat_port",   metavar="<CTAT_port>",
        type=int, help="The port where the ctat interface and logging server bind to.")

    parser.add_argument('--al-host' , default=HOST_DOMAIN, dest = "al_host",     metavar="<AL_host>",
        help="The host url for the apprentice learner server. Default=localhost.")
    parser.add_argument('--ctat-host' , default=HOST_DOMAIN, dest = "ctat_host",     metavar="<CTAT_host>",
        help="The host url for the apprentice learner server. Default=localhost.")

    parser.add_argument('-d', '--al-dir' ,  default=None, dest = "al_dir",      metavar="<AL_dir>",
        help="The directory where the apprentice learner API can be found.")
    parser.add_argument('--no-al-server' , action='store_true', dest="no_al_server", help="Do not start an AL server.")

    parser.add_argument('-b', '--broswer' , default=None, dest = "browser",     metavar="<browser>",
        help="The browser executable to run CTAT on.")
    parser.add_argument('--broswer-args' , default='', dest = "browser_args",     metavar="<browser_args>",
        help="Shell arguements to pass to the browser."
        )

    parser.add_argument('-t', '--tutor' , default=None, dest = "tutor",     metavar="<tutor>",
        help="The type of tutor (e.g. 'ctat' or 'stylus')")

    parser.add_argument('-l', '--log-dir' , default=None, dest = "log_dir",     metavar="<log_dir>",
        help="The directory where tab deliminated logging files are written. Overridden by -o/--output.")
    parser.add_argument('-o', '--output' ,  default=None, dest = "output",      metavar="<output>",
        help="The tab deliminated logging file for the session should go to. By default will be generated with a timestamp in the /log directory")

    parser.add_argument('--config' ,  default=CONFIG_DEFAULT, dest = "config",      metavar="<config>.conf",
        help="Bash style configuration file used for setting default variables. ")
    parser.add_argument('-w' , "--working-directory",  default=None, dest = "wd",      metavar="<working-directory>",
        help="The working directory of the ctat server. By default it is the directory where training.json is located")
    parser.add_argument('-n' , "--nools",  default=None, dest = "nools_dir",      metavar="<nools-out-dir>",
        help="The directory to output the nools production rule code for the agent")

    parser.add_argument('--outer-loop', action='store_true', default=False, dest = "outer_loop",
        help="Specifies that an external outer loop server will be used.")
    parser.add_argument('--outer-loop-host' , default=HOST_DOMAIN, dest = "outer_loop_host",     metavar="<outer_loop_host>",
        help="The host url for the outer loop server. Default=localhost.")
    parser.add_argument('--outer-loop-port', default=None, dest = "outer_loop_port",      metavar="<outer_loop_port>",
        help="Specifies the port to bind to for running the outer loop server.")
    parser.add_argument('--outer-loop-dir', default=None, dest = "outer_loop_dir",      metavar="<outer_loop_dir>",
        help="Specifies the directory of the outer loop repo.")
    parser.add_argument('--outer-loop-url', default=None, dest = "outer_loop_url",      metavar="<outer_loop_url>",
        help="Specifies the URL of a running outer loop server.")

    try:
        args = parser.parse_args(argv)
        # args.setattr(args, "training", args.training[0]) # dunno why it comes in a list

    except Exception:
        parser.print_usage()
        sys.exit()

    read_conf(args, args.config)

    print(args.browser_args)
    if(isinstance(args.browser_args, str)): args.browser_args = [args.browser_args]

    # args.browser_args = list(filter(None,re.split(';|,| |\t|\n', args.browser_args)))
    # print(args.browser_args)

    args.log_dir = os.path.abspath(apply_wd(args.log_dir))
    args.al_dir = os.path.abspath(apply_wd(args.al_dir))
    # os.path.join(calling_dir,args.al_dir)
    args.training = os.path.relpath(apply_wd(args.training), start=os.getcwd())


    assert os.path.isfile(args.training), "No such file %r" % args.training
    # assert args.al_port != None, "AL_PORT not specified or set in %s" % args.config
    # assert args.ctat_port != None, "CTAT_PORT not specified or set in %s" % args.config
    assert args.al_dir != None, "AL_DIR not specified or set in %s" % args.config
    # assert args.browser != None, "BROWSER not specified or set in %s" % args.config
    assert args.log_dir != None, "LOG_DIR not specified or set in %s" % args.config

    if(args.output == None):
        args.output = "%s/%sLog-%s.txt" % (args.log_dir , os.path.basename(args.training).split(".")[0], datetime.now().strftime("%Y-%m-%d-%H_%M_%S"))

    if(args.outer_loop_dir != None):
        args.outer_loop_dir = os.path.abspath(apply_wd(args.outer_loop_dir))



    args.output = os.path.abspath(apply_wd(args.output))


    return args

# RUN = True

# def stop(sig, frame):
#     print("SIGNAL CAUGHT", sig,al_process,ctat_process)
#     RUN =False
#     kill_all()

# signal.signal(signal.SIGTERM, stop )
# signal.signal(signal.SIGINT, stop)



def main(args):
    global al_process,ctat_process, browser_process, outer_loop_process

    if args.no_al_server:
        assert args.al_port is not None, "Must specify AL_PORT in net.conf or command line"
    else:
        if(not args.al_port): args.al_port = get_open_port()
        if(check_port(args.al_host, args.al_port, args.force)):
            al_process =  subprocess.Popen([sys.executable, os.path.join(args.al_dir, "manage.py"), "runserver", str(args.al_host) + ":" + str(args.al_port)])
            # al_thread = threading.Thread(target=waitAndExit, args=(al_process, kill_all))
            # al_thread.start()
        else:
            port_error("AL", args.al_port)

    if(not args.ctat_port): args.ctat_port = get_open_port()
    if(check_port(args.ctat_host, args.ctat_port, args.force)):
        ctat_process = subprocess.Popen([sys.executable, os.path.join("src", "host_server.py") , str(args.ctat_port), args.output])
        # ctat_thread = threading.Thread(target=waitAndExit, args=(ctat_process, kill_all))
        # ctat_thread.start()

    else:
        port_error("CTAT", args.ctat_port)

    if(args.outer_loop_url is None and args.outer_loop):
        assert args.outer_loop_dir is not None, "Must specify OUTER_LOOP_DIR in net.conf"
        if(not args.outer_loop_port): args.outer_loop_port = get_open_port()
        if(check_port(args.outer_loop_host, args.outer_loop_port, args.force)):
            # print([sys.executable, os.path.join(args.outer_loop_dir, "src", "server.py") , "--host", str(args.outer_loop_host),"--port", int(args.outer_loop_port)])
            outer_loop_process = subprocess.Popen([sys.executable, os.path.join(args.outer_loop_dir, "server.py") , "--host", str(args.outer_loop_host),"--port", str(args.outer_loop_port)])
            args.outer_loop_url = args.outer_loop_host + ":" + str(args.outer_loop_port)
        else:
            port_error("OUTER LOOP", args.outer_loop_port)
    if(args.outer_loop_url is not None and
       not (args.outer_loop_url.startswith("http://") or
       args.outer_loop_url.startswith("https://"))):
        args.outer_loop_url = "http://" + args.outer_loop_url

    ctat_url = "http://%s:%s/?training=/%s&al_url=http://%s:%s" % \
                (HOST_DOMAIN, args.ctat_port, args.training, HOST_DOMAIN, args.al_port)
    if(args.wd != None): ctat_url += "&wd=" + args.wd
    if(args.interactive): ctat_url += "&interactive=true"
    if(args.use_foci): ctat_url += "&use_foci=true"
    if(args.nools_dir): ctat_url += "&nools_dir=%s" % args.nools_dir
    if(args.tutor): ctat_url += "&tutor=%s" % args.tutor
    if(args.outer_loop_url): ctat_url += "&outer_loop_url=%s" % args.outer_loop_url


    if(args.browser != None and "selenium" in args.browser):
        from selenium import webdriver
        sys.path.append("/home/danny/Projects")
        if("chrome" in args.browser):
            options = webdriver.ChromeOptions()
            options.add_argument('--ignore-certificate-errors')
            options.add_argument("--test-type")
            for x in args.browser_args:
                if(x): options.add_argument(x)
            # options.binary_location = "/home/danny/Projects/chromedriver"
            driver = webdriver.Chrome(chrome_options=options)
            driver.get(ctat_url)
        elif("firefox" in args.browser):

            #             geckodriver = 'C:\\Users\\grayson\\Downloads\\geckodriver.exe'



            # browser =
            options = webdriver.FirefoxOptions()
            # options.add_argument('--ignore-certificate-errors')
            # options.add_argument("--test-type")
            for x in args.browser_args:
                if(x): options.add_argument(x)
            # options.binary_location = "/home/danny/Projects/chromedriver"
            driver = webdriver.Firefox(firefox_options=options)
            driver.get(ctat_url)
        else:
            raise ValueError("Browser %r not supported" % args.browser)
    elif(args.browser != None):
        browser_process = subprocess.Popen([args.browser, ctat_url] + args.browser_args)
    else:
        #use defualt browser
        import webbrowser
        webbrowser.get().open(ctat_url)



    # al_process.wait()
    # print("AL PROCESS")
    while True:
        if((not args.no_al_server and al_process.poll() != None) or ctat_process.poll() != None):
            break
        # try:
        time.sleep(.1)
            # ctat_process.wait(.1)
        # except:
            # pass

    # ctat_thread.join()

    kill_all()
    sys.exit()

def setup_net_conf():
    i = sys.argv.index("--al-dir") if "--al-dir" in sys.argv else None
    if(i == None): i = sys.argv.index("-d") if "-d" in sys.argv else None
    if(i == None):
        al_dir = input("Enter the directory where you cloned the apprentice_learner_api \
         otherwise press enter to exit and set AL_DIR in net.conf. For example. \
         \n AL_DIR=$HOME/Projects/apprentice_learner_api \n AL_DIR: ")
    else:
        al_dir = sys.argv[i+1]

    with open("src/defaults.conf", 'r') as f:
        content = f.read()

    if(al_dir != ""):
        content = re.sub(r"AL_DIR=[^\n\r]*", "AL_DIR=" + al_dir,content)

    with open("net.conf", 'w') as f:
        content = f.write(content)

    if(al_dir == ""): sys.exit()


if __name__ == "__main__":
    calling_dir = os.getcwd()

    #Always run this script from the directory where it lives
    abspath = os.path.abspath(__file__)
    dname = os.path.dirname(abspath)
    os.chdir(dname)

    if(not os.path.isfile("net.conf")):
        setup_net_conf()

    atexit.register(kill_all);
    args = parse_args(sys.argv[1:])
    # print(args, type(args))
    main(args)
