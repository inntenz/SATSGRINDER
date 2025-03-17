from playwright.sync_api import sync_playwright
import time
from faker import Faker

def run_kahoot_game():
    fake = Faker()  # Faker für zufällige Namen initialisieren
    
    with sync_playwright() as p:
        # Starte mehrere Browser-Instanzen
        browsers = []
        for _ in range(20):
            browser = p.chromium.launch(headless=True)
            browsers.append(browser)
        
        # Öffne jeweils eine Seite in jeder Instanz
        pages = []
        for browser in browsers:
            page = browser.new_page()
            page.goto("https://kahoot.it")
            pages.append(page)
        
        # Warte, bis alle Seiten geladen sind
        for page in pages:
            page.wait_for_selector("input")  # Warte, bis das erste Input-Feld verfügbar ist
            print("ok")
        game_code = input("input game code: ")
        # Fülle das erste Eingabefeld (Game-Code) aus und drücke Enter in allen Instanzen
        for page in pages:
            page.fill("input", game_code)
            page.press("input", "Enter")
            print("oka")

        # Warten, um sicherzustellen, dass das Spiel geladen ist
        time.sleep(6)

        # Screenshot machen und speichern für jede Seite
        for idx, page in enumerate(pages):
            
            print(f"{idx+1}")

            # Erstelle einen zufälligen Namen
            random_name = fake.name()

            # Fülle das nächste Eingabefeld (Name) aus und drücke Enter
            page.fill("input", random_name)
            
            page.press("input", "Enter")
            
        time.sleep(60)
            

if __name__ == "__main__":
    
    run_kahoot_game()
