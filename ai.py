import requests
import json

def send_request(model, conversations, user, user_ip, stream=False):
    url = "https://cablyai.com/v1/chat/completions"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "model": model,
        "messages": conversations[user],
    }

    # Add stream key to payload if stream is enabled
    if stream:
        payload["stream"] = True

    response = requests.post(url, headers=headers, data=json.dumps(payload))

    if response.ok:
        if stream:
            print("Stream:", response.text)
        else:
            print(response.json())
    else:
        print("Error:", response.status_code, response.text)

# Beispielaufruf
model = "gpt-4o-mini"
conversations = {"user123": [{"role": "user", "content": "Hello Code me complex python script please!"}]}
user = "user123"
user_ip = "127.0.0.1"

send_request(model, conversations, user, user_ip, stream=True)
