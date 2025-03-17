const jwt = require('jsonwebtoken');

function genuserid() { 
    const randomNumbers = Array.from({ length: 5 }, () =>
        Math.floor(Math.random() * 10) 
    ).join('');

    
    const timestamp = Date.now();    
    return randomNumbers + timestamp;
}


function generateAuthToken(email, secretKey) {

    const result = genuserid();
    console.log(result);


    const payload = {
        email: email,
        userId: result,
        createdAt: new Date().toISOString(),
    };

    const token = jwt.sign(payload, secretKey, { algorithm: 'HS256' });

    return token;
}

const email = "example@example.com";
const secretKey = "secretzAo5mUu6oQvgnnrBuSVgq81ukUUzn-B461FCWhc-3rNLIpq5VW95fGoY-npw-NuoR5IZpp4ComrWTqyWC5p6-d4GQDTLK-WL_k2q";
const authToken = generateAuthToken(email, secretKey);
console.log("Generated Auth Token:", authToken);

function decodeAuthToken(token, secretKey) {
    try {
        const decoded = jwt.verify(token, secretKey);
        return decoded;
    } catch (err) {
        console.error("Invalid Token:", err.message);
        return null;
    }
}

const decodedData = decodeAuthToken(authToken, secretKey);
console.log("Decoded Data:", decodedData);

