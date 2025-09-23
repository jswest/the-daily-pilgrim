import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
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

function getRawDatabase() {
    if (!sqliteDb) {
        getDatabase(); // Initialize if not already done
    }
    return sqliteDb;
}

async function initializeDatabase() {
    const drizzleDb = getDatabase();

    // Check if database is already initialized by looking for the editions table
    try {
        const rawDb = getRawDatabase();
        const result = rawDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='editions'").get();
        if (result) {
            console.log('Database already initialized');
            return;
        }
    } catch (error) {
        // Database doesn't exist or is empty, continue with initialization
    }

    try {
        // For development, we'll push the schema directly instead of using migrations
        // This is equivalent to the previous SQL execution but using Drizzle
        console.log('Initializing database schema...');

        // Create all tables by executing the schema
        const rawDb = getRawDatabase();

        // Create tables in dependency order
        const createStatements = [
            // Authors table (no dependencies)
            `CREATE TABLE IF NOT EXISTS authors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                bio TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )`,

            // Images table (no dependencies)
            `CREATE TABLE IF NOT EXISTS images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                original_path TEXT NOT NULL,
                processed_path TEXT,
                caption TEXT,
                image_type TEXT CHECK(image_type IN ('background', 'title', 'inline')) NOT NULL,
                width INTEGER,
                height INTEGER,
                is_processed INTEGER DEFAULT 0,
                processing_status TEXT CHECK(processing_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
                processing_started_at TEXT,
                processing_completed_at TEXT,
                processing_error TEXT,
                processing_attempts INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )`,

            // Articles table (depends on images)
            `CREATE TABLE IF NOT EXISTS articles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                hed TEXT NOT NULL,
                dek TEXT,
                body TEXT NOT NULL,
                title_image_id INTEGER REFERENCES images(id),
                order_in_edition INTEGER,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )`,

            // Poems table (no dependencies)
            `CREATE TABLE IF NOT EXISTS poems (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                body TEXT NOT NULL,
                order_in_edition INTEGER,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )`,

            // Editions table (depends on images)
            `CREATE TABLE IF NOT EXISTS editions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                issue_number INTEGER NOT NULL UNIQUE,
                published_at TEXT NOT NULL,
                cover_image_id INTEGER REFERENCES images(id),
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )`,

            // Junction tables
            `CREATE TABLE IF NOT EXISTS article_authors (
                article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
                author_id INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
                order_position INTEGER NOT NULL,
                PRIMARY KEY (article_id, author_id)
            )`,

            `CREATE TABLE IF NOT EXISTS poem_authors (
                poem_id INTEGER NOT NULL REFERENCES poems(id) ON DELETE CASCADE,
                author_id INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
                order_position INTEGER NOT NULL,
                PRIMARY KEY (poem_id, author_id)
            )`,

            `CREATE TABLE IF NOT EXISTS image_authors (
                image_id INTEGER NOT NULL REFERENCES images(id) ON DELETE CASCADE,
                author_id INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
                role TEXT CHECK(role IN ('photographer', 'artist', 'creator')) DEFAULT 'photographer',
                PRIMARY KEY (image_id, author_id)
            )`,

            `CREATE TABLE IF NOT EXISTS edition_articles (
                edition_id INTEGER NOT NULL REFERENCES editions(id) ON DELETE CASCADE,
                article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
                order_position INTEGER NOT NULL,
                PRIMARY KEY (edition_id, article_id)
            )`,

            `CREATE TABLE IF NOT EXISTS edition_poems (
                edition_id INTEGER NOT NULL REFERENCES editions(id) ON DELETE CASCADE,
                poem_id INTEGER NOT NULL REFERENCES poems(id) ON DELETE CASCADE,
                order_position INTEGER NOT NULL,
                PRIMARY KEY (edition_id, poem_id)
            )`,

            `CREATE TABLE IF NOT EXISTS edition_images (
                edition_id INTEGER NOT NULL REFERENCES editions(id) ON DELETE CASCADE,
                image_id INTEGER NOT NULL REFERENCES images(id) ON DELETE CASCADE,
                usage_type TEXT CHECK(usage_type IN ('cover', 'content', 'background')) NOT NULL,
                order_position INTEGER,
                PRIMARY KEY (edition_id, image_id)
            )`
        ];

        // Create indexes
        const indexStatements = [
            'CREATE INDEX IF NOT EXISTS idx_editions_issue_number ON editions(issue_number)',
            'CREATE INDEX IF NOT EXISTS idx_editions_published_at ON editions(published_at)',
            'CREATE INDEX IF NOT EXISTS idx_articles_order ON articles(order_in_edition)',
            'CREATE INDEX IF NOT EXISTS idx_poems_order ON poems(order_in_edition)',
            'CREATE INDEX IF NOT EXISTS idx_images_type ON images(image_type)',
            'CREATE INDEX IF NOT EXISTS idx_images_processed ON images(is_processed)',
            'CREATE INDEX IF NOT EXISTS idx_images_processing_status ON images(processing_status)',
            'CREATE INDEX IF NOT EXISTS idx_images_processing_queue ON images(processing_status, processing_attempts, created_at)',
            'CREATE INDEX IF NOT EXISTS idx_edition_articles_order ON edition_articles(edition_id, order_position)',
            'CREATE INDEX IF NOT EXISTS idx_edition_poems_order ON edition_poems(edition_id, order_position)',
            'CREATE INDEX IF NOT EXISTS idx_edition_images_order ON edition_images(edition_id, order_position)',
            'CREATE INDEX IF NOT EXISTS idx_authors_name ON authors(name)',
            'CREATE INDEX IF NOT EXISTS idx_article_authors_order ON article_authors(article_id, order_position)',
            'CREATE INDEX IF NOT EXISTS idx_poem_authors_order ON poem_authors(poem_id, order_position)',
            'CREATE INDEX IF NOT EXISTS idx_image_authors_role ON image_authors(image_id, role)'
        ];

        // Execute table creation statements
        for (const statement of createStatements) {
            rawDb.exec(statement);
        }

        // Execute index creation statements
        for (const statement of indexStatements) {
            try {
                rawDb.exec(statement);
            } catch (error) {
                // Ignore "already exists" errors for indexes
                if (!error.message.includes('already exists')) {
                    throw error;
                }
            }
        }

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

export { getDatabase, getRawDatabase, initializeDatabase };