import argparse,sys,os, atexit,re 
import socket,subprocess
import http.client
from urllib.parse import quote
from time import sleep
import unittest
# import requests_async as requests
# import requests
import grequests
import requests
from gevent.pool import Pool
import threading

envelope = '<?xml version="1.0" encoding="UTF-8"?>' + \
'<log_action auth_token="" session_id="ctat_session_73c47bf7-edfb-05f4-8851-ba71280e3d4f" action_id="EVALUATE_QUESTION" user_guid="calvin" date_time="2015/09/09 15:41:01.632" timezone="undefined" source_id="tutor" external_object_id="" info_type="tutor_message.dtd">' +\
'%s' + \
'</log_action>'

context_message = '<?xml version="1.0" encoding="UTF-8"?>' + \
'<tutor_related_message_sequence version_number="4">' + \
  '<context_message context_message_id="0CEF2E07-24DE-BFDA-9BAB-957C3AE236CE" name="START_PROBLEM">' + \
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


tutor_message = '<?xml version="1.0" encoding="UTF-8"?>' + \
'<log_action auth_token="bleh" session_id="ctat_session_73c47bf7-edfb-05f4-8851-ba71280e3d4f" action_id="EVALUATE_QUESTION" user_guid="calvin" date_time="2015/09/09 15:41:01.632" timezone="America/New_York" source_id="CTATTutor" external_object_id="" info_type="tutor_message.dtd">' + \
  '<tutor_related_message_sequence version_number="4">' + \
    '<tutor_message context_message_id="9fb401fb-a7ca-5557-a38b-5f344d56d925">' + \
      '<semantic_event transaction_id="%s" name="RESULT"/>' + \
      '<event_descriptor>' + \
        '<selection>textinput1</selection>' + \
        '<action>UpdateTextField</action>' + \
        '<input>' + \
          '<![CDATA[%s]]>' + \
        '</input>' + \
      '</event_descriptor>' + \
      '<action_evaluation>CORRECT</action_evaluation>' + \
      '<tutor_advice>' + \
        '<![CDATA[You got it!]]>' + \
      '</tutor_advice>' + \
    '</tutor_message>' + \
  '</tutor_related_message_sequence>' + \
'</log_action>' 

print(context_message)
print(tutor_message)

def get_open_port():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(("",0))
    s.listen(1)
    port = s.getsockname()[1]
    s.close()
    return port

def nothing(x):
    print("REPONSE")

def log_test(self,sleep_interval):
    port = get_open_port()

    URL = 'http://127.0.0.1:%s' % port
    log_path = "log/test_log-%.4f.txt" % sleep_interval

    if os.path.exists(log_path):
        os.remove(log_path)

    ctat_process = subprocess.Popen([sys.executable, os.path.join("../src", "host_server.py") , str(port), log_path],stdout=subprocess.PIPE)
    while True:
        line = ctat_process.stdout.readline()
        if("HOST SERVER STARTED" in str(line)):
            break
    
    session_id = 0 
    
    for i in range(100):
        print(i)
        if(i % 10 == 0):
            data = context_message
            session_id = i
        else:
            data = tutor_message % (session_id,i)
        data = envelope % (quote(data)) 

        def go():
            r = requests.post(URL,data=data)

        thread = threading.Thread(target=go)
        thread.start()

        sleep(sleep_interval)
    

    count = 0

    with open(log_path,'r') as f:
        headers = next(f).split("\t")
        problem_name_index = headers.index("Problem Name")
        level_domain_index = headers.index("Level (Domain)")
        print(headers,problem_name_index,level_domain_index)
        for j,line in enumerate(f):
            print("line: ",line)
            split = line.split("\t")
            self.assertNotEqual(split[problem_name_index],"","Problem Name is empty in row %s of %s" % (j,log_path))
            self.assertNotEqual(split[level_domain_index],"","Level (Domain) is empty in row %s of %s" % (j,log_path))
            count += 1
    self.assertEqual(count,90, "%s has %s rows, should have 90" %(log_path, count))
    ctat_process.kill()
bloop = []
class TestMethods(unittest.TestCase):

    def test_logging_general(self):
        log_test(self,0.05)
    def test_logging_fast(self):
        log_test(self,0.0005)
    def test_logging_async(self):
        log_test(self,0.0)
        

if __name__ == '__main__':
    unittest.main()

# while True:
#     if(ctat_process.poll() != None):
#         break
#     # try:
#     sleep(.1)