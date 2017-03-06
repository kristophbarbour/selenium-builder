# -*- coding: utf-8 -*-
from selenium import webdriver
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
import time
import sys

success = True
wd = webdriver.Firefox()
wd.implicitly_wait(60)

def is_alert_present(wd):
    try:
        wd.switch_to_alert().text
        return True
    except:
        return False

try:
    print('[start_tx] ' + "start")
    wd.get("http://www.sebuilder.com/")
    print wd.execute_script(function calculate_load_times() {  var res = "";  # Check performance support  if (performance === undefined) {    res += "= Calculate Load Times: performance NOT supported" + "
";    return;  }  # Get a list of "resource" performance entries  var resources = performance.getEntriesByType("resource");  if (resources === undefined || resources.length <= 0) {    res += "= Calculate Load Times: there are NO `resource` performance records" + "
";    return;  }  res += "= Calculate Load Times" + "
";  for (var i=0; i < resources.length; i++) {    res += "== Resource[" + i + "] - " + resources[i].name + "
";    # Redirect time    var t = resources[i].redirectEnd - resources[i].redirectStart;    res += "... Redirect time = " + t + "
";    # DNS time    t = resources[i].domainLookupEnd - resources[i].domainLookupStart;    res += "... DNS lookup time = " + t + "
";    # TCP handshake time    t = resources[i].connectEnd - resources[i].connectStart;    res += "... TCP time = " + t + "
";    # Secure connection time    t = (resources[i].secureConnectionStart > 0) ? (resources[i].connectEnd - resources[i].secureConnectionStart) : "0";    res += "... Secure connection time = " + t + "
";    # Response time    t = resources[i].responseEnd - resources[i].responseStart;    res += "... Response time = " + t + "
";    # Fetch until response end    t = (resources[i].fetchStart > 0) ? (resources[i].responseEnd - resources[i].fetchStart) : "0";    res += "... Fetch until response end time = " + t + "
";    # Request start until reponse end    t = (resources[i].requestStart > 0) ? (resources[i].responseEnd - resources[i].requestStart) : "0";    res += "... Request start until response end time = " + t + "
";    # Start until reponse end    t = (resources[i].startTime > 0) ? (resources[i].responseEnd - resources[i].startTime) : "0";    res += "... Start until response end time = " + t + "
";  }  return res;})
    wd.execute_script("return \"Hello World\";")
    print('[stop_tx] ' + "start")
except:
    print "Unexpected error:", sys.exc_info()[0]
finally:
    wd.quit()
    if not success:
        raise Exception("Test failed.")
