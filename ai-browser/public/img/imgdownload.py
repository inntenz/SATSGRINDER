import requests
from PIL import Image
from io import BytesIO

# URL des Discord-Bildes
discord_image_url = "https://cdn.discordapp.com/attachments/1343330892315103243/1359515290244874351/IMG_0406.ico?ex=67f7c2c7&is=67f67147&hm=062ac22948825f993b18393d498e7f0d040d82e3d652f6a80dd3bf38dd03926e&"

# Dateiname
file_name = "logo.ico"

# Bild herunterladen und speichern
def download_and_convert_to_ico(url, file_name):
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()  # Fehler bei HTTP überprüfen
        
        # Bild mit PIL öffnen
        image = Image.open(BytesIO(response.content))
        
        # Bild als ICO speichern
        image.save(file_name, format="ICO")
        print(f"Bild erfolgreich als '{file_name}' gespeichert.")
    except requests.exceptions.RequestException as e:
        print(f"Fehler beim Herunterladen des Bildes: {e}")
    except IOError as e:
        print(f"Fehler beim Konvertieren in ICO: {e}")

# Funktion aufrufen
download_and_convert_to_ico(discord_image_url, file_name)
