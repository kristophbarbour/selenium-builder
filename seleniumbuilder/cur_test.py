# -*- coding: utf-8 -*-
import sys
import os
import traceback
from selenium import webdriver
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
import time
from synth import Synth

success = True
wd = webdriver.Firefox()
wd.implicitly_wait(60)

monitor = Synth(wd, os.path.basename(sys.argv[0]).replace(' ', '_'))

def is_alert_present(wd):
    try:
        wd.switch_to_alert().text
        return True
    except:
        return False

try:
    monitor.StartTx("test")
    wd.get("http://www.sebuilder.com/")
    print wd.execute_script(performance.timing)
    monitor.StopTx("test")
except:
    monitor.FailTx('null', 'ERROR', traceback.format_exc(3))
finally:
    wd.quit()
    if not success:
        raise Exception("Test failed.")
