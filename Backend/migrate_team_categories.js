const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');

async function migrate() {
    try {
        const db = await open({ filename: dbPath, driver: sqlite3.Database });
        console.log('Connected to database.');

        // Try adding the new column 'categories'
        try {
            console.log('Adding categories column to team_members...');
            await db.exec("ALTER TABLE team_members ADD COLUMN categories TEXT DEFAULT '[\"leadership\"]'");
        } catch (e) {
            if (e.message.includes('duplicate column name')) {
                console.log('categories column already exists.');
            } else {
                throw e;
            }
        }

        // Migrate existing category to new categories JSON array
        console.log('Migrating existing data...');
        const members = await db.all('SELECT id, category FROM team_members');
        for (const m of members) {
            let cat = m.category || 'leadership';
            let newCats = JSON.stringify([cat]);
            await db.run('UPDATE team_members SET categories = ? WHERE id = ?', [newCats, m.id]);
        }

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    }
}

migrate();
