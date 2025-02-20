const fs = require('fs');
const path = require('path');

const dataFile = path.resolve(__dirname, 'data.json');

exports.handler = async () => {
  if (!fs.existsSync(dataFile)) {
    return { statusCode: 200, body: JSON.stringify({ total: 0, countries: {} }) };
  }

  const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
  return { statusCode: 200, body: JSON.stringify(data) };
};
