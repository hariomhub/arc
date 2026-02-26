/**
 * Migration: Update resources type CHECK constraint to include video, image
 * SQLite doesn't support ALTER COLUMN, so we recreate the table.
 * Run once with: node migrate_resources_type.js
 */
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const dbPath = process.env.SQLITE_DB_PATH || path.resolve(__dirname, 'database.sqlite');

async function run() {
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    console.log('Connected to:', dbPath);

    await db.exec('BEGIN TRANSACTION');

    try {
        // 1. Get current columns
        const columns = await db.all('PRAGMA table_info(resources)');
        console.log('Current columns:', columns.map(c => c.name).join(', '));

        // 2. Rename old table
        await db.exec('ALTER TABLE resources RENAME TO resources_old');
        console.log('✅ Renamed resources → resources_old');

        // 3. Create new table with updated CHECK constraint
        await db.exec(`
            CREATE TABLE resources (
                id             INTEGER PRIMARY KEY AUTOINCREMENT,
                title          TEXT NOT NULL,
                summary        TEXT,
                type           TEXT DEFAULT 'article' CHECK(type IN (
                                   'whitepaper','guide','tool','article','news',
                                   'homepage video','lab result','product',
                                   'video','image','document'
                               )),
                access_level   TEXT DEFAULT 'public',
                source_url     TEXT,
                category_slug  TEXT,
                file_path      TEXT,
                file_type      TEXT,
                blob_name      TEXT,
                thumbnail_url  TEXT,
                status         TEXT DEFAULT 'approved',
                user_id        INTEGER,
                download_count INTEGER DEFAULT 0,
                created_at     DATETIME DEFAULT (datetime('now'))
            )
        `);
        console.log('✅ Created new resources table with updated type constraint');

        // 4. Copy all data from old table (map description → summary if needed)
        const oldCols = columns.map(c => c.name);
        const newCols = [
            'id','title','summary','type','access_level','source_url',
            'category_slug','file_path','file_type','blob_name',
            'thumbnail_url','status','user_id','download_count','created_at'
        ];

        // Build SELECT mapping old columns to new columns
        const selectParts = newCols.map(col => {
            if (col === 'summary' && !oldCols.includes('summary') && oldCols.includes('description')) {
                return 'description AS summary';
            }
            if (oldCols.includes(col)) return col;
            return `NULL AS ${col}`;
        });

        await db.exec(`
            INSERT INTO resources (${newCols.join(', ')})
            SELECT ${selectParts.join(', ')}
            FROM resources_old
        `);

        const count = await db.get('SELECT COUNT(*) as n FROM resources');
        console.log(`✅ Copied ${count.n} rows to new table`);

        // 5. Drop old table
        await db.exec('DROP TABLE resources_old');
        console.log('✅ Dropped resources_old');

        await db.exec('COMMIT');
        console.log('\n✅ Migration complete. New valid types:');
        console.log('   whitepaper, guide, tool, article, news, homepage video,');
        console.log('   lab result, product, video, image, document');

    } catch (err) {
        await db.exec('ROLLBACK');
        console.error('❌ Migration failed, rolled back:', err.message);
        process.exit(1);
    }

    await db.close();
}

run().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});