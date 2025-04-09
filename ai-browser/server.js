const express = require("express");
const cors = require("cors");
const axios = require("axios");
const bodyParser = require("body-parser");
const fs = require("fs");
const translate = require('google-translate-api-x');
const nlp = require('compromise');
const path = require('path');



const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

app.set('trust proxy', true); 

const rateLimit = new Map(); 
const RATE_LIMIT_TIME = 2500; 
const CONVERSATIONS_FILE = "conversations.json";

function loadConversations() {
    if (!fs.existsSync(CONVERSATIONS_FILE)) {
        return {}; 
    }
    try {
        const data = fs.readFileSync(CONVERSATIONS_FILE, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        console.error("Fehler beim Laden der Konversationen:", error);
        return {}; 
    }
}
function saveConversations(conversations) {
    try {
        
        for (const user in conversations) {
            if (conversations[user].length > 4) {
                conversations[user] = conversations[user].slice(-4);
            }
        }
        
        fs.writeFileSync(CONVERSATIONS_FILE, JSON.stringify(conversations, null, 2));
    } catch (error) {
        console.error("Fehler beim Speichern der Konversationen:", error);
    }
}

const statsfile = "stats.json";

function loadstats() {
    if (!fs.existsSync(statsfile)) {
        return {}; 
    }
    try {
        const data = fs.readFileSync(statsfile, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        console.error("Fehler beim Laden der Konversationen:", error);
        return {}; 
    }
}
function savestats(data) {
    try {
        
        fs.writeFileSync(statsfile, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Fehler beim Speichern der Konversationen:", error);
    }
}




app.post("/api/intenz/detect", async (req, res) => {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: "Text fehlt zur Spracherkennung" });
    }
  
    try {
      const detectRes = await translate(text, { to: "en", from: "auto" });
      const detectedLang = detectRes.from.language.iso;
      
  
      return res.json({ language: detectedLang });
    } catch (err) {
      
      return res.status(500).json({ error: "Spracherkennung fehlgeschlagen" });
    }
});
  
  app.post("/api/intenz/translate", async (req, res) => {
    const { text, user, countryCode } = req.body;
    const userIP = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  
    try {
      const translateresponse = await translate(text, { to: countryCode });
      const translation = translateresponse.text;
      
      return res.json({ translation });
    } catch (err) {
      
      return res.status(500).json({ error: "Übersetzungsfehler" });
    }
  });

app.post("/api/intenz/home", async (req, res) => {
    const stats = loadstats();
    const usage = stats.usage;
    const launch = stats.launch;
    const date = new Date(launch * 1000);

    const options = { day: '2-digit', month: 'long', year: 'numeric' };
    const launchdate = date.toLocaleDateString('de-DE', options);


    return res.json({ usage, launchdate });
});


app.post("/api/intenz/language", async (req, res) => {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    try {
        const ipResponse = await fetch(`http://ip-api.com/json/${ip}`);
        const ipData = await ipResponse.json();
        if (ipData.status !== "success") throw new Error("Invalid IP response");

        const countryCode = ipData.countryCode.toLowerCase();
        const text = "How can I help you?";
        const translateData = await translate(text, { to: countryCode });

        const text2 = "The AI can make mistakes. Double-check important information";
        const translateData2 = await translate(text2, { to: countryCode });

        return res.json({
            promptmessage: translateData.text,
            errorinfomessage: translateData2.text
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});



app.post("/api/intenz/createuser", async (req, res) => {
    const randomNumbers = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)); // Zufallszahlen zwischen 0 und 9
    const combinedNumbers = randomNumbers.join('');
    const user = `${combinedNumbers}-${Date.now()}`;
    return res.json({ user });
});


app.post("/api/intenz/ai", async (req, res) => {
    try {
        const { prompt, user, model } = req.body;
        const userIP = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
        
        if (!prompt || !user) {
            
            return res.status(400).json({ error: "Fehlende Parameter: prompt oder user" });
        }
        
        const lastRequestTime = rateLimit.get(user);
        const currentTime = Date.now();

        if (lastRequestTime && currentTime - lastRequestTime < RATE_LIMIT_TIME) {
            return res.status(429).json({ error: "Zu viele Anfragen. Bitte warte 5 Sekunden." });
        }

        rateLimit.set(user, currentTime);

        const conversations = loadConversations();

        if (conversations[user]) {
            conversations[user].push({ role: "user", content: prompt });
        }

        if (!conversations[user]) {
            conversations[user] = [];
            conversations[user].push({ role: "user", content: prompt });
        }



        const response = await fetch("https://cablyai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: model,
                messages: conversations[user],
                userIP: userIP
            })
        });
        
        const stats = loadstats();
        stats.usage += 1;
        savestats(stats);

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(400).send();
        }
        
        const data = await response.json();
        
        let cleanedReply = data?.choices?.[0]?.message?.content || "Keine Antwort erhalten.";

        if (cleanedReply.includes("\`\`\`")) {
            cleanedReply = cleanedReply.replace("\`\`\`", "\n\`\`\`");
        }

        conversations[user].push({ role: "assistant", content: cleanedReply });

        saveConversations(conversations);


        res.json({ cleanedReply });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Fehler beim Abrufen der AI-Antwort" });
    }
});

  



app.get('/home', (req, res) => { 
    res.sendFile(__dirname + '/public/index.html');
});
app.get('/gpt-4o-mini', (req, res) => { 
    res.sendFile(__dirname + '/public/gpt-4o-mini.html');
});
app.get('/gpt-4o', (req, res) => { 
    res.sendFile(__dirname + '/public/gpt-4o.html');
});
app.get('/plutogpt-3.5-turbo', (req, res) => { 
    res.sendFile(__dirname + '/public/plutogpt-3-5-turbo.html');
});
app.get('/plutogpt-4o-mini', (req, res) => {
    res.sendFile(__dirname + '/public/plutogpt-4o-mini.html');
});

app.get('/translator', (req, res) => { 
    res.sendFile(__dirname + '/public/translate.html');
});

app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});
