// backend/server.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'super-secret-key',
        resave: false,
        saveUninitialized: false,
        cookie: { httpOnly: true, secure: false, sameSite: 'lax' },
    })
);

// Initialise SQLite DB (file stored in ./data/ausencias.db)
const dbPath = path.resolve(__dirname, '../data/ausencias.db');
const db = new Database(dbPath);

// Simple schema creation (run once)
const initSchema = () => {
    db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      department TEXT,
      position TEXT
    );
    CREATE TABLE IF NOT EXISTS leaves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER,
      type TEXT,
      start_date TEXT,
      end_date TEXT,
      FOREIGN KEY(employee_id) REFERENCES employees(id)
    );
    -- Add other tables (holidays, events, departments, etc.) as needed
  `);
};
initSchema();

// Helper to protect routes
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (req.session && req.session.user) {
        return next();
    }
    res.status(401).json({ message: 'Unauthorized' });
};

// Auth routes
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username);
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    // bcryptjs is already a dependency in the frontend; we use it here as well
    const bcrypt = require('bcryptjs');
    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    // Store minimal user info in session
    (req.session as any).user = { id: user.id, username: user.username, role: user.role };
    res.json({ message: 'Logged in', user: (req.session as any).user });
});

app.post('/api/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ message: 'Logged out' });
    });
});

app.get('/api/me', requireAuth, (req, res) => {
    res.json({ user: (req.session as any).user });
});

// Example CRUD for employees
app.get('/api/employees', requireAuth, (req, res) => {
    const rows = db.prepare('SELECT * FROM employees').all();
    res.json(rows);
});

app.post('/api/employees', requireAuth, (req, res) => {
    const { name, department, position } = req.body;
    const stmt = db.prepare('INSERT INTO employees (name, department, position) VALUES (?, ?, ?)');
    const info = stmt.run(name, department, position);
    res.json({ id: info.lastInsertRowid, name, department, position });
});

app.put('/api/employees/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const { name, department, position } = req.body;
    const stmt = db.prepare('UPDATE employees SET name = ?, department = ?, position = ? WHERE id = ?');
    stmt.run(name, department, position, id);
    res.json({ id, name, department, position });
});

app.delete('/api/employees/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM employees WHERE id = ?');
    stmt.run(id);
    res.json({ deletedId: id });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Central backup endpoint
app.get('/api/backup', requireAuth, (req, res) => {
    try {
        const fs = require('fs');
        const backupData = fs.readFileSync(dbPath);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', 'attachment; filename="ausencias_backup.sqlite"');
        res.send(backupData);
    } catch (error) {
        console.error('Backup error:', error);
        res.status(500).json({ message: 'Backup failed' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
