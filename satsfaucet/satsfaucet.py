import asyncio, time, requests
from playwright.async_api import async_playwright

auth_token = None
email = "minewolf.gamer08@gmail.com"
password = "Frankreich7"

async def getAuth(route, request):
    global auth_token
    headers = request.headers
    if "authorization" in headers and auth_token is None:
        auth_token = headers["authorization"]
    await route.continue_()

async def applogin(email, password):
    global auth_token
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        await context.route("**", getAuth)
        page = await context.new_page()
        
        try:
            await page.goto("https://www.satsfaucet.com/login")
            await page.fill('input[name="email"]', email)
            await page.fill('input[name="password"]', password)
            await page.click('button[type="submit"]')
            
            await page.wait_for_url("https://www.satsfaucet.com/app/dashboard", timeout=10000)
            time.sleep(2)
            
        except Exception as e:
            print("Error:", e)

        finally:
            await browser.close()  

async def send_api_request():
    global auth_token
    if auth_token:
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": f"{auth_token}"
        }
        url = "https://api.satsfaucet.com/app/bounty/claim"
        try:
            response = requests.post(url, headers=headers)
            print("API Response:", response.json())
        except Exception as e:
            print("error with api request", e)
    else:
        print("No auth token")

async def start_scheduled_requests():
    
    try:
        while True:
            await send_api_request()
            await asyncio.sleep(3660)  
    except asyncio.CancelledError:
        print("API-Requests stopped")

async def run_loop():
    while True:
        await applogin(email, password)
        for i in range(24):
            print(f"[{i+1}/24] Daily Bounty Claims")
            await start_scheduled_requests()
            await asyncio.sleep(61 * 60)
        
asyncio.run(run_loop())
