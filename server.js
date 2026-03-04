const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'accounts.json');

app.use(bodyParser.json());
app.use(express.static(__dirname)); // serwowanie index.html i JS/CSS

// --- helpers ---
function loadAccounts() {
  if (!fs.existsSync(DATA_FILE)) return [];
  const raw = fs.readFileSync(DATA_FILE);
  return JSON.parse(raw);
}

function saveAccounts(accounts) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(accounts, null, 2));
}

async function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// --- API ---

// pobierz wszystkie konta
app.get('/api/accounts', (req, res) => {
  const accounts = loadAccounts();
  res.json(accounts);
});

// dodaj nowe konto
app.post('/api/accounts', async (req, res) => {
  const { discordId, passwordHash, role, status } = req.body;
  if (!discordId || !passwordHash || !role) return res.status(400).send('Brakuje danych');
  const accounts = loadAccounts();
  if (accounts.find(a => a.discordId === discordId)) return res.status(409).send('Konto już istnieje');
  accounts.push({ discordId, passwordHash, role, status: status || 'pending', partnerships: 0, warnings: 0, rate: 0, inbox: [] });
  saveAccounts(accounts);
  res.status(201).send('Dodano konto');
});

// aktualizuj konto
app.put('/api/accounts/:id', async (req, res) => {
  const id = req.params.id;
  const updates = req.body;
  const accounts = loadAccounts();
  const acc = accounts.find(a => a.discordId === id);
  if (!acc) return res.status(404).send('Nie znaleziono konta');

  // aktualizacja pól
  if (updates.passwordHash) acc.passwordHash = updates.passwordHash;
  if (updates.role) acc.role = updates.role;
  if (updates.status) acc.status = updates.status;
  if (updates.partnerships !== undefined) acc.partnerships = updates.partnerships;
  if (updates.warnings !== undefined) acc.warnings = updates.warnings;
  if (updates.rate !== undefined) acc.rate = updates.rate;

  saveAccounts(accounts);
  res.send('Zaktualizowano konto');
});

// --- start serwera ---
app.listen(PORT, () => console.log(`Server działa na http://localhost:${PORT}`));
