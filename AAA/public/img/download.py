import os
import requests

# URL des Bildes
url = "https://cdn.discordapp.com/attachments/1312884945685057748/1350029441539117087/standard.gif?ex=67d54065&is=67d3eee5&hm=7c9055d0d6cc5077d49ea894bbc175578387260eff493664b590e9b31c2069f0"

# Pfad für die Speicherung im aktuellen Verzeichnis
file_path = os.path.join(os.getcwd(), "logo.png")

# Datei herunterladen und speichern
response = requests.get(url)
if response.status_code == 200:
    with open(file_path, "wb") as file:
        file.write(response.content)
    print(f"Bild erfolgreich heruntergeladen und als 'logo.png' im aktuellen Ordner gespeichert.")
else:
    print(f"Fehler beim Herunterladen der Datei. Statuscode: {response.status_code}")
