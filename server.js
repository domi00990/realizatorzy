const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'accounts.json');

app.use(bodyParser.json());
app.use(express.static(__dirname));

// --- helpers ---
function loadAccounts() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveAccounts(accounts) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(accounts, null, 2));
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// --- API ---

// pobierz wszystkie konta
app.get('/api/accounts', (req, res) => {
  const accounts = loadAccounts();
  res.json(accounts);
});

// rejestracja konta
app.post('/api/register', (req, res) => {
  const { discordId, password } = req.body;
  if (!discordId || !password) return res.status(400).send('Brakuje danych');

  const accounts = loadAccounts();
  if (accounts.find(a => a.discordId === discordId)) return res.status(409).send('Konto już istnieje');

  accounts.push({
    discordId,
    passwordHash: hashPassword(password),
    role: 'user',
    status: 'pending', // każde nowe konto jest pending
    partnerships: 0,
    warnings: 0,
    rate: 0,
    inbox: []
  });

  saveAccounts(accounts);
  res.status(201).send('Zarejestrowano, czekaj na akceptację admina');
});

// logowanie
app.post('/api/login', (req, res) => {
  const { discordId, password } = req.body;
  const accounts = loadAccounts();
  const acc = accounts.find(a => a.discordId === discordId);
  if (!acc) return res.status(404).send('Nie znaleziono konta');
  if (acc.passwordHash !== hashPassword(password)) return res.status(401).send('Błędne hasło');
  if (acc.status !== 'active') return res.status(403).send('Konto nieaktywne');

  res.json({ message: 'Zalogowano', account: acc });
});

// aktualizacja statusu konta (admin)
app.put('/api/accounts/:discordId/status', (req, res) => {
  const { status } = req.body;
  const { discordId } = req.params;
  const accounts = loadAccounts();
  const acc = accounts.find(a => a.discordId === discordId);
  if (!acc) return res.status(404).send('Nie znaleziono konta');

  acc.status = status; // active / suspended / pending
  saveAccounts(accounts);
  res.send('Status zaktualizowany');
});

app.listen(PORT, () => console.log(`Server działa na http://localhost:${PORT}`));
