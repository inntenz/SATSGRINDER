const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require("fs");
const axios = require("axios");
const crypto = require('crypto');
const path = require('path');
const https = require('https');
const bodyParser = require("body-parser");
const app = express();
const port = 3000;
require('dotenv').config(); 

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.json());
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

const secretKey = process.env.secret_key;
const secretcrypt = process.env.secret;
const hcaptcha_secret_key = process.env.hcaptcha_secret_key;
const ADMIN_PASSWORD = process.env.admin_password;

const secret = crypto.createHash('sha256').update(secretcrypt).digest(); 

// Verschlüsselungs
function encryptData(data) {
    const cipher = crypto.createCipheriv('aes-256-cbc', secret, Buffer.alloc(16, 0)); 
    let encrypted = cipher.update(data, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}


const loginfile =  path.join("login.json");

async function loadlogin() {
    if (!fs.existsSync(loginfile)) {
        fs.writeFileSync(loginfile, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(loginfile));
}
function savelogin(data) {
    fs.writeFileSync(loginfile, JSON.stringify(data, null, 2));
}






async function genuserid() { 
    const randomNumbers = Array.from({ length: 5 }, () =>
        Math.floor(Math.random() * 10) 
    ).join('');

    
    const timestamp = Date.now();    
    return randomNumbers + timestamp;
}

async function generateAuthToken(email, userid, secretKey) {

    const payload = {
        email: email,
        userId: userid,
        createdAt: new Date().toISOString(),
    };

    const token = jwt.sign(payload, secretKey, { algorithm: 'HS256' });
    return token;
}



async function decodeAuthToken(token) {
    try {
        const decoded = jwt.verify(token, secretKey);
        return decoded;
    } catch (err) {
        console.error("Invalid Token:", err.message);
        return null;
    }
}
async function getEmailFromAuthToken(token) {
    const decoded = await decodeAuthToken(token);
    if (decoded && decoded.email) {
        console.log("ye");
        return decoded.email;
    } else {
        console.error("Email not found in token payload.");
        return null;
    }
}

async function IpCountry(ip) {
    try {
        const response = await axios.get(`http://ip-api.com/json/${ip}`);
        if (response.data && response.data.status === 'success') {
            return response.data.country || 'Unknown';
        }
    } catch (error) {
        console.error(`Error while fetching country:`, error.message);
    }
    return 'Unknown';
}


const ipmap = new Map();

async function saveAndCheck(text) {
    if (ipmap.has(text)) {
        return true; 
    } else {
        ipmap.set(text);
        return false;
    }
}

async function checkCaptcha(token){
    try {
        const data = {
        secret: hcaptcha_secret_key,
        response: token,
        };

        const response = await axios.post("https://api.hcaptcha.com/siteverify", new URLSearchParams(data));

        const success = response.data.success;

        if (success) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        return false;
        
    }
}


async function checkTempmail(email) {
    const URL = 'https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/main/disposable_email_blocklist.conf';

    // Funktion, um die Liste asynchron zu laden
    const fetchDisposableEmailDomains = () => {
        return new Promise((resolve, reject) => {
            https.get(URL, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    const domains = data.split('\n').map(domain => domain.trim()).filter(domain => domain !== '');
                    resolve(domains);
                });

            }).on('error', (err) => {
                reject(err);
            });
        });
    };

    const disposableEmailDomains = await fetchDisposableEmailDomains();

    const domain = email.split('@')[1];
    return disposableEmailDomains.some(tempDomain => tempDomain === domain);
}


app.post('/usercoins', async (req, res) => {
    const { authToken } = req.body;
    const email = await getEmailFromAuthToken(authToken);
    return res.status(200);
});


app.post('/api/login', async (req, res) => {
    const { password, hcaptchaResponse } = req.body;
    const email = req.body.email?.toLowerCase();
    
    if (!hcaptchaResponse) {
        return res.status(400).json();
    }
    if (!await checkCaptcha(hcaptchaResponse)) {
        return res.status(400).json();
    }
    const loginData = await loadlogin();
    if (!loginData[email]) {
        return res.status(409).send({ error: 'No account with that email!' }); 
    }
    const userid = loginData[email].userid;
    const emailpassword = loginData[email].password;
    if (emailpassword !== encryptData(password)) {
        return res.status(408).send({ error: 'Invalid Password' }); 
    }
    const authToken = await generateAuthToken(email, userid, secretKey);
    return res.status(200).json(authToken);
  });


app.post('/api/register', async (req, res) => {
    const { username, password, ip, hcaptchaResponse } = req.body;
    const email = req.body.email?.toLowerCase();
    
    if (!hcaptchaResponse) {
        return res.status(400).json();
    }
    if (!await checkCaptcha(hcaptchaResponse)) {
        return res.status(400).json();
    }
    if (await checkTempmail(email)) {
        return res.status(408).send({ error: 'No TempMails allowed' }); 
    }
    const loginData = await loadlogin();
    if (loginData[email]) {
        return res.status(409).send({ error: 'Email already registered.' }); 
    }
    if (await saveAndCheck(ip)) {
        return res.status(410).send({ error: 'Ip already linked to an account.' }); 
    }
    const country = await IpCountry(ip);
    const userid = await genuserid();
    const login = await loadlogin();
    const encrypted = encryptData(password);
    login[email] = { password: `${encrypted}`, username: username, userid: userid, country: country, registerdate: Date.now(), banned: false, coins: 0, satscashout: 0};
    savelogin(login);
    return res.status(200).send();
});


 
async function userinfo(email) {
    const loginData = await loadlogin();
    const username = loginData[email]?.username;
    const userid = loginData[email]?.userid;
    const coins = loginData[email]?.coins;
    const country = loginData[email]?.country;
    const registerdate = loginData[email]?.registerdate;
    const banned = loginData[email]?.banned;

    if (!username || !userid || !country || !registerdate) {
        console.log("User data is incomplete.");
        return;
    }
    
    const registerday = new Date(registerdate).toLocaleDateString("de-DE");
    return {
        email: email.toLowerCase(),
        username,
        userid,
        coins,
        country,
        registerday,
        banned
    };
}



app.post("/admin", (req, res) => {
    const { password } = req.body;

    if (password === ADMIN_PASSWORD) {
        return res.status(200).send(); 
    } else {
        return res.status(401).json({ error: "Unauthorized" });
    }
});

app.post("/lookup", async (req, res) => {
    try {
        const email = req.body.email?.toLowerCase();
        console.log(email);

        const loginData = loadlogin();
        if (loginData[email]) {
            const data = await userinfo(email);
            return res.json(data);
        } else {
            return res.status(404).json({ error: "User not found" });
        }
    } catch (error) {
        console.error("Fehler beim Verarbeiten der Anfrage:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get('/signup', (req, res) => { 
    res.sendFile(__dirname + '/public/signup.html');
});
app.get('/login', (req, res) => { 
    res.sendFile(__dirname + '/public/login.html');
});
app.get('/app-home', (req, res) => { 
    res.sendFile(__dirname + '/public/app-home.html');
});
app.get('/adminpanel', (req, res) => { 
    res.sendFile(__dirname + '/public/admin.html');
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
