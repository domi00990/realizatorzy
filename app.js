const express = require('express');
  sseClients.forEach(res => res.write(`data: ${payload}\n\n`));
}

// Public API
app.get('/api/accounts', (req, res) => {
  const accs = readAccounts();
  // Do not return passwordHash to callers except admin endpoints
  const safe = accs.map(a => ({ discordId: a.discordId, role: a.role, partnerships: a.partnerships, warnings: a.warnings, rate: a.rate, status: a.status, inbox: a.inbox||[] }));
  res.json(safe);
});

// Register
app.post('/api/register', async (req, res) => {
  const { discordId, password, role } = req.body || {};
  if(!discordId || !password || !role) return res.status(400).json({ error: 'missing' });
  const accs = readAccounts();
  if(accs.find(a => a.discordId === discordId)) return res.status(409).json({ error: 'exists' });
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  const newAcc = { id: uuidv4(), discordId, passwordHash: hash, role, partnerships:0, warnings:0, rate:0, status:'pending', inbox:[] };
  accs.push(newAcc);
  writeAccounts(accs);
  res.json({ ok:true, status:'pending' });
});

// Approve (admin action) - simple endpoint; in production add auth
app.post('/api/approve', (req, res) => {
  const { discordId } = req.body || {};
  if(!discordId) return res.status(400).json({ error:'missing' });
  const accs = readAccounts();
  const a = accs.find(x=>x.discordId===discordId);
  if(!a) return res.status(404).json({ error:'notfound' });
  a.status = 'active';
  writeAccounts(accs);
  res.json({ ok:true });
});

// Login
app.post('/api/login', async (req, res) => {
  const { discordId, password } = req.body || {};
  if(!discordId || !password) return res.status(400).json({ error:'missing' });
  const accs = readAccounts();
  const a = accs.find(x=>x.discordId===discordId);
  if(!a) return res.status(404).json({ error:'bad' });
  const ok = await bcrypt.compare(password, a.passwordHash);
  if(!ok) return res.status(401).json({ error:'bad' });
  // respond with minimal safe info
  res.json({ ok:true, status: a.status, role: a.role, discordId: a.discordId });
});

// Send message internal (admin)
app.post('/api/message', (req,res)=>{
  const { to, from, subject, body } = req.body || {};
  if(!to || !subject || !body) return res.status(400).json({ error:'missing' });
  const accs = readAccounts();
  const r = accs.find(x=>x.discordId===to);
  if(!r) return res.status(404).json({ error:'notfound' });
  r.inbox = r.inbox || [];
  r.inbox.unshift({ from: from || 'system', subject, body, time: new Date().toISOString(), read:false });
  writeAccounts(accs);
  res.json({ ok:true });
});

// SSE events
app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  res.write('\n');
  sseClients.push(res);
  req.on('close', ()=>{ sseClients = sseClients.filter(r=>r!==res); });
});

// Optional: static serve public folder
app.use('/', express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log('API listening on', PORT));
