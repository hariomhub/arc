/**
 * Fix migration: Add missing columns to playbooks table
 * Run once with: node fix_playbooks_migration.js
 */
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const dbPath = process.env.SQLITE_DB_PATH || path.resolve(__dirname, 'database.sqlite');

async function run() {
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    console.log('Connected to:', dbPath);

    const columns = await db.all('PRAGMA table_info(playbooks)');
    const existing = columns.map(c => c.name);
    console.log('Existing columns:', existing);

    const toAdd = [
        { name: 'file_name', def: 'TEXT' },
        { name: 'file_type', def: 'TEXT' },
        { name: 'file_path', def: 'TEXT' },
        { name: 'brief',     def: 'TEXT DEFAULT ""' },
        { name: 'framework', def: 'TEXT DEFAULT ""' },
        { name: 'category',  def: 'TEXT DEFAULT "Guide"' },
        { name: 'download_count', def: 'INTEGER DEFAULT 0' },
    ];

    for (const col of toAdd) {
        if (!existing.includes(col.name)) {
            try {
                await db.exec(`ALTER TABLE playbooks ADD COLUMN ${col.name} ${col.def}`);
                console.log(`✅ Added column: ${col.name}`);
            } catch (e) {
                console.error(`❌ Failed to add ${col.name}:`, e.message);
            }
        } else {
            console.log(`⏭  Already exists: ${col.name}`);
        }
    }

    console.log('Migration complete.');
    await db.close();
}

run().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});