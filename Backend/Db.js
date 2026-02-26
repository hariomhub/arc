const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
require('dotenv').config();

// ─── DB Path ─────────────────────────────────────────────────────────────────
// Priority: SQLITE_DB_PATH env var → default based on environment
const isProd = process.env.NODE_ENV === 'production';
const dbPath = process.env.SQLITE_DB_PATH
    ? path.resolve(process.env.SQLITE_DB_PATH)
    : (isProd
        ? '/home/site/database.sqlite'
        : path.resolve(__dirname, 'database.sqlite'));

console.log(`[DB] Using database at: ${dbPath}`);

let dbPromise = null;

async function getDb() {
    if (!dbPromise) {
        dbPromise = open({
            filename: dbPath,
            driver: sqlite3.Database
        }).then(db => {
            console.log('[DB] Connected to SQLite database.');
            db.run('PRAGMA foreign_keys = ON');
            db.run('PRAGMA journal_mode = WAL'); // Better concurrent read performance
            return db;
        }).catch(err => {
            console.error('[DB] FATAL: Cannot open SQLite database:', err.message);
            dbPromise = null; // Allow retry on next request
            throw err;
        });
    }
    return dbPromise;
}

// ─── MySQL2-compatible pool polyfill ─────────────────────────────────────────
// All routes use db.query(sql, params) expecting [rows/result, fields] tuples.
const pool = {
    query: async (sql, params) => {
        const db = await getDb();

        const trimmed = sql.trim().toUpperCase();

        if (trimmed.startsWith('SHOW')) {
            return [[], []];
        }

        if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA')) {
            const rows = await db.all(sql, params);
            return [rows, []];
        } else {
            const result = await db.run(sql, params);
            return [
                { insertId: result.lastID, affectedRows: result.changes },
                []
            ];
        }
    },

    execute: async function (sql, params) {
        return this.query(sql, params);
    },

    getConnection: async () => {
        const db = await getDb();
        return {
            query:   async (sql, params) => pool.query(sql, params),
            execute: async (sql, params) => pool.execute(sql, params),
            release: () => {} // no-op for SQLite
        };
    },

    end: async () => {
        if (dbPromise) {
            const db = await dbPromise;
            await db.close();
            dbPromise = null;
        }
    }
};

module.exports = pool;