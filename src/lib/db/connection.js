import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import * as schema from './schema.js';

let db = null;
let sqliteDb = null;

function getDatabase() {
    if (!db) {
        // Ensure data directory exists
        const dataDir = 'data';
        if (!existsSync(dataDir)) {
            mkdirSync(dataDir, { recursive: true });
        }

        // Create better-sqlite3 connection
        sqliteDb = new Database('data/database.sqlite');
        sqliteDb.pragma('journal_mode = WAL');
        sqliteDb.pragma('foreign_keys = ON');

        // Create Drizzle instance
        db = drizzle(sqliteDb, { schema });
    }
    return db;
}

export { getDatabase };