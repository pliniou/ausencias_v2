import initSqlJs, { Database as SqlJsDatabase, SqlJsStatic } from 'sql.js';

class Database {
    db: SqlJsDatabase | null;
    SQL: SqlJsStatic | null;

    constructor() {
        this.db = null;
        this.SQL = null;
    }

    async init() {
        if (this.db) return;

        try {
            // Locate WASM file using BASE_URL for proper GitHub Pages support
            // In development: BASE_URL = '/', in production: BASE_URL = '/Project_Ausencias/'
            this.SQL = await initSqlJs({
                locateFile: (file: string) => `${import.meta.env.BASE_URL}${file}`
            });

            // Load saved database from localStorage/IndexedDB if exists
            const savedDb = localStorage.getItem('sqlite_db_dump');
            if (savedDb) {
                const uInt8Array = new Uint8Array(JSON.parse(savedDb));
                this.db = new this.SQL.Database(uInt8Array);
            } else {
                this.db = new this.SQL.Database();
                this.initSchema();
            }


        } catch (error) {
            console.error("Failed to initialize database:", error);
            throw error;
        }
    }

    initSchema() {
        // Create Users table
        this.db?.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT CHECK(role IN ('admin', 'user', 'viewer')) NOT NULL,
                employee_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Check if Admin exists, if not create default
        // Default: admin / admin123 (hashed handled by AuthContext but we insert pre-hashed here for bootstrap is tricky without bcrypt here)
        // We will handle bootstrapping in AuthContext to ensure correct hashing.
    }

    query(sql: string, params: unknown[] = []) {
        if (!this.db) throw new Error("Database not initialized");

        // Prepare statement
        const stmt = this.db.prepare(sql);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        stmt.bind(params as any[]);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const results: any[] = [];
        while (stmt.step()) {
            results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
    }

    run(sql: string, params: unknown[] = []) {
        if (!this.db) throw new Error("Database not initialized");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.db.run(sql, params as any[]);
        this.save();
    }

    // Save current DB state to localStorage (Basic persistence)
    // For large DBs, IndexedDB is better, but for this simpler task localStorage might suffice if small.
    // However, binary in localStorage is inefficient.
    save() {
        if (!this.db) return;
        const data = this.db.export();
        // Convert Uint8Array to Array for JSON storage (inefficient but works for now)
        // Ideally use 'localforage' or raw IndexedDB for binary.
        // Given constraints and ease: JSON stringify Array.
        localStorage.setItem('sqlite_db_dump', JSON.stringify(Array.from(data)));
    }
}

export const db = new Database();
