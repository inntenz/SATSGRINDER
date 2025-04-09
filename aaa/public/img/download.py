import os
import requests

# URL des Bildes
url = "https://cdn.discordapp.com/attachments/1343330892315103243/1356629742257967257/IMG_4688.png?ex=67ed4367&is=67ebf1e7&hm=7f767af03d1a91995e544d43f121fd59483be4cb788c3627032c3a62e8b5673d&"

# Pfad für die Speicherung im Ordner der Datei
script_dir = os.path.dirname(os.path.abspath(__file__))  # Verzeichnis der aktuellen Datei
file_path = os.path.join(script_dir, "avatar.png")  # Speichern als avatar.png

# Datei herunterladen und speichern
response = requests.get(url)
if response.status_code == 200:
    with open(file_path, "wb") as file:
        file.write(response.content)
    print(f"Bild erfolgreich heruntergeladen und als 'avatar.png' im Ordner der Datei gespeichert.")
else:
    print(f"Fehler beim Herunterladen der Datei. Statuscode: {response.status_code}")
