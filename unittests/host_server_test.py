import argparse,sys,os, atexit,re 
import socket,subprocess
import http.client
from urllib.parse import quote

import unittest
# import requests_async as requests
# import requests
import grequests
import requests
from gevent.pool import Pool
import threading
from datetime import datetime
from datetime import timezone
from time import sleep
import time


from gevent import monkey
monkey.patch_all()

envelope = '<?xml version="1.0" encoding="UTF-8"?>' + \
'<log_action auth_token="" session_id="0" action_id="EVALUATE_QUESTION" user_guid="calvin" date_time="whatever" timezone="undefined" source_id="tutor" external_object_id="" info_type="tutor_message.dtd">' +\
'%s' + \
'</log_action>'

session_start_message = '<?xml version="1.0" ?>' + \
'<log_session_start assignment_id="" auth_token="none" class_id="" \
 date_time="2019/09/25 21:25:15.377" info_type="tutor_message.dtd" \
 session_id="0" timezone="America/New_York" treatment_id="" user_guid="1481"/>'


context_message = '<?xml version="1.0" encoding="UTF-8"?>' + \
'<tutor_related_message_sequence version_number="4">' + \
  '<context_message context_message_id="%s" name="START_PROBLEM">' + \
    '<dataset>' + \
      '<name>Stoichiometry Study 1 - Spring 2005</name>' + \
      '<level type="Domain">' + \
        '<name>A</name>' + \
        '<level type="Section">'+ \
          '<name>One</name>' + \
          '<problem>' + \
            '<name>ChemPT1</name>' + \
            '<context>Chemistry Problem One</context>' + \
          '</problem>' + \
        '</level>' + \
      '</level>' + \
    '</dataset>' + \
  '</context_message>' + \
'</tutor_related_message_sequence>'

event_descriptor = '<event_descriptor>' + \
        '<selection>textinput1</selection>' + \
        '<action>UpdateTextField</action>' + \
        '<input>' + \
          '<![CDATA[%s]]>' + \
        '</input>' + \
      '</event_descriptor>'

tool_message = '<?xml version="1.0" encoding="UTF-8"?>' + \
'<log_action auth_token="bleh" session_id="0" action_id="EVALUATE_QUESTION" user_guid="calvin" date_time="2015/09/09 15:41:01.632" timezone="America/New_York" source_id="CTATTutor" external_object_id="" info_type="tutor_message.dtd">' + \
'<tutor_related_message_sequence version_number="4">' + \
  '<tool_message context_message_id="%s">' + \
    '<semantic_event name="ATTEMPT" transaction_id="%s"/>' + \
    event_descriptor + \
    '<custom_field>' + \
      '<name>tool_event_time</name>' + \
      '<value>%s</value>' + \
    '</custom_field>' + \
  '</tool_message>' + \
'</tutor_related_message_sequence>' + \
'</log_action>' 



tutor_message = '<?xml version="1.0" encoding="UTF-8"?>' + \
'<log_action auth_token="bleh" session_id="0" action_id="EVALUATE_QUESTION" user_guid="calvin" date_time="2015/09/09 15:41:01.632" timezone="America/New_York" source_id="CTATTutor" external_object_id="" info_type="tutor_message.dtd">' + \
  '<tutor_related_message_sequence version_number="4">' + \
    '<tutor_message context_message_id="%s">' + \
      '<semantic_event transaction_id="%s" name="RESULT"/>' + \
      event_descriptor + \
      '<action_evaluation>CORRECT</action_evaluation>' + \
      '<tutor_advice>' + \
        '<![CDATA[You got it!]]>' + \
      '</tutor_advice>' + \
      '<custom_field>' + \
        '<name>tutor_event_time</name>' + \
        '<value>%s</value>' + \
      '</custom_field>' + \
    '</tutor_message>' + \
  '</tutor_related_message_sequence>' + \
'</log_action>' 

done_descriptor = '<event_descriptor>' + \
        '<selection>done</selection>' + \
        '<action>ButtonPressed</action>' + \
        '<input>' + \
          '<![CDATA[%s]]>' + \
        '</input>' + \
      '</event_descriptor>'

tool_done = '<?xml version="1.0" encoding="UTF-8"?>' + \
'<log_action auth_token="bleh" session_id="0" action_id="EVALUATE_QUESTION" user_guid="calvin" date_time="2015/09/09 15:41:01.632" timezone="America/New_York" source_id="CTATTutor" external_object_id="" info_type="tutor_message.dtd">' + \
'<tutor_related_message_sequence version_number="4">' + \
  '<tool_message context_message_id="%s">' + \
    '<semantic_event name="ATTEMPT" transaction_id="%s"/>' + \
    done_descriptor + \
    '<custom_field>' + \
      '<name>tool_event_time</name>' + \
      '<value>%s</value>' + \
    '</custom_field>' + \
  '</tool_message>' + \
'</tutor_related_message_sequence>' + \
'</log_action>' 



tutor_done = '<?xml version="1.0" encoding="UTF-8"?>' + \
'<log_action auth_token="bleh" session_id="0" action_id="EVALUATE_QUESTION" user_guid="calvin" date_time="2015/09/09 15:41:01.632" timezone="America/New_York" source_id="CTATTutor" external_object_id="" info_type="tutor_message.dtd">' + \
  '<tutor_related_message_sequence version_number="4">' + \
    '<tutor_message context_message_id="%s">' + \
      '<semantic_event transaction_id="%s" name="RESULT"/>' + \
      done_descriptor + \
      '<action_evaluation>CORRECT</action_evaluation>' + \
      '<tutor_advice>' + \
        '<![CDATA[You got it!]]>' + \
      '</tutor_advice>' + \
      '<custom_field>' + \
        '<name>tutor_event_time</name>' + \
        '<value>%s</value>' + \
      '</custom_field>' + \
    '</tutor_message>' + \
  '</tutor_related_message_sequence>' + \
'</log_action>' 

# print(context_message)
print(tool_message)
print(tutor_message)

MAX_SOCKETS = 10
socket_semaphore = threading.Semaphore(MAX_SOCKETS)

def get_open_port():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(("",0))
    s.listen(1)
    port = s.getsockname()[1]
    s.close()
    return port

def nothing(x):
    print("REPONSE")

all_threads = []

def post_data(URL,data):
    def go():
        # global socket_semaphore
        socket_semaphore.acquire()
        # print("acquire")
        # print(URL)
        r = requests.post(URL,data=data,timeout=.5)
        # print("RETURN",r.text)
        socket_semaphore.release()
        # print("release")

    thread = threading.Thread(target=go)
    thread.start()
    all_threads.append(thread)
    # return thread

def get_time_str():
  now = datetime.now(timezone.utc)
  return now.strftime("%Y-%m-%d %H:%M:%S.%f %Z")
  

def log_test(self,sleep_interval):
    port = get_open_port()

    URL = 'http://127.0.0.1:%s' % port
    log_path = "log/test_log-%.4f.txt" % sleep_interval

    if os.path.exists(log_path):
        os.remove(log_path)

    print(sys.executable)
    print(" ".join([sys.executable, os.path.join("../src", "host_server.py") , str(port), log_path]))
    with open('log/term_out.txt', "w") as outfile:
      # host_process = subprocess.Popen([sys.executable, os.path.join("../src", "host_server.py") , str(port), log_path],stdout=sys.stdout)#stdout=subprocess.PIPE)#
      host_process = subprocess.Popen([sys.executable, os.path.join("../src", "host_server.py") , str(port), log_path],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    # sleep(3)
    while True:
        line = host_process.stdout.readline()
        if("HOST SERVER STARTED" in str(line)):
            break
    
    session_id = 0 
    
    for i in range(10):
      post_data(URL,session_start_message)

      # ts = get_time_str()
      ts = get_time_str()
      data = context_message % i
      data = envelope % (quote(data)) 
      post_data(URL,data)

      for j in range(10):
        n_dots = ((i*10+j)%4)
        print(("%d,%d"%(i,j)) + "."*n_dots+ " "*(3-n_dots)+ "\r",end="",flush=True)
        if(j < 9):
          data = tool_message % (i,j,j,ts)
          ts = get_time_str()
          data = envelope % (quote(data)) 
          post_data(URL,data)

          data = tutor_message % (i,j,j,ts)
          ts = get_time_str()
          data = envelope % (quote(data)) 
          post_data(URL,data)
        else:
          # print("send DONE")
          data = tool_done % (i,j,j,ts)
          ts = get_time_str()
          data = envelope % (quote(data)) 
          post_data(URL,data)
          # print(data)

          data = tutor_done % (i,j,j,ts)
          ts = get_time_str()
          data = envelope % (quote(data)) 
          post_data(URL,data)

        

        sleep(sleep_interval)
    

    count = 0

    for x in all_threads:
      x.join()
    
    sleep(2)
    
    host_process.terminate()
    
    # sleep(2)

    with open(log_path,'r') as f:
        headers = next(f).split("\t")
        problem_name_index = headers.index("Problem Name")
        level_domain_index = headers.index("Level (Domain)")
        outcome_index = headers.index("Outcome")
        # print(headers,problem_name_index,level_domain_index)
        for j,line in enumerate(f):
            print("line: ",line)
            split = line.split("\t")
            self.assertNotEqual(split[problem_name_index],"","Problem Name is empty in row %s of %s" % (j,log_path))
            self.assertNotEqual(split[level_domain_index],"","Level (Domain) is empty in row %s of %s" % (j,log_path))
            self.assertNotEqual(split[outcome_index],"","Outcome is empty in row %s of %s" % (j,log_path))
            count += 1
    self.assertEqual(count,100, "%s has %s rows, should have 100" %(log_path, count))

    # while True:
    #     print(host_process.stdout.readline())

    
bloop = []
class TestMethods(unittest.TestCase):

    def test_logging_general(self):
        log_test(self,0.05)
    def test_logging_fast(self):
        log_test(self,0.0001)
    def test_logging_async(self):
        log_test(self,0.0)
        

if __name__ == '__main__':
    unittest.main()

# while True:
#     if(host_process.poll() != None):
#         break
#     # try:
#     sleep(.1)