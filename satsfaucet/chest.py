import os, time, random
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
import requests
import requests


def getitems():
    global authToken
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": f"Bearer {authToken}"
    }
    url = "https://api.satsfaucet.com/app/backpack/get-items?sort=new&page=1&limit=32"
    
    response = requests.post(url, headers=headers)
    if response.status_code == 200:
        try:
            data = response.json()
            
            if "items" in data and isinstance(data["items"], list):
                filtered_items = [item for item in data["items"] if item.get("rarity") == "legendary"]
                
                if len(filtered_items) < 4:
                    print("Nicht genug legendäre Items gefunden.")
                    return []
                
                selected_items = random.sample(filtered_items, 4)
                selected_ids = [item["id"] for item in selected_items]
                print("Ausgewählte IDs:", selected_ids)
                
                send_selected_items(selected_ids)
                return selected_ids
            else:
                print("Fehler: Unerwartetes Datenformat", data)
        
        except requests.exceptions.JSONDecodeError:
            print("Fehler: Die API-Antwort ist kein gültiges JSON.", response.text)
    else:
        print(f"Fehler: {response.status_code}, {response.text}")

def send_selected_items(item_ids):
    global authToken
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": f"Bearer {authToken}"
    }
    url = "https://api.satsfaucet.com/app/backpack/craft"
    payload = {"items": item_ids}
    
    response = requests.post(url, json=payload, headers=headers)
    
    if response.status_code == 200:
        print("Erfolgreich gesendet:", response.json())
    else:
        print(f"Fehler beim Senden: {response.status_code}, {response.text}")

getAuth("minirisky2@gmail.com", "Frankreich7")
getitems()