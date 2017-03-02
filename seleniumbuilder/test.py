# -*- coding: utf-8 -*-
from selenium import webdriver
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
import time
import sys

success = True
wd = webdriver.Chrome('./geckodriver')
wd.implicitly_wait(60)

def is_alert_present(wd):
    try:
        wd.switch_to_alert().text
        return True
    except:
        return False

try:
    wd.get("https://support.mozilla.org/t5/Problems-with-add-ons-plugins-or/Add-on-signing-in-Firefox/ta-p/30262")
    print('[start_tx] "test_tx"')
    if wd.find_element_by_xpath("//div[@id='messageview2']/div/div/div[1]/div/div/div/div/div[2]/div/div[1]/div/div[2]/div/div[2]/div/div[2]/h2/input").is_selected():
        wd.find_element_by_xpath("//div[@id='messageview2']/div/div/div[1]/div/div/div/div/div[2]/div/div[1]/div/div[2]/div/div[2]/div/div[2]/h2/input").click()
    print('[start_tx] "test_tx_2"')
    if wd.find_element_by_xpath("//div[@id='messageasfdview2']/div/div/div[1]/div/div/div/div/div[2]/div/div[1]/div/div[2]/div/div[2]/div/div[3]/h2/input").is_selected():
        wd.find_element_by_xpath("//div[@id='messaadsgeview2']/div/div/div[1]/div/div/div/div/div[2]/div/div[1]/div/div[2]/div/div[2]/div/div[3]/h2/input").click()
    print('[stop_tx] "test_tx"')
    print('[stop_tx] "test_tx_2"')
except:
    print "Unexpected error:", sys.exc_info()[0]
finally:
    wd.quit()
    if not success:
        raise Exception("Test failed.")
