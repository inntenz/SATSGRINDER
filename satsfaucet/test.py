import requests
import time

API_KEY = "940b693a14a1110d444da2d03cb0ddd8"
email = "minewolf.gaer08@gmail.com"
password = "Frankreich7"
SITE_KEY = "2132b5cb-ab2c-40ca-83c0-b7cae5cd320a"
PAGE_URL = "https://www.satsfaucet.com/register"

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
    print("Löse CAPTCHA...")

    for _ in range(30):
        time.sleep(5)  # Alle 5 Sekunden prüfen
        result = requests.get(f"http://2captcha.com/res.php?key={API_KEY}&action=get&id={captcha_id}&json=1").json()
        if result["status"] == 1:
            return result["request"]
    
    print("CAPTCHA konnte nicht gelöst werden.")
    return None

def getAuth(email, password):
    url = "https://api.satsfaucet.com/auth/register"
    
    hcaptcha_token = solve_hcaptcha(SITE_KEY, PAGE_URL)
    if not hcaptcha_token:
        return
    
    payload = {"email": email, "password": password, "hCaptchaResponse": hcaptcha_token}
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "origin": "https://www.satsfaucet.com",
        "referer": "https://www.satsfaucet.com/register",
    }

    response = requests.post(url, json=payload, headers=headers)
    print(response.json())

getAuth(email, password)
