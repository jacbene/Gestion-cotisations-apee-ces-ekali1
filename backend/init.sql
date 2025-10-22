-- init.sql
-- Schéma pour APEE CES d'EKALI 1 (SQLite)
PRAGMA foreign_keys = ON;

-- Table parents
CREATE TABLE IF NOT EXISTS parents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  telephone TEXT NOT NULL UNIQUE,
  adresse TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Table élèves (students)
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER,
  nom TEXT NOT NULL,
  classe TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
);

-- Table paiements
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER NOT NULL,
  montant_total INTEGER NOT NULL,
  montant_verse INTEGER NOT NULL,
  reste INTEGER NOT NULL,
  observations TEXT,
  date_paiement TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
);

-- Lien paiement <-> élèves
CREATE TABLE IF NOT EXISTS payment_students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Table users (administrateurs)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_parents_telephone ON parents(telephone);
CREATE INDEX IF NOT EXISTS idx_students_parent ON students(parent_id);
CREATE INDEX IF NOT EXISTS idx_payments_parent ON payments(parent_id);

-- Exemple de données (optionnel)
INSERT OR IGNORE INTO parents (id, nom, telephone, adresse) VALUES (1, 'Jean Dupont', '+237650000000', 'Quartier A');
INSERT OR IGNORE INTO students (id, parent_id, nom, classe) VALUES (1, 1, 'Alice Dupont', '6ème A');
INSERT OR IGNORE INTO payments (id, parent_id, montant_total, montant_verse, reste, observations, date_paiement) 
  VALUES (1, 1, 12500, 12500, 0, 'Paiement complet', '2025-10-01');
INSERT OR IGNORE INTO payment_students (id, payment_id, student_id) VALUES (1, 1, 1);

-- Exemple user (username: admin, password: changeme) -> password_hash must be created with bcrypt in production
INSERT OR IGNORE INTO users (id, username, password_hash) VALUES (1, 'admin', '$2b$10$Z9qj2y1pYlQe1xQe9bXK9e6d1K8U0q6f3Jf8J9k2pQ9gI1YdF8KQe');