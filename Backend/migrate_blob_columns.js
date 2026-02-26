/**
 * Migration: Add blob_name columns to all tables that store files
 * Run once with: node migrate_blob_columns.js
 */
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const dbPath = process.env.SQLITE_DB_PATH || path.resolve(__dirname, 'database.sqlite');

const migrations = [
    // team_members
    { table: 'team_members',  column: 'blob_name',         def: 'TEXT' },
    // users
    { table: 'users',         column: 'profile_blob_name', def: 'TEXT' },
    { table: 'users',         column: 'profile_image',     def: 'TEXT' },
    { table: 'users',         column: 'bio',               def: 'TEXT' },
    { table: 'users',         column: 'linkedin_url',      def: 'TEXT' },
    { table: 'users',         column: 'twitter_url',       def: 'TEXT' },
    // playbooks
    { table: 'playbooks',     column: 'blob_name',         def: 'TEXT' },
    // resources
    { table: 'resources',     column: 'blob_name',         def: 'TEXT' },
    { table: 'resources',     column: 'thumbnail_url',     def: 'TEXT' },
    { table: 'resources',     column: 'status',            def: "TEXT DEFAULT 'approved'" },
    { table: 'resources',     column: 'user_id',           def: 'INTEGER' },
    { table: 'resources',     column: 'download_count',    def: 'INTEGER DEFAULT 0' },
    { table: 'resources',     column: 'summary',           def: 'TEXT' },
    { table: 'resources',     column: 'access_level',      def: "TEXT DEFAULT 'public'" },
    { table: 'resources',     column: 'category_slug',     def: 'TEXT' },
];

async function run() {
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    console.log('Connected to:', dbPath);

    // Get existing columns per table
    const tableColumns = {};
    const tables = [...new Set(migrations.map(m => m.table))];
    for (const table of tables) {
        const cols = await db.all(`PRAGMA table_info(${table})`);
        tableColumns[table] = cols.map(c => c.name);
        console.log(`\n[${table}] existing:`, tableColumns[table].join(', '));
    }

    // Run migrations
    for (const { table, column, def } of migrations) {
        if (!tableColumns[table]) {
            console.log(`⚠️  Table ${table} not found — skipping ${column}`);
            continue;
        }
        if (tableColumns[table].includes(column)) {
            console.log(`⏭  ${table}.${column} already exists`);
            continue;
        }
        try {
            await db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
            console.log(`✅ Added ${table}.${column}`);
        } catch (e) {
            console.error(`❌ Failed ${table}.${column}:`, e.message);
        }
    }

    // Copy description → summary for resources if needed
    const resCols = tableColumns['resources'] || [];
    if (resCols.includes('description')) {
        await db.exec("UPDATE resources SET summary = description WHERE summary IS NULL AND description IS NOT NULL");
        console.log('\n✅ Copied resources.description → summary');
    }

    console.log('\n✅ All migrations complete.');
    await db.close();
}

run().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});