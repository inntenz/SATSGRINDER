const express = require('express');
const path = require('path');
const app = express();
const port = 3000;


app.use(express.json());
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
