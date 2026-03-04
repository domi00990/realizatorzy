const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'accounts.json');

app.use(cors());
app.use(bodyParser.json());

// helper to read/write JSON
function readAccounts() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function writeAccounts(accs) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(accs, null, 2));
}

// GET all accounts
app.get('/api/accounts', (req, res) => {
  const accounts = readAccounts();
  res.json(accounts);
});

// POST new account
app.post('/api/accounts', (req, res) => {
  const newAcc = req.body;
  const accounts = readAccounts();
  if (accounts.find(a => a.discordId === newAcc.discordId)) {
    return res.status(409).json({ error: 'Konto już istnieje' });
  }
  accounts.push(newAcc);
  writeAccounts(accounts);
  res.status(201).json({ message: 'Konto dodane' });
});

// PUT update account by ID
app.put('/api/accounts/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const accounts = readAccounts();
  const idx = accounts.findIndex(a => a.discordId === id);
  if (idx === -1) return res.status(404).json({ error: 'Nie znaleziono konta' });
  accounts[idx] = { ...accounts[idx], ...updates };
  writeAccounts(accounts);
  res.json({ message: 'Konto zaktualizowane' });
});

app.listen(PORT, () => console.log(`Serwer działa na http://localhost:${PORT}`));
