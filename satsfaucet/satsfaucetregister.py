import requests
import time
import re
import random, string

BASE_URL = "https://api.mail.tm"
global authToken
authToken = None

# Funktion zur Erstellung einer temporären E-Mail
def create_temp_email():
    domains_response = requests.get(f"{BASE_URL}/domains").json()
    
    if not domains_response or "hydra:member" not in domains_response:
        print("Fehler beim Abrufen der Domains.")
        return None, None, None
    
    domain = domains_response["hydra:member"][0]["domain"]  # Erste verfügbare Domain nutzen
    user = "experimento"
    random_letters = ''.join(random.choices(string.ascii_lowercase, k=3))  # 3 zufällige Kleinbuchstaben
    new_user = user + random_letters
    email = f"{new_user}@{domain}"
    password = "SuperSicheresPasswort"
    
    payload = {"address": email, "password": password}
    response = requests.post(f"{BASE_URL}/accounts", json=payload)
    
    if response.status_code != 201:
        print("Fehler beim Erstellen der E-Mail:", response.json())
        return None, None, None
    
    print("Temporäre E-Mail erstellt:", email)
    return email, password, domain

# Funktion zur Anmeldung und Abruf des Tokens
def get_token(email, password):
    payload = {"address": email, "password": password}
    response = requests.post(f"{BASE_URL}/token", json=payload)
    
    if response.status_code != 200:
        print("Fehler beim Abrufen des Tokens:", response.json())
        return None
    
    token = response.json().get("token")
    print("Token erhalten:", token)
    return token

# Funktion zum Abrufen von E-Mails
def fetch_emails(token):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/messages", headers=headers)
    
    if response.status_code != 200:
        print("Fehler beim Abrufen der E-Mails:", response.json())
        return []
    
    emails = response.json().get("hydra:member", [])
    return emails


from bs4 import BeautifulSoup

def extract_verification_link(email_content, email_html):
    # Falls HTML vorhanden ist, dieses bevorzugt analysieren
    content = email_html if email_html else email_content
    
    # HTML parsen
    soup = BeautifulSoup(content, "html.parser")
    
    # Alle Links aus der HTML extrahieren
    links = [a["href"] for a in soup.find_all("a", href=True)]
    
    # Den passenden Link für die Verifizierung suchen
    for link in links:
        if "https://api.satsfaucet.com/auth/verify-user-email" in link:
            return link
    
    return None



import requests
import time

API_KEY = "940b693a14a1110d444da2d03cb0ddd8"
email = "minewolf.gaer08@gmail.com"
password = "Frankreich7"
SITE_KEY = "2132b5cb-ab2c-40ca-83c0-b7cae5cd320a"
PAGE_URL = "https://www.satsfaucet.com/register"

import threading

def solve_hcaptcha(site_key, url):
    response = requests.post("http://2captcha.com/in.php", data={
        "key": API_KEY,
        "method": "hcaptcha",
        "sitekey": site_key,
        "pageurl": url,
        "json": 1
    }).json()

    if response["status"] != 1:
        print("Fehler beim Senden an 2Captcha:", response)
        return None

    captcha_id = response["request"]
    print(f"Löse CAPTCHA... (ID: {captcha_id})")

    solution = None  # Gemeinsame Variable für die Lösung
    lock = threading.Lock()  # Lock für sicheren Zugriff
    stop_event = threading.Event()  # Event zum Stoppen der Threads

    def check_captcha():
        nonlocal solution
        for _ in range(100):
            if stop_event.is_set():  # Falls bereits gelöst, sofort abbrechen
                return

            time.sleep(7)  # Prüfe alle 3 Sekunden
            result = requests.get(f"http://2captcha.com/res.php?key={API_KEY}&action=get&id={captcha_id}&json=1").json()
            
            if result["status"] == 1:
                with lock:  # Kritischen Bereich sichern
                    if solution is None:  # Nur die erste gefundene Lösung speichern
                        solution = result["request"]
                        print(f"CAPTCHA gelöst: {solution}")
                        stop_event.set()  # Andere Threads stoppen
                return  # Beende den Thread

    # Starte mehrere Threads
    threads = []
    for _ in range(3):  # 5 Threads starten
        t = threading.Thread(target=check_captcha)
        t.start()
        threads.append(t)

    # Warte auf alle Threads
    for t in threads:
        t.join()

    return solution  # Gibt nur die erste gültige Lösung zurück

def register(email, password):
    url = "https://api.satsfaucet.com/auth/register"
    
    hcaptcha_token = solve_hcaptcha(SITE_KEY, PAGE_URL)
    if not hcaptcha_token:
        return
    
    payload = {"email": email, "password": password, "hCaptchaResponse": hcaptcha_token, "referrerId": "23277"}
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "origin": "https://www.satsfaucet.com",
        "cookie": "satsfaucet-referrer=Intenz",
        "referer": "https://www.satsfaucet.com/register?r=Intenz",
    }

    response = requests.post(url, json=payload, headers=headers)
    print(response.json())


import os
try:
    import requests
except ModuleNotFoundError:
    os.system("pip install requests")
    import requests

email = "minewolf.gamer08@gmail.com "
password = "Frankreich7"
authToken = None

def login(email, password="Frankreich7"):
    global authToken
    url = "https://api.satsfaucet.com/auth/login"
    payload = { "email": email, "password": password }
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "origin": "https://www.satsfaucet.com",
        "referer": "https://www.satsfaucet.com/",
    }

    response = requests.post(url, json=payload, headers=headers)
    response_data = response.json()
    authToken = "Bearer " + response_data.get("token")
    print(authToken)
    return authToken

emailse = "https://api.satsfaucet.com/app/send-verification-email"


def emailsen():
    global authToken
    
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "origin": "https://www.satsfaucet.com",
        "referer": "https://www.satsfaucet.com/",
        "Authorization": f"{authToken}"  # Token hier richtig setzen
    }

    payload = {}  # Falls ein Payload nötig ist, sonst einfach leer lassen

    response = requests.post(emailse, json=payload, headers=headers)
    response_data = response.json()
    print(f"EMAIL seNDER: {response_data}")



def getitems(authToken):
    headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": f"{authToken}"
        }
    url = "https://api.satsfaucet.com/app/backpack/get-items?sort=new&page=1&limit=32"
        
    response = requests.post(url, headers=headers)
    if response.status_code == 200:
        try:
            data = response.json()  # JSON-Antwort in ein Python-Objekt umwandeln
            
            if "items" in data and isinstance(data["items"], list):  # Prüfen, ob "items" vorhanden ist und eine Liste ist
                filtered_items = [item for item in data["items"] if item.get("rarity") == "legendary"]
                filtered_ids = [item["id"] for item in filtered_items]
                print(filtered_ids)
                return random.choice(filtered_ids)
            else:
                print("Fehler: Unerwartetes Datenformat", data)

        except requests.exceptions.JSONDecodeError:
            print("Fehler: Die API-Antwort ist kein gültiges JSON.", response.text)
    else:
        print(f"Fehler: {response.status_code}, {response.text}")

def sellitems(id, authToken):
    url = "https://api.satsfaucet.com/app/market/sell-item"
    payload = { "id": id, "price": 10 }
    headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": f"{authToken}"
        }
        
    response = requests.post(url, json=payload, headers=headers)
    print(response.json())

def buyitems(id, authToken):
    url = "https://api.satsfaucet.com/app/market/buy-item"
    payload = {"id":id}
    headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": f"{authToken}"
        }
        
    response = requests.post(url, json=payload, headers=headers)
    print(response.json())

import requests

def getahid(item_id, authToken):
    url = "https://api.satsfaucet.com/app/market/get-items-on-sale?page=1&limit=32&sort=new"
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": f"{authToken}"
    }
    
    response = requests.post(url, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        for item in data.get("items", []):
            if item.get("id") == item_id:
                return item.get("auctionId")
    
    return None

def claimBounty(authToken):
    
    headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": f"{authToken}"
        }
    url = "https://api.satsfaucet.com/app/bounty/claim"
        
    requests.post(url, headers=headers)


def item(email):

    seller = login(email, "Frankreich7")
    claimBounty(seller)
    id = getitems(seller)
    sellitems(id, seller)
    buyer = login("minirisky2@gmail.com", "Frankreich7")
    ahid = getahid(id, buyer)
    buyitems(ahid, buyer)

def gen():
    email, password, domain = create_temp_email()
    if email:
        token = get_token(email, password)
        if token:
            register(email, "Frankreich7")
            login(email)
            emailsen()
            print("Warte auf E-Mails...")
            while True:
                time.sleep(5)  
                emails = fetch_emails(token)
                
                for emailo in emails:
                    email_id = emailo["id"]
                    response = requests.get(f"{BASE_URL}/messages/{email_id}", headers={"Authorization": f"Bearer {token}"})
                    if response.status_code == 200:
                        email_data = response.json()
                        email_content = email_data.get("text", "")
                        email_html = email_data.get("html", "")  # HTML-Inhalt abrufen
                        if isinstance(email_html, list):
                            email_html = " ".join(email_html)  # Liste in String umwandeln
                        if isinstance(email_content, list):
                            email_content = " ".join(email_content)

                        
                        verification_link = extract_verification_link(email_content, email_html)
                        if verification_link:
                            import webbrowser

                            response = requests.get(verification_link)

                            if response.status_code == 200:
                                print("E-Mail erfolgreich verifiziert!")

                            with open("accs.txt", "a") as file:
                                file.write(f"{email}:Frankreich7\n")
                            
                            time.sleep(1)
                            item(email)
                            
                            gen()
                            

                        else:
                            print("Kein Bestätigungslink gefunden.")

gen()