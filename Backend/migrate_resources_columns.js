/**
 * Migration: Add all missing columns to resources table
 * Run once with: node migrate_resources_columns.js
 */
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const dbPath = process.env.SQLITE_DB_PATH || path.resolve(__dirname, 'database.sqlite');

async function run() {
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    console.log('Connected to:', dbPath);

    const columns = await db.all('PRAGMA table_info(resources)');
    const existing = columns.map(c => c.name);
    console.log('Existing columns:', existing.join(', '));

    const toAdd = [
        { name: 'source_url',     def: 'TEXT' },
        { name: 'category_slug',  def: 'TEXT' },
        { name: 'blob_name',      def: 'TEXT' },
        { name: 'thumbnail_url',  def: 'TEXT' },
        { name: 'status',         def: "TEXT DEFAULT 'approved'" },
        { name: 'user_id',        def: 'INTEGER' },
        { name: 'download_count', def: 'INTEGER DEFAULT 0' },
        { name: 'summary',        def: 'TEXT' },
        { name: 'access_level',   def: "TEXT DEFAULT 'public'" },
        { name: 'type',           def: "TEXT DEFAULT 'article'" },
        { name: 'file_path',      def: 'TEXT' },
        { name: 'file_type',      def: 'TEXT' },
    ];

    for (const col of toAdd) {
        if (!existing.includes(col.name)) {
            try {
                await db.exec(`ALTER TABLE resources ADD COLUMN ${col.name} ${col.def}`);
                console.log(`✅ Added: ${col.name}`);
            } catch (e) {
                console.error(`❌ Failed ${col.name}:`, e.message);
            }
        } else {
            console.log(`⏭  Already exists: ${col.name}`);
        }
    }

    // Copy description → summary if needed
    if (existing.includes('description')) {
        await db.exec("UPDATE resources SET summary = description WHERE summary IS NULL AND description IS NOT NULL");
        console.log('✅ Copied description → summary');
    }

    console.log('\nDone.');
    await db.close();
}

run().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});