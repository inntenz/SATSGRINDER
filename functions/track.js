const fs = require('fs');
const path = require('path');
const geoip = require('geoip-lite');

const dataFile = path.resolve(__dirname, 'data.json');

// Lese oder initialisiere die Daten
let data = {};
if (fs.existsSync(dataFile)) {
  data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
} else {
  data = { total: 0, countries: {} };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const ip = event.headers['x-nf-client-connection-ip'] || '0.0.0.0';
  const geo = geoip.lookup(ip);
  const country = geo?.country || 'Unknown';

  // Aktualisiere die Daten
  data.total += 1;
  data.countries[country] = (data.countries[country] || 0) + 1;

  // Speichere die Daten
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));

  return { statusCode: 200, body: JSON.stringify({ message: 'Visitor tracked' }) };
};
