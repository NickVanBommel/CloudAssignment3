import os
import time
import email, smtplib, ssl
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import datetime
import schedule
import http.client
from dotenv import load_dotenv
load_dotenv()

# if having problems with authentication go to https://www.google.com/settings/security/lesssecureapps

# for gmail:
smtp_server = "smtp.gmail.com"

# TLS port
port = 587

def send_email_with_attachment(sender_email, password, receiver_email, filename):
    todays_date = datetime.datetime.today()
    
    subject = "Cloud Usage Monitor Logging Update"
    body = "Here's your Cloud Usage Monitor logging report for " + (todays_date.strftime("%d-%B-%Y"))

    # multipart message layout with headers
    message = MIMEMultipart()
    message["From"] = sender_email
    message["To"] = receiver_email
    message["Subject"] = subject
    message.attach(MIMEText(body, "plain"))

    # add log file as downloadable attachment
    with open(filename, "rb") as attachment:
        part = MIMEBase("application", "octet-stream")
        part.set_payload(attachment.read())
    
    # encode file in ASCII to send via email
    encoders.encode_base64(part)
    part.add_header(
        "Content-Disposition",
        "attachment; filename=logs.txt",
    )

    # add attachment to msg and convert msg to text string to send
    message.attach(part)
    text = message.as_string()

    # using the SMTP lib, send email from sender to receiver
    server = smtplib.SMTP(smtp_server, port)
    server.ehlo()
    server.starttls()
    server.ehlo()
    server.login(sender_email, password)
    server.sendmail(sender_email, receiver_email, text)

# actual implementation
schedule.every().day.at("00:00").do(send_email_with_attachment(os.getenv("CUBESAT_EMAIL"), os.getenv("CUBESAT_PASS"), os.getenv("RECEIVING_EMAIL"), "../logs/event.log"))

while True:
    schedule.run_pending()
    time.sleep(1)