// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const ACC_FILE = path.join(__dirname, 'accounts.json');

// --- Load/save accounts ---
function loadAccounts() {
  try {
    const data = fs.readFileSync(ACC_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function saveAccounts(accs) {
  fs.writeFileSync(ACC_FILE, JSON.stringify(accs, null, 2));
}

// --- Init demo accounts if empty ---
function initDemoAccounts() {
  const accs = loadAccounts();
  if (accs.length === 0) {
    accs.push({
      discordId: '1338922988753518723',
      passwordHash: 'demohash1',
      role: 'Administrator',
      partnerships: 0,
      warnings: 0,
      rate: 0,
      status: 'active',
      inbox: []
    });
    accs.push({
      discordId: '500000000000000001',
      passwordHash: 'demohash2',
      role: 'Opiekun Realizatorów',
      partnerships: 0,
      warnings: 0,
      rate: 0,
      status: 'active',
      inbox: []
    });
    saveAccounts(accs);
    console.log('Demo accounts created');
  }
}

// --- SSE clients ---
let clients = [];

function sendSSE(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach(res => res.write(payload));
}

// --- Routes ---

// GET all accounts
app.get('/api/accounts', (req, res) => {
  res.json(loadAccounts());
});

// POST new account
app.post('/api/accounts', (req, res) => {
  const accs = loadAccounts();
  const newAcc = req.body;
  if (!newAcc.discordId || !newAcc.passwordHash) {
    return res.status(400).json({ error: 'discordId i passwordHash wymagane' });
  }
  if (accs.find(a => a.discordId === newAcc.discordId)) {
    return res.status(409).json({ error: 'Konto już istnieje' });
  }
  accs.push(newAcc);
  saveAccounts(accs);

  sendSSE({ type: 'account-updated', payload: { id: newAcc.discordId } });
  res.status(201).json(newAcc);
});

// PUT update account
app.put('/api/accounts/:id', (req, res) => {
  const id = req.params.id;
  const updates = req.body;
  const accs = loadAccounts();
  const acc = accs.find(a => a.discordId === id);
  if (!acc) return res.status(404).json({ error: 'Nie znaleziono konta' });

  Object.assign(acc, updates);
  saveAccounts(accs);

  sendSSE({ type: 'account-updated', payload: { id } });
  res.json(acc);
});

// SSE endpoint
app.get('/events', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ type:'welcome', payload:'connected'})}\n\n`);

  clients.push(res);
  req.on('close', () => {
    clients = clients.filter(c => c !== res);
  });
});

// --- Start server ---
initDemoAccounts();
app.listen(PORT, () => {
  console.log(`Server działa na porcie ${PORT}`);
});
