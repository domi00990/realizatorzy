// --- Baza danych w localStorage ---
function loadDB() {
  return JSON.parse(localStorage.getItem('db')) || {
    accounts: [],
    tasks: [],
    logs: [],
    settings: { theme: "auto", useServer: false, serverURL: "http://localhost:3001" }
  };
}

function saveDB(db) {
  localStorage.setItem('db', JSON.stringify(db));
}

// --- Konta użytkowników ---
function addAccount(account) {
  const db = loadDB();
  db.accounts.push(account);
  saveDB(db);
}

function getAccount(discordId) {
  const db = loadDB();
  return db.accounts.find(a => a.discordId === discordId);
}

function updateAccount(discordId, updates) {
  const db = loadDB();
  const acc = db.accounts.find(a => a.discordId === discordId);
  if (!acc) return false;
  Object.assign(acc, updates);
  saveDB(db);
  return true;
}

function deleteAccount(discordId) {
  const db = loadDB();
  db.accounts = db.accounts.filter(a => a.discordId !== discordId);
  saveDB(db);
}

// --- Zadania ---
function addTask(task) {
  const db = loadDB();
  db.tasks.push(task);
  saveDB(db);
}

function getTasks(discordId) {
  const db = loadDB();
  return db.tasks.filter(t => t.assignedTo === discordId);
}

function updateTask(taskId, updates) {
  const db = loadDB();
  const task = db.tasks.find(t => t.id === taskId);
  if (!task) return false;
  Object.assign(task, updates);
  saveDB(db);
  return true;
}

// --- Logi ---
function pushLog(action, actor, target, details) {
  const db = loadDB();
  db.logs.unshift({ time: new Date().toISOString(), action, actor, target, details });
  saveDB(db);
}

// --- Ustawienia ---
function getSettings() {
  return loadDB().settings;
}

function updateSettings(updates) {
  const db = loadDB();
  Object.assign(db.settings, updates);
  saveDB(db);
}
