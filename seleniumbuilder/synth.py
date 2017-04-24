import uuid
import time
import socket
import os
import sys
from user_agents import parse
from datetime import datetime, timedelta, date

class Synth():

    def __init__(self, driver, name):
        ua = driver.execute_script("return navigator.userAgent")
        user_agent = parse(ua)
        self.execution_id=uuid.uuid1()
        self.script=os.path.basename(sys.argv[0])
        self.browser_version=user_agent.browser.version_string
        self.browser=user_agent.browser.family
        self.os=user_agent.os.family
        self.os_version=user_agent.os.version_string
        self.app_name=name
        self.ip=socket.gethostbyname(socket.gethostname())
        self.tx_count=0
        self.transaction_list={}
        self.tx_queue=[]
        
    def StartTX(self, driver, tx_name):
        self.tx_count=self.tx_count+1
        current_time_epoch = time.time()
        self.transaction_list[tx_name, 'start']=current_time_epoch
        self.tx_queue.append(tx_name)
        current_time = str(time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime(current_time_epoch)))
        print('[{0}] "event_type":"tx_start", "tx_name":"{1}", "start_time":"{2}", "execution_id":"{3}", "browser":"{4}", "browser_version":"{5}", "os":"{6}", "os_version":"{7}", "ip":"{8}", "app_name":"{9}", "title":"{10}"'.format(current_time_epoch, tx_name, current_time, str(self.execution_id), self.browser, self.browser_version, self.os, self.os_version, str(self.ip), self.app_name, driver.title, self.transaction_list[tx_name, 'status'], reason))

    def EndTX(self, driver, tx_name):
        current_time_epoch = time.time()
        self.transaction_list[tx_name, 'end']=current_time_epoch
        current_time = str(time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime(current_time_epoch)))
        self.transaction_list[tx_name, 'duration'] = self.transaction_list[tx_name, 'end'] - self.transaction_list[tx_name, 'start']
        self.transaction_list[tx_name, 'status']="Success"
        self.tx_queue.remove(tx_name)
        print('[{0}] "event_type":"tx_end", "tx_name":"{1}", "duration":"{2}", "execution_id":"{3}", "browser":"{4}", "browser_version":"{5}", "os":"{6}", "os_version":"{7}", "ip":"{8}", "app_name":"{9}", "title":"{10}", "status":"{11}"'.format(current_time_epoch, tx_name, str(self.transaction_list[tx_name, 'duration']), str(self.execution_id), self.browser, self.browser_version, self.os, self.os_version, str(self.ip), self.app_name, driver.title, self.transaction_list[tx_name, 'status']))

    def FailTX(self, driver, tx_name, reason):
        current_time_epoch = time.time()
        self.transaction_list[tx_name, 'end']=current_time_epoch
        current_time = str(time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime(current_time_epoch)))
        self.transaction_list[tx_name, 'duration'] = self.transaction_list[tx_name, 'end'] - self.transaction_list[tx_name, 'start']
        self.transaction_list[tx_name, 'status']="Failed"
        print('[{0}] "event_type":"tx_fail", "tx_name":"{1}", "duration":"{2}", "execution_id":"{3}", "browser":"{4}", "browser_version":"{5}", "os":"{6}", "os_version":"{7}", "ip":"{8}", "app_name":"{9}", "title":"{10}", "status":"{11}", "reason":"{12}"'.format(current_time_epoch, tx_name, str(self.transaction_list[tx_name, 'duration']), str(self.execution_id), self.browser, self.browser_version, self.os, self.os_version, str(self.ip), self.app_name, driver.title, self.transaction_list[tx_name, 'status'], reason))

    def Log(self, driver, tx_name, log_type, message):
        current_time_epoch = time.time()
        if tx_name == null:
            tx_name = self.tx_queue[-1]
        print('[{0}] "event_type":"{2}", "tx_name":"{1}", "execution_id":"{3}", "browser":"{4}", "browser_version":"{5}", "os":"{6}", "os_version":"{7}", "ip":"{8}", "app_name":"{9}", "title":"{10}", "status":"{11}", "reason":"{12}"'.format(current_time_epoch, tx_name, log_type, str(self.execution_id), self.browser, self.browser_version, self.os, self.os_version, str(self.ip), self.app_name, driver.title, self.transaction_list[tx_name, 'status'], message))
