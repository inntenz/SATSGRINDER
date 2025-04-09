import os, random, time
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
    return response_data.get("token")

def getitems(authToken):
    headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": f"Bearer {authToken}"
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
            "Authorization": f"Bearer {authToken}"
        }
        
    response = requests.post(url, json=payload, headers=headers)
    print(response.json())

def buyitems(id, authToken):
    url = "https://api.satsfaucet.com/app/market/buy-item"
    payload = {"id":int(id)}
    headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": f"Bearer {authToken}"
        }
        
    response = requests.post(url, json=payload, headers=headers)
    print(response.json())

import requests

def getahid(item_id, authToken):
    url = "https://api.satsfaucet.com/app/market/get-items-on-sale?page=1&limit=32&sort=new"
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": f"Bearer {authToken}"
    }
    
    response = requests.post(url, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        for item in data.get("items", []):
            if item.get("id") == item_id:
                return item.get("auctionId")
    
    return None


def getcoin(authToken):
    url = "https://api.satsfaucet.com/app/user/get-session"
    headers = {"Authorization": f"Bearer {authToken}"}
    
    response = requests.post(url, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        return data.get("coins", 0)  # Gibt die Anzahl der Coins zurück
    else:
        print(f"Error: {response.status_code}, {response.text}")
        return None

def item(email):

    main = getAuth(email, "Frankreich7")
    coins = getcoin(main)
    print(str(coins))
    
    id = getitems(main)
    sellitems(id, main)
    buyer = getAuth("minewolf.gamer08@gmail.com", "Frankreich7")
    time.sleep(2)
    ahid = getahid(id, buyer)
    buyitems(ahid, buyer)

email = "usermgx@ptct.net"
item(email)