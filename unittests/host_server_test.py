import argparse,sys,os, atexit,re 
import requests, socket,subprocess
import http.client
from urllib.parse import quote
from time import sleep
import unittest

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

class TestMethods(unittest.TestCase):

    def test_logging(self):
        port = get_open_port()

        URL = 'http://localhost:%s' % port

        # print(URL)

        ctat_process = subprocess.Popen([sys.executable, os.path.join("../src", "host_server.py") , str(port), "log/test_log.txt"])
        sleep(1)
        session_id = 0 
        for i in range(1000):
            # print(i)
            if(i % 10 == 0):
                data = context_message
                session_id = i
            else:
                data = tutor_message % (session_id,i)
            data = envelope % (quote(data)) 
            r = requests.post(URL,data=data)
        # sending post request and saving response as response object 
            # print(data)
          # headers = headers = {"Content-type": "text/html; charset=utf-8",
          #                      "Accept": "text/plain"}
          # conn = http.client.HTTPSConnection('http://localhost', port)
          # conn.request('PRINT', '/', data,headers)
          # conn.endheaders() # <---
          # r = conn.getresponse()
            
          # extracting response text  
            pastebin_url = r.text 
            # print(i,"The pastebin URL is:%s"%pastebin_url) 
            # sleep(.01)
        for i in range(1,6):
            print(i)
            sleep(.1)

        count = 0
        with open("log/test_log.txt",'r') as f:
            headers = next(f).split("\t")
            problem_name_index = headers.index("Problem Name")
            level_domain_index = headers.index("Level (Domain)")
            for line in f:
                split = line.split("\t")
                self.assertNotEqual(split[problem_name_index],"")
                self.assertNotEqual(split[level_domain_index],"")
                count += 1
        self.assertEqual(count,900)

if __name__ == '__main__':
    unittest.main()

# while True:
#     if(ctat_process.poll() != None):
#         break
#     # try:
#     sleep(.1)