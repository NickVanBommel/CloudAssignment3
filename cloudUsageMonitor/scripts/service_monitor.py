import os
import email, smtplib, ssl
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import datetime
import time
import schedule
import requests
from dotenv import load_dotenv
load_dotenv()


# if having problems with authentication go to https://www.google.com/settings/security/lesssecureapps

# for gmail
smtp_server = "smtp.gmail.com"

port = 587 # TLS port

def send_email(sender_email, password, receiver_email):
    subject = "Cloud Usage Monitor is DOWN"
    body = "The Cloud Usage Monitor Server is currently down."
    context = ssl.create_default_context()
    
    # multipart message layout with headers
    message = MIMEMultipart()
    message["From"] = sender_email
    message["To"] = receiver_email
    message["Subject"] = subject
    message.attach(MIMEText(body, "plain"))
    text = message.as_string()

    # using the SMTP lib, send email from sender to receiver
    server = smtplib.SMTP(smtp_server, port)
    server.ehlo()
    server.starttls()
    server.ehlo()
    server.login(sender_email, password)
    server.sendmail(sender_email, receiver_email, text)

def check_server():
    res = requests.get(os.getenv("USAGE_MON_AVAIL"))
    if res.status_code != 200:
        send_email(os.getenv("CUBESAT_EMAIL"), os.getenv("CUBESAT_PASS"), os.getenv("RECEIVING_EMAIL"))

schedule.every(5).minutes.do(check_server())

while True:
    schedule.run_pending() 
    time.sleep(1) 
