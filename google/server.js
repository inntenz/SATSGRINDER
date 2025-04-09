const express = require("express");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
require("dotenv").config();
const cors = require("cors");

const app = express();

const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

app.set('trust proxy', true); 

app.use(bodyParser.json());

const CLIENT_ID = "261549906027-378s3in6k79ua7o5ft1bkhq7mavesplf.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REDIRECT_URI = "http://localhost:3000/auth/callback";
const JWT_SECRET = "your_jwt_secret"; // Ersetze durch einen starken geheimen Schlüssel










//const express = require('express');
//const axios = require('axios');
//const jwt = require('jsonwebtoken');
//const bodyParser = require('body-parser');
//const app = express();
app.use(bodyParser.json());

//const CLIENT_ID = '261549906027-378s3in6k79ua7o5ft1bkhq7mavesplf.apps.googleusercontent.com';
//const CLIENT_SECRET = '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';
//const JWT_SECRET = 'your_jwt_secret'; // Ersetze durch einen starken geheimen Schlüssel

app.post('/auth/google', async (req, res) => {
  const { id_token } = req.body;

  try {
    // Überprüfe das ID-Token bei Google
    const response = await axios.post(`https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`);
    const user = response.data;

    // Erstelle ein eigenes JWT, um den Benutzer zu authentifizieren
    const jwtToken = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    // Sende das JWT und das Refresh-Token zurück
    res.json({
      accessToken: jwtToken,
      refreshToken,
      user: {
        email: user.email,
        name: user.name,
      }
    });
  } catch (error) {
    console.error('Fehler bei der Token-Überprüfung:', error);
    res.status(500).send('Error authenticating user');
  }
});

//app.listen(3000, () => {

  //console.log('Server läuft auf http://localhost:3000');
//});










app.get("/auth/url", (req, res) => {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=openid%20email%20profile`;
    res.json({ url: authUrl });
});

app.get("/auth/callback", async (req, res) => {
    const { code } = req.query;

    try {
        const tokenResponse = await axios.post("https://oauth2.googleapis.com/token", {
            code,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            grant_type: "authorization_code",
        });

        const { id_token, access_token, refresh_token } = tokenResponse.data;
        const user = jwt.decode(id_token);

        const jwtToken = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: "1h" });
        const refreshToken = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: "7d" });

        res.json({
            accessToken: jwtToken,
            refreshToken,
            user: {
                email: user.email,
                name: user.name,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to authenticate with Google" });
    }
});

app.get("/", (res, req) => {
    res.sendFile("/index.html");
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
