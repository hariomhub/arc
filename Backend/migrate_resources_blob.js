/**
 * Migration: Add blob_name, thumbnail_url, status, user_id columns to resources table
 * Run once with: node migrate_resources_blob.js
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
    console.log('Existing columns:', existing);

    const toAdd = [
        { name: 'blob_name',      def: 'TEXT' },
        { name: 'thumbnail_url',  def: 'TEXT' },
        { name: 'status',         def: "TEXT DEFAULT 'approved'" },
        { name: 'user_id',        def: 'INTEGER' },
        { name: 'download_count', def: 'INTEGER DEFAULT 0' },
        { name: 'summary',        def: 'TEXT' },      // alias for description
        { name: 'access_level',   def: "TEXT DEFAULT 'public'" },
        { name: 'category_slug',  def: 'TEXT' },
    ];

    for (const col of toAdd) {
        if (!existing.includes(col.name)) {
            try {
                await db.exec(`ALTER TABLE resources ADD COLUMN ${col.name} ${col.def}`);
                console.log(`✅ Added: ${col.name}`);
            } catch (e) {
                if (e.message.includes('duplicate column')) {
                    console.log(`⏭  Already exists: ${col.name}`);
                } else {
                    console.error(`❌ Failed ${col.name}:`, e.message);
                }
            }
        } else {
            console.log(`⏭  Already exists: ${col.name}`);
        }
    }

    // If old column is 'description', copy to summary
    if (existing.includes('description') && !existing.includes('summary')) {
        await db.exec('UPDATE resources SET summary = description WHERE summary IS NULL');
        console.log('✅ Copied description → summary');
    }

    console.log('\nMigration complete.');
    await db.close();
}

run().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});