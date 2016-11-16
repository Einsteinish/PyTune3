#!/srv/pytune/venv/pytune/bin/python

import sys
sys.path.append('/srv/pytune')

import subprocess
import requests
import settings
import socket

def main():
    df = subprocess.Popen(["df", "/"], stdout=subprocess.PIPE)
    output = df.communicate()[0]
    device, size, used, available, percent, mountpoint = output.split("\n")[1].split()
    hostname = socket.gethostname()
    percent = int(percent.strip('%'))
    
    if percent > 95:
        requests.post(
                "https://api.mailgun.net/v2/%s/messages" % settings.MAILGUN_SERVER_NAME,
                auth=("api", settings.MAILGUN_ACCESS_KEY),
                data={"from": "PyTune Monitor: %s <admin@%s.pytune.com>" % (hostname, hostname),
                      "to": [settings.ADMINS[0][1]],
                      "subject": "%s hit %s%% disk usage!" % (hostname, percent),
                      "text": "Usage on %s: %s" % (hostname, output)})
    else:
        print " ---> Disk usage is fine: %s / %s%% used" % (hostname, percent)
        
if __name__ == '__main__':
    main()
