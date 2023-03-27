import sys, os
print("Python version: %s" %sys.executable)
print (sys.version)

from importlib.util import find_spec
import argparse
import atexit
import re
import subprocess
import threading
from subprocess import check_output
import socket
import errno
import signal
import time
from datetime import datetime

al_process = None
tutor_process = None
browser_process = None
outerloop_process = None
# al_thread = None
# ctat_thread = Nones
calling_dir = None
CONFIG_DEFAULT = "altrain.conf"
HOST_DOMAIN = '127.0.0.1'  # Use this instead of localhost on windows

# Allows the host server to fetch above its working directory using
#  special "!u" in place of "..". This this environment variable is
#  only safe to set when running locally. On a production server allowing
#  this to remain true is major security hole.
AL_HOST_FETCH_ABOVE_ROOT = True


def find_conf(cwd):
    split_path = os.path.normpath(cwd).split(os.sep)
    home = os.path.normpath(os.path.expanduser("~"))

    for i in range(len(split_path) - 1, 1, -1):
        p = os.path.join(*(split_path[0:i]))
        f = os.path.join(p, CONFIG_DEFAULT)
        if(p == home):
            break
        if(os.path.isfile(f)):
            return f

    f = os.path.join(home, CONFIG_DEFAULT)
    if(os.path.isfile(f)):
        return f

    return None


def read_conf(ns, path):
    # args = {}

    with open(path, 'r') as f:
        for line in f:
            x = line.split("=")
            if(len(x) > 1 and getattr(ns, x[0], None) == None):
                key = x[0].lower()
                val = x[1].strip('\"\'\n \t\f\r')
                if(val == ""):
                    continue
                if("port" in key):
                    try:
                        val = int(val)
                    except ValueError as e:
                        if(val.strip() != ""):
                            print("Invalid port %s for %s." %
                                  (val, key), file=sys.stderr)
                            sys.exit()
                elif("args" in key):
                    # turn into a list of args
                    val = list(filter(None, re.split(';|,| |\t|\n', val)))

                setattr(ns, key, val)  # Strip quotes and whitespace
    return ns


def force_kill_port(port):
    print("Attempting force kill...")
    tokill = []
    if("linux" in sys.platform):
        try:
            tokill = [int(x) for x in check_output(
                ["lsof", "-Pi", ":" + str(port), "-sTCP:LISTEN", "-t"]).splitlines()]
            print("Found processes: %s bound to %s" % (tokill, port))
        except Exception as e:
            # At this point nothing popped up so we're good
            return True
    else:
        raise Warning(
            "Force kill (-f/--force) not implemented for operating system %r" % sys.platform)
        return False
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
    raise socket.error(
        "Failed to start %s at port %s. Port already in use." % (nm, port))
    sys.exit()


def waitAndExit(proc, onExit):

    proc.wait()
    onExit()


def kill_group(p):
    if(isinstance(p, int)):
        pgid = os.getpgid(p)
    else:
        pgid = os.getpgid(p.pid)
    print("PGID", pgid)
    os.killpg(pgid, signal.SIGTERM)


def kill_all():
    global al_process, tutor_process, browser_process
    # al_process.stderr = None
    # tutor_process.stderr = None
    # al_process.stdout = None
    # tutor_process.stdout = None
    # al_process.stderr.close()
    # tutor_process.stderr.close()
    # temp_stderr = sys.stderr
    # sys.stderr = None
    # sys.stdout = None
    # if(hasattr(os, "killpg")):
    #     os.killpg(os.getpgid(), signal.SIGTERM)
    # else:
    if(al_process != None):
        al_process.terminate()
    if(tutor_process != None):
        tutor_process.terminate()
    if(browser_process != None):
        browser_process.terminate()
    if(outerloop_process != None):
        outerloop_process.terminate()
    # sys.stderr = temp_stderr
    # if(al_process != None): kill_group(al_process)
    # if(tutor_process != None): kill_group(tutor_process)


def apply_wd(path):
    path = os.path.expandvars(path)
    if(not os.path.isabs(path)):
        path = os.path.join(calling_dir, path)
    return path


def get_open_port():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(("", 0))
    s.listen(1)
    port = s.getsockname()[1]
    s.close()
    return port


def dir_from_package(package_name):
    try:
        spec = find_spec(package_name)
        if(spec is None): return None
        p = os.path.dirname(spec.origin)
        # p = importlib.import_module(package_name)
        return p  # os.path.abspath(os.path.join(apprentice.__path__[0],".."))
    except ImportError:
        return None

# def server_dir_from_package():
#     try:
#         importlib.util.find_spec('AL_host_server')
#         import AL_host_server
#         return os.path.abspath(os.path.join(AL_host_server.__path__[0],".."))
#     except ImportError:
#         return None

def clear_cache():
    from numbert.caching import cache_dir
    import shutil
    shutil.rmtree(os.path.abspath(os.path.join(cache_dir,"../")))
    import numba.typed
    shutil.rmtree(os.path.join(os.path.dirname(numba.typed.__file__), "__pycache__"))
    import numbert.caching
    shutil.rmtree(os.path.join(os.path.dirname(numbert.caching.__file__), "__pycache__"))
    # shutil.rmtree(os.path.abspath(os.path.join(cache_dir,"../../ipython/numba_cache")))
    print("Cache Cleared!")


def handle_special(args):
    if(args.training == "clear-cache"):
        clear_cache()

    sys.exit()





def parse_args(argv):
    parser = argparse.ArgumentParser(
        description='Convert ROOT data to numpy arrays stored as HDF5 for Machine Learning use.')
    parser.add_argument('training', type=str, metavar="<training_file>.json",
                        help="A JSON file that specifies the sequence of problems to train on.")
    parser.add_argument('-f', '--force', action='store_true', default=False, dest="force",
                        help="Force kill processes that hold up ports we want to use. Only implemented for Linux systems.")
    parser.add_argument('-i', '--interactive', action='store_true', default=False, dest="interactive",
                        help="Indicates that AL should trained interactively by the user instead of automatically by example/model tracing.")
    parser.add_argument('--foci', action='store_true', default=False, dest="use_foci",
                        help="Indicates that AL should trained interactively by the user instead of automatically by example/model tracing.")

    parser.add_argument('-a', '--al-port', default=None, dest="al_port",     metavar="<AL_port>",
                        type=int, help="The port for the apprentice learner server.")
    parser.add_argument('-c', '--ctat-port', default=None, dest="ctat_port",   metavar="<CTAT_port>",
                        type=int, help="The port where the ctat interface and logging server bind to.")

    parser.add_argument('--al-host', default=HOST_DOMAIN, dest="al_host",     metavar="<AL_host>",
                        help="The host url for the apprentice learner server. Default=localhost.")
    parser.add_argument('--ctat-host', default=HOST_DOMAIN, dest="ctat_host",     metavar="<CTAT_host>",
                        help="The host url for the apprentice learner server. Default=localhost.")

    parser.add_argument('-d', '--al-dir',  default=None, dest="al_dir",      metavar="<AL_dir>",
                        help="The directory where the apprentice learner API can be found.")
    parser.add_argument('--no-al-server', action='store_true',
                        dest="no_al_server", help="Do not start an AL server.")

    parser.add_argument('-b', '--broswer', default=None, dest="browser",     metavar="<browser>",
                        help="The browser executable to run CTAT on.")
    parser.add_argument('--broswer-args', default='', dest="browser_args",     metavar="<browser_args>",
                        help="Shell arguements to pass to the browser."
                        )

    parser.add_argument('-t', '--tutor', default=None, dest="tutor",     metavar="<tutor>",
                        help="The type of tutor (e.g. 'ctat' or 'stylus')")

    parser.add_argument('-l', '--log-dir', default='log', dest="log_dir",     metavar="<log_dir>",
                        help="The directory where tab deliminated logging files are written. Overridden by -o/--output.")
    parser.add_argument('-o', '--output',  default=None, dest="output",      metavar="<output>",
                        help="The tab deliminated logging file for the session should go to. By default will be generated with a timestamp in the /log directory")

    parser.add_argument('--config',  default=None, dest="config",      metavar="<config>.conf",
                        help="Bash style configuration file used for setting default variables. ")
    parser.add_argument('-w', "--working-directory",  default=None, dest="wd",      metavar="<working-directory>",
                        help="The working directory of the ctat server. By default it is the directory where training.json is located")
    parser.add_argument('-n', "--nools",  default=None, dest="nools_dir",      metavar="<nools-out-dir>",
                        help="The directory to output the nools production rule code for the agent")

    parser.add_argument('--outer-loop', action='store_true', default=False, dest="outerloop",
                        help="Specifies that an external outer loop server will be used.")
    parser.add_argument('--outer-loop-host', default=HOST_DOMAIN, dest="outerloop_host",     metavar="<outerloop_host>",
                        help="The host url for the outer loop server. Default=localhost.")
    parser.add_argument('--outer-loop-port', default=None, dest="outerloop_port",      metavar="<outerloop_port>",
                        help="Specifies the port to bind to for running the outer loop server.")
    parser.add_argument('--outer-loop-dir', default=None, dest="outerloop_dir",      metavar="<outerloop_dir>",
                        help="Specifies the directory of the outer loop repo.")
    parser.add_argument('--outer-loop-url', default=None, dest="outerloop_url",      metavar="<outerloop_url>",
                        help="Specifies the URL of a running outer loop server.")

    try:
        args = parser.parse_args(argv)
        # args.setattr(args, "training", args.training[0]) # dunno why it comes
        # in a list

    except Exception:
        parser.print_usage()
        sys.exit()

    # print("TRAINING bef",args.training)

    if args.training in ["clear-cache"]:
        handle_special(args)
    else:
        training_abs = os.path.abspath(os.path.join(calling_dir, args.training))
    # args.training = os.path.abspath(os.path.join(calling_dir,args.training))
    # print("TRAINING af",args.training)
    # print("TRAINING app",apply_wd(args.training))
    # print("CWD",os.getcwd())

    if(args.config is None or not os.path.isfile(args.config)):
        args.config = find_conf(os.path.dirname(training_abs))
        print(args.config)

    if(args.config is not None):
        read_conf(args, args.config)

    if(args.al_dir == None):
        args.al_dir = dir_from_package("apprentice")
        if(args.al_dir == None):
            raise Exception(
                "Cannot find AL_CORE. Try 'pip install apprentice'.")

    print(args.browser_args)
    if(isinstance(args.browser_args, str)):
        args.browser_args = [args.browser_args]

    # args.browser_args = list(filter(None,re.split(';|,| |\t|\n', args.browser_args)))
    # print(args.browser_args)

    args.log_dir = os.path.abspath(apply_wd(args.log_dir))
    args.al_dir = os.path.abspath(apply_wd(args.al_dir))
    args.html_bridge_dir = dir_from_package("al_hostserver")
    # os.path.join(calling_dir,args.al_dir)

    assert os.path.isfile(training_abs), "No such file %r" % training_abs
    # assert args.al_port != None, "AL_PORT not specified or set in %s" % args.config
    # assert args.ctat_port != None, "CTAT_PORT not specified or set in %s" % args.config
    assert args.al_dir != None, "AL_DIR not specified or set in %s" % args.config
    # assert args.browser != None, "BROWSER not specified or set in %s" % args.config
    assert args.log_dir != None, "LOG_DIR not specified or set in %s" % args.config

    if(args.output is None):
        args.output = "%s/%sLog-%s.txt" % (args.log_dir, os.path.basename(
            args.training).split(".")[0], datetime.now().strftime("%Y-%m-%d-%H_%M_%S"))

    if(args.outerloop_dir is None):
        args.outerloop_dir = dir_from_package("al_outerloop")
        if(args.outerloop_dir is None and args.outerloop_dir is not None):
            args.outerloop_dir = os.path.abspath(apply_wd(args.outerloop_dir))

    args.output = os.path.abspath(apply_wd(args.output))

    return args

# RUN = True

# def stop(sig, frame):
#     print("SIGNAL CAUGHT", sig,al_process,tutor_process)
#     RUN =False
#     kill_all()

# signal.signal(signal.SIGTERM, stop )
# signal.signal(signal.SIGINT, stop)


def main(args):
    global al_process, tutor_process, browser_process, outerloop_process, calling_dir

    if args.no_al_server:
        assert args.al_port is not None, "Must specify AL_PORT in altrain.conf or command line"
    else:
        if(not args.al_port):
            args.al_port = get_open_port()
        if(check_port(args.al_host, args.al_port, args.force)):
            al_process = subprocess.Popen([sys.executable, os.path.join(
                args.al_dir, "..", "django", "manage.py"), "runserver", str(args.al_host) + ":" + str(args.al_port)])
            # al_thread = threading.Thread(target=waitAndExit, args=(al_process, kill_all))
            # al_thread.start()
        else:
            port_error("AL", args.al_port)

    if(not args.ctat_port):
        args.ctat_port = get_open_port()
    if(check_port(args.ctat_host, args.ctat_port, args.force)):
        _env = os.environ.copy()
        _env["AL_HOST_FETCH_ABOVE_ROOT"] = str(AL_HOST_FETCH_ABOVE_ROOT)
        tutor_process = subprocess.Popen([
            sys.executable, os.path.join(args.html_bridge_dir, "host_server.py"),
            str(args.ctat_port), args.output], env=_env)
        # ctat_thread = threading.Thread(target=waitAndExit, args=(tutor_process, kill_all))
        # ctat_thread.start()

    else:
        port_error("CTAT", args.ctat_port)

    if(args.outerloop_url is None and args.outerloop):
        assert args.outerloop_dir is not None, "Install AL_outerloop or specify outerloop_DIR in altrain.conf"
        if(not args.outerloop_port):
            args.outerloop_port = get_open_port()
        if(check_port(args.outerloop_host, args.outerloop_port, args.force)):
            # print([sys.executable, os.path.join(args.outerloop_dir, "src", "server.py") , "--host", str(args.outerloop_host),"--port", int(args.outerloop_port)])
            outerloop_process = subprocess.Popen([sys.executable, os.path.join(
                args.outerloop_dir, "server.py"), "--host", str(args.outerloop_host), "--port", str(args.outerloop_port)])
            args.outerloop_url = args.outerloop_host + \
                ":" + str(args.outerloop_port)
        else:
            port_error("OUTER LOOP", args.outerloop_port)
    if(args.outerloop_url is not None and
       not (args.outerloop_url.startswith("http://") or
            args.outerloop_url.startswith("https://"))):
        args.outerloop_url = "http://" + args.outerloop_url

    ctat_url = "http://%s:%s/?training=/%s&agent_url=http://%s:%s" % \
        (HOST_DOMAIN, args.ctat_port, args.training, HOST_DOMAIN, args.al_port)
    if(args.wd != None):
        ctat_url += "&wd=" + args.wd
    if(args.interactive):
        ctat_url += "&interactive=true"
    if(args.use_foci):
        ctat_url += "&use_foci=true"
    if(args.nools_dir):
        ctat_url += "&nools_dir=%s" % args.nools_dir
    if(args.tutor):
        ctat_url += "&tutor=%s" % args.tutor
    if(args.outerloop_url):
        ctat_url += "&outerloop_url=%s" % args.outerloop_url

    if(args.browser != None and "selenium" in args.browser):
        from selenium import webdriver
        if("chrome" in args.browser):
            options = webdriver.ChromeOptions()
            options.add_argument('--ignore-certificate-errors')
            options.add_argument("--test-type")
            for x in args.browser_args:
                if(x):
                    options.add_argument(x)
            driver = webdriver.Chrome(chrome_options=options)
            driver.get(ctat_url)
        elif("firefox" in args.browser):

            #             geckodriver = 'C:\\Users\\grayson\\Downloads\\geckodriver.exe'

            # browser =
            options = webdriver.FirefoxOptions()
            # options.add_argument('--ignore-certificate-errors')
            # options.add_argument("--test-type")
            for x in args.browser_args:
                if(x):
                    options.add_argument(x)
            driver = webdriver.Firefox(firefox_options=options)
            driver.get(ctat_url)
        else:
            raise ValueError("Browser %r not supported" % args.browser)
    elif(args.browser != None):
        browser_process = subprocess.Popen(
            [args.browser, ctat_url] + args.browser_args)
    else:
        # use defualt browser
        import webbrowser
        webbrowser.get().open(ctat_url)

    # al_process.wait()
    # print("AL PROCESS")
    while True:
        if((not args.no_al_server and al_process.poll() != None) or tutor_process.poll() != None):
            break
        time.sleep(.5)

    kill_all()
    sys.exit()


def setup_net_conf():
    i = sys.argv.index("--al-dir") if "--al-dir" in sys.argv else None
    if(i == None):
        i = sys.argv.index("-d") if "-d" in sys.argv else None
    if(i == None):
        al_dir = dir_from_package("apprentice")
        if(al_dir == None):
            al_dir = input("Enter the directory where you cloned the apprentice_learner_api \
             otherwise press enter to exit and set AL_DIR in net.conf. For example. \
             \n AL_DIR=$HOME/Projects/apprentice_learner_api \n AL_DIR: ")
    else:
        al_dir = sys.argv[i + 1]

    with open("src/defaults.conf", 'r') as f:
        content = f.read()

    if(al_dir != ""):
        content = re.sub(r"AL_DIR=[^\n\r]*", "AL_DIR=" + al_dir, content)

    with open("net.conf", 'w') as f:
        content = f.write(content)

    if(al_dir == ""):
        sys.exit()


def pre_main():
    global calling_dir

    calling_dir = os.getcwd()
    print("Calling from directory:", calling_dir)

    html_bridge_dir = dir_from_package("al_hostserver")
    # print("b", html_bridge_dir)
    # Always run this script from the directory where it lives
    # abspath = os.path.abspath(html_bridge_dir)
    # dname = os.path.dirname(abspath)
    # os.chdir(dname)
    # print("CWD", os.getcwd())

    # if(not os.path.isfile("net.conf")):
    #     setup_net_conf()

    atexit.register(kill_all)
    args = parse_args(sys.argv[1:])
    # print(args, type(args))
    main(args)

if __name__ == "__main__":
    pre_main()
