const express = require("express");
const cors = require("cors");
const axios = require("axios");
const bodyParser = require("body-parser");
const fs = require("fs");
const translate = require('google-translate-api-x');
const nlp = require('compromise');
const path = require('path');
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");


const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());
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
            if (conversations[user].length > 8) {
                conversations[user] = conversations[user].slice(-8);
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



const SECRET_KEY = "68a281f756670f00cb01f9622b06efed70996f88f01094518062f75f0e2551b915a690ed38ebd35d3df6e84beff0e69268494c99b5dae2882a814c1d29708ea3982cb2ee272172d28cf5cf31da78f4110417ecd39b27f43038d10909ce5eabdc766a91ddfa2b600908ec4d491897490c3289366166ced7a72df92b6d83c51e1d5d1c99cc0b43626fdac16cfdf60454dadf64aca0be7a89e29cd2bc647fb3728cb0716769dd5a70b1ecac4d4827a167fe3550c11d";


async function createJWT(email, userId) {
    const payload = {
        email: email,
        userId: userId,
    };

    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "7d" });
    return token;
}

async function verifyJWT(token) {
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const email = decoded.email;
        return email;
    } catch (err) {
        return false;
    }
}






//const  accesToken = req.cookies.accesToken;
//if (!accesToken) return res.status(401).json({ message: "Access Token required" });

app.post("/api/login", async (req, res) => {

    const token = await createJWT(email, userid);
    res.cookie("accessToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
});




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
        const  accesToken = req.cookies.accesToken;
        if (!accesToken) return res.status(401).json({ message: "Access Token required" });

        const { prompt, user } = req.body;
        const userIP = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
        const model = req.body.model?.toLowerCase();
        
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

  

app.post("/api/intenz/websearch", async (req, res) => {

    const { prompt, user } = req.body;
    const userIP = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    
    if (!prompt || !user) {
        
        return res.status(400).json({ error: "Fehlende Parameter: prompt oder user" });
    }
    
    const stats = loadstats();
    stats.usage += 1;
    savestats(stats);

        async function translateText(text, targetLanguage) {
            try {
                const result = await translate(text, { to: targetLanguage, from: "auto" });
                return result.text; 
            } catch (error) {
                return text;
            }
        }
        async function sendToCablyAI(prompt, language, model = "gpt-4o") {
            try {
                const response = await axios.post(
                    "https://cablyai.com/v1/chat/completions",
                    {
                        model: model,
                        messages: [{ role: "user", content: prompt }],
                        metadata: { language: language },
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (response.data?.choices?.length > 0) {
                    return response.data.choices[0].message.content;
                } else {
                    return "Keine Antwort von Cably AI erhalten.";
                }
            } catch (error) {
                console.error(`Fehler beim Senden an Cably AI: ${error}`);
                return "Fehler beim Senden des Prompts.";
            }
        }

        async function websearch(query, ip) {
            const ipResponse = await axios.get(`http://ip-api.com/json/${ip}`);
            const ipData = ipResponse.data;
            if (ipData.status !== "success") {
                return
            };

            let countryCode = ipData.countryCode.toLowerCase();

            if (countryCode === "gb") {
                countryCode = "en";
            }



            const prompt = `Please research information VERY IMPORTANTLY IN THE LANGUAGE: ${countryCode}. PLEASE PROVIDE THE ANSWER AND SOURCES IN THAT LANGUAGE for the prompt: ${query}, and write a coherent text with sources. Also, provide the links you used for your research as sources!`;
            const translatedPrompt = await translateText(prompt, countryCode);
            const response = await sendToCablyAI(translatedPrompt, countryCode);
            const translatedresponse = await translateText(response, countryCode);
            return translatedresponse;
        }

    const result = await websearch(prompt ,userIP);
    if (result) {
        return res.json({content: result});
    }
    return res.status(400).send();

});


app.get('/home', (req, res) => { 
    res.sendFile(__dirname + '/public/index.html');
});
app.get('/gpt-4o-mini', (req, res) => { 
    res.sendFile(__dirname + '/public/gpt-4o-mini.html');
});
app.get('/gpt-4o-normal', (req, res) => { 
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
app.get('/websearch', (req, res) => { 
    res.sendFile(__dirname + '/public/websearch.html');
});

app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});
