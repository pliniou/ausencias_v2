// backend/server.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

// sql.js types
interface QueryExecResult {
    columns: string[];
    values: any[][];
}

interface SqlJsDatabase {
    run(sql: string, params?: any[]): void;
    exec(sql: string, params?: any[]): QueryExecResult[];
    export(): Uint8Array;
    close(): void;
}

interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | Buffer | null) => SqlJsDatabase;
}

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

// DB path
const dbPath = path.resolve(__dirname, '../data/ausencias.db');

let db: SqlJsDatabase;

// Persist DB to disk
function saveDb() {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
}

// Initialize database
async function initDb() {
    // @ts-ignore - sql.js has no type declarations, using inline types above
    const initSqlJs: (config?: { locateFile?: (file: string) => string }) => Promise<SqlJsStatic> = (await import('sql.js')).default;
    const SQL = await initSqlJs();

    // Ensure data directory exists
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    // Load existing DB or create new one
    if (fs.existsSync(dbPath)) {
        const buffer = fs.readFileSync(dbPath);
        db = new SQL.Database(buffer);
    } else {
        db = new SQL.Database();
    }

    // Create schema
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL
        );
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            department TEXT,
            position TEXT
        );
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS leaves (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER,
            type TEXT,
            start_date TEXT,
            end_date TEXT,
            FOREIGN KEY(employee_id) REFERENCES employees(id)
        );
    `);

    // Seed admin user if not exists
    const existing = db.exec("SELECT id FROM users WHERE username = 'admin'");
    if (existing.length === 0 || existing[0].values.length === 0) {
        const hash = bcrypt.hashSync('demo123', 10);
        db.run("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", ['admin', hash, 'admin']);
    }

    saveDb();
}

// Helper to protect routes
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (req.session && (req.session as any).user) {
        return next();
    }
    res.status(401).json({ message: 'Unauthorized' });
};

// Auth routes
app.post('/api/login', (req: Request, res: Response) => {
    const { username, password } = req.body;
    const result = db.exec("SELECT id, username, password_hash, role FROM users WHERE username = '" + username.replace(/'/g, "''") + "'");
    if (result.length === 0 || result[0].values.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    const row = result[0].values[0];
    const user = { id: row[0], username: row[1], password_hash: row[2] as string, role: row[3] };
    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    (req.session as any).user = { id: user.id, username: user.username, role: user.role };
    res.json({ message: 'Logged in', user: (req.session as any).user });
});

app.post('/api/logout', (req: Request, res: Response) => {
    req.session.destroy(() => {
        res.json({ message: 'Logged out' });
    });
});

app.get('/api/me', requireAuth, (req: Request, res: Response) => {
    res.json({ user: (req.session as any).user });
});

// Employee CRUD
app.get('/api/employees', requireAuth, (req: Request, res: Response) => {
    const result = db.exec('SELECT id, name, department, position FROM employees');
    const rows = result.length > 0 ? result[0].values.map((r: any[]) => ({ id: r[0], name: r[1], department: r[2], position: r[3] })) : [];
    res.json(rows);
});

app.post('/api/employees', requireAuth, (req: Request, res: Response) => {
    const { name, department, position } = req.body;
    db.run('INSERT INTO employees (name, department, position) VALUES (?, ?, ?)', [name, department, position]);
    saveDb();
    const lastIdResult = db.exec('SELECT last_insert_rowid()');
    const lastId = lastIdResult[0].values[0][0];
    res.json({ id: lastId, name, department, position });
});

app.put('/api/employees/:id', requireAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, department, position } = req.body;
    db.run('UPDATE employees SET name = ?, department = ?, position = ? WHERE id = ?', [name, department, position, parseInt(id)]);
    saveDb();
    res.json({ id: parseInt(id), name, department, position });
});

app.delete('/api/employees/:id', requireAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    db.run('DELETE FROM employees WHERE id = ?', [parseInt(id)]);
    saveDb();
    res.json({ deletedId: parseInt(id) });
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok' });
});

// Central backup endpoint
app.get('/api/backup', requireAuth, (req: Request, res: Response) => {
    try {
        saveDb(); // Ensure latest data is on disk
        const backupData = fs.readFileSync(dbPath);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', 'attachment; filename="ausencias_backup.sqlite"');
        res.send(backupData);
    } catch (error) {
        console.error('Backup error:', error);
        res.status(500).json({ message: 'Backup failed' });
    }
});

// Start server after DB init
initDb().then(() => {
    app.listen(PORT, () => {
        console.log(`Backend server running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});
