const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// serwuj wszystkie pliki statyczne z katalogu 'static' (lub głównego)
app.use(express.static(path.join(__dirname))); 

// fallback: dla / zwróć index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Serwer działa na http://localhost:${port}`);
});