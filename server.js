// server.js
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;
const ACC_FILE = path.join(__dirname, 'accounts.json');

// --- Storage helpers ---
function loadAccounts() {
  if (!fs.existsSync(ACC_FILE)) return [];
  return JSON.parse(fs.readFileSync(ACC_FILE, 'utf8'));
}
function saveAccounts(accs) {
  fs.writeFileSync(ACC_FILE, JSON.stringify(accs, null, 2));
}

// --- SSE (Server-Sent Events) ---
let clients = [];
function sendSSE(data) {
  clients.forEach(res => res.write(`data: ${JSON.stringify(data)}\n\n`));
}

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());

// --- SSE endpoint ---
app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  res.write('\n');
  clients.push(res);

  req.on('close', () => {
    clients = clients.filter(c => c !== res);
  });
});

// --- Get all accounts ---
app.get('/api/accounts', (req, res) => {
  const accs = loadAccounts();
  res.json(accs);
});

// --- Create new account ---
app.post('/api/accounts', (req, res) => {
  const accs = loadAccounts();
  const { discordId } = req.body;
  if (accs.find(a => a.discordId === discordId)) return res.status(409).json({ error: 'ID exists' });

  accs.push(req.body);
  saveAccounts(accs);

  sendSSE({ type: 'account-updated', payload: { id: discordId } });
  res.status(201).json({ ok: true });
});

// --- Update account by ID ---
app.put('/api/accounts/:id', (req, res) => {
  const id = req.params.id;
  let accs = loadAccounts();
  const idx = accs.findIndex(a => a.discordId === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  accs[idx] = { ...accs[idx], ...req.body };
  saveAccounts(accs);

  sendSSE({ type: 'account-updated', payload: { id } });
  res.json({ ok: true });
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
