import os, time
try:
    import requests
except ModuleNotFoundError:
    os.system("pip install requests")
    import requests

email = ""
password = ""
authToken = None

def getAuth(email, password):
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
    authToken = response_data.get("token")

def claimBounty():
    global authToken
    headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": f"Bearer {authToken}"
        }
    url = "https://api.satsfaucet.com/app/bounty/claim"
        
    requests.post(url, headers=headers)
    

import multiprocessing

# Hauptfunktion für jeden Account
def main(email, password):
    while True:
        print(f"Authentifiziere {email} mit Passwort {password}")
        for i in range(24):
            print(f"[{i+1}/24] Daily Bounty Claims")
            print("Claim Bounty")
            time.sleep(3630)

# Funktion zum Laden der Accounts aus der Datei
def load_accounts():
    with open('accs.txt', 'r') as file:
        return [line.strip() for line in file.readlines()]

if __name__ == "__main__":
    accounts = load_accounts()
    
    processes = []
    
    for account in accounts:
        email, password = account.split(":")
        p = multiprocessing.Process(target=main, args=(email, password))
        p.start()
        processes.append(p)
        time.sleep(0.5)

    # Optional: Warten, bis alle Prozesse beendet sind
    for p in processes:
        p.join()
        time.sleep(0.5)
