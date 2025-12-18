// backend/server.js
// Express API + SQLite (better-sqlite3) + JWT auth + Twilio SMS
// Usage:
// 1) npm install
// 2) cp .env.example .env  (remplir les variables)
// 3) npm start
//
// Serves API at /api/* and static files from ../public if present

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Twilio = require('twilio');

const DB_FILE = path.join(__dirname, 'apee.db');
const INIT_SQL = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');

const app = express();
app.use(cors());
app.use(express.json());

const db = new Database(DB_FILE);
db.exec('PRAGMA foreign_keys = ON;');
db.exec(INIT_SQL);

// JWT Secret Check
if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'dev-secret-change')) {
    console.error('FATAL ERROR: JWT_SECRET is not defined or is too weak in production.');
    process.exit(1);
}

// Twilio client (if configured)
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

// Helpers
function signToken(user) {
  const payload = { id: user.id, username: user.username, role: user.role || 'admin' };
  return jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret-change', { expiresIn: '8h' });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token manquant' });
  jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change', (err, user) => {
    if (err) return res.status(403).json({ error: 'Token invalide' });
    req.user = user;
    next();
  });
}

// AUTH: login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username et password requis' });
  try {
    const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!row) return res.status(401).json({ error: 'Utilisateur introuvable' });
    const match = bcrypt.compareSync(password, row.password_hash);
    if (!match) return res.status(401).json({ error: 'Mot de passe incorrect' });
    const token = signToken({ id: row.id, username: row.username, role: row.role });
    res.json({ token, user: { id: row.id, username: row.username, role: row.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Optionnel: endpoint pour créer un utilisateur (à protéger en prod)
app.post('/api/auth/register', authenticateToken, (req, res) => {
  // seulement admin peut créer (exemple)
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { username, password, role } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username et password requis' });
  const hash = bcrypt.hashSync(password, 10);
  try {
    const info = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run(username, hash, role || 'admin');
    const user = db.prepare('SELECT id, username, role, created_at FROM users WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve static public if exists
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
if (fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR));
  app.get('/', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));
}

// Payments helper (same as earlier, but protected where needed)
function getPaymentWithDetails(paymentRow) {
  const parent = db.prepare('SELECT * FROM parents WHERE id = ?').get(paymentRow.parent_id);
  const studentRows = db.prepare(
    `SELECT s.* FROM students s
     JOIN payment_students ps ON ps.student_id = s.id
     WHERE ps.payment_id = ?`
  ).all(paymentRow.id);
  return {
    ...paymentRow,
    parent,
    eleves: studentRows
  };
}

// Public read endpoints (no auth needed to view)
app.get('/api/paiements', (req, res) => {
  const payments = db.prepare('SELECT * FROM payments ORDER BY date_paiement DESC, created_at DESC').all();
  res.json(payments.map(p => getPaymentWithDetails(p)));
});

// Create payment -> PROTECTED
app.post('/api/paiements', authenticateToken, (req, res) => {
  const payload = req.body;
  if (!payload) return res.status(400).json({ error: 'payload manquant' });
  const trx = db.transaction((payload) => {
    let parentId = null;
    if (payload.parent && payload.parent.id) {
      parentId = payload.parent.id;
    } else if (payload.parent && payload.parent.telephone) {
      const existing = db.prepare('SELECT * FROM parents WHERE telephone = ?').get(payload.parent.telephone);
      if (existing) parentId = existing.id;
      else {
        const infoP = db.prepare('INSERT INTO parents (nom, telephone, adresse) VALUES (?, ?, ?)').run(payload.parent.nom, payload.parent.telephone, payload.parent.adresse || null);
        parentId = infoP.lastInsertRowid;
      }
    } else {
      throw new Error('Parent requis');
    }
    const infoPay = db.prepare(
      'INSERT INTO payments (parent_id, montant_total, montant_verse, reste, observations, date_paiement) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(parentId, payload.montantTotal || 0, payload.montantVerse || 0, payload.reste || 0, payload.observations || null, payload.datePaiement || new Date().toISOString().slice(0,10));
    const paymentId = infoPay.lastInsertRowid;
    if (Array.isArray(payload.eleves)) {
      payload.eleves.forEach(e => {
        let studentId = e.id || null;
        if (!studentId) {
          const infoS = db.prepare('INSERT INTO students (parent_id, nom, classe) VALUES (?, ?, ?)').run(parentId, e.nom, e.classe || null);
          studentId = infoS.lastInsertRowid;
        } else {
          db.prepare('UPDATE students SET parent_id = ? WHERE id = ?').run(parentId, studentId);
        }
        db.prepare('INSERT INTO payment_students (payment_id, student_id) VALUES (?, ?)').run(paymentId, studentId);
      });
    }
    return paymentId;
  });
  try {
    const rid = trx(payload);
    const paymentRow = db.prepare('SELECT * FROM payments WHERE id = ?').get(rid);
    res.status(201).json(getPaymentWithDetails(paymentRow));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update & delete -> PROTECTED
app.put('/api/paiements/:id', authenticateToken, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const p = req.body;
  db.prepare('UPDATE payments SET montant_total = ?, montant_verse = ?, reste = ?, observations = ?, date_paiement = ? WHERE id = ?')
    .run(p.montantTotal || 0, p.montantVerse || 0, p.reste || 0, p.observations || null, p.datePaiement || new Date().toISOString().slice(0,10), id);
  const paymentRow = db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
  res.json(getPaymentWithDetails(paymentRow));
});

app.delete('/api/paiements/:id', authenticateToken, (req, res) => {
  const id = parseInt(req.params.id, 10);
  db.prepare('DELETE FROM payments WHERE id = ?').run(id);
  res.status(204).send();
});

// Export/Import (protected)
app.get('/api/export', authenticateToken, (req, res) => {
  const parents = db.prepare('SELECT * FROM parents').all();
  const students = db.prepare('SELECT * FROM students').all();
  const payments = db.prepare('SELECT * FROM payments').all();
  const payment_students = db.prepare('SELECT * FROM payment_students').all();
  res.json({ parents, students, payments, payment_students });
});

app.post('/api/import', authenticateToken, (req, res) => {
  const data = req.body;
  if (!data) return res.status(400).json({ error: 'Missing import data' });
  const trx = db.transaction((d) => {
    db.prepare('DELETE FROM payment_students').run();
    db.prepare('DELETE FROM payments').run();
    db.prepare('DELETE FROM students').run();
    db.prepare('DELETE FROM parents').run();
    if (Array.isArray(d.parents)) {
      const stmtP = db.prepare('INSERT INTO parents (id, nom, telephone, adresse, created_at) VALUES (?, ?, ?, ?, ?)');
      d.parents.forEach(p => stmtP.run(p.id || null, p.nom, p.telephone, p.adresse || null, p.created_at || null));
    }
    if (Array.isArray(d.students)) {
      const stmtS = db.prepare('INSERT INTO students (id, parent_id, nom, classe, created_at) VALUES (?, ?, ?, ?, ?)');
      d.students.forEach(s => stmtS.run(s.id || null, s.parent_id || null, s.nom, s.classe || null, s.created_at || null));
    }
    if (Array.isArray(d.payments)) {
      const stmtPay = db.prepare('INSERT INTO payments (id, parent_id, montant_total, montant_verse, reste, observations, date_paiement, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      d.payments.forEach(p => stmtPay.run(p.id || null, p.parent_id || null, p.montant_total || 0, p.montant_verse || 0, p.reste || 0, p.observations || null, p.date_paiement || null, p.created_at || null));
    }
    if (Array.isArray(d.payment_students)) {
      const stmtPS = db.prepare('INSERT INTO payment_students (id, payment_id, student_id) VALUES (?, ?, ?)');
      d.payment_students.forEach(ps => stmtPS.run(ps.id || null, ps.payment_id || null, ps.student_id || null));
    }
  });
  try {
    trx(data);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SEND SMS endpoint (protected)
app.post('/api/send-sms', authenticateToken, async (req, res) => {
  if (!twilioClient) return res.status(500).json({ error: 'Twilio non configuré' });
  const { to, body } = req.body || {};
  if (!to || !body) return res.status(400).json({ error: 'to et body requis' });
  try {
    const msg = await twilioClient.messages.create({
      body,
      from: process.env.TWILIO_FROM_NUMBER,
      to
    });
    res.json({ sid: msg.sid, status: msg.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API serveur démarré sur http://localhost:${PORT} (static served: ${fs.existsSync(PUBLIC_DIR)})`);
});
