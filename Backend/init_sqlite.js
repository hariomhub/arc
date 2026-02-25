const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, 'database.sqlite');

async function setup() {
  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    console.log('Connected to the SQLite database.');
    console.log('Dropping existing tables to recreate schema...');

    await db.exec('DROP TABLE IF EXISTS answers');
    await db.exec('DROP TABLE IF EXISTS questions');
    await db.exec('DROP TABLE IF EXISTS resources');
    await db.exec('DROP TABLE IF EXISTS categories');
    await db.exec('DROP TABLE IF EXISTS events');
    await db.exec('DROP TABLE IF EXISTS team_members');
    await db.exec('DROP TABLE IF EXISTS users');

    console.log('Creating tables...');

    // Users Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user' CHECK(role IN ('user', 'member', 'admin', 'executive', 'university', 'company')),
        approval_status TEXT DEFAULT 'pending' CHECK(approval_status IN ('pending', 'approved', 'rejected')),
        organization_name TEXT,
        gst TEXT,
        pan TEXT,
        incorporation_number TEXT,
        phone TEXT,
        bio TEXT,
        linkedin_url TEXT,
        twitter_url TEXT,
        website_url TEXT,
        profile_image TEXT,
        is_banned INTEGER DEFAULT 0,
        reset_token TEXT,
        reset_token_expires DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Categories Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Resources Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS resources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL CHECK(type IN ('whitepaper', 'guide', 'tool', 'article', 'news', 'homepage video', 'lab result', 'product')),
        external_link TEXT,
        file_path TEXT,
        access TEXT DEFAULT 'Public',
        status TEXT DEFAULT 'approved' CHECK(status IN ('pending', 'approved', 'rejected')),
        download_count INTEGER DEFAULT 0,
        category_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);

    // Events Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        location TEXT NOT NULL,
        link TEXT,
        type TEXT DEFAULT 'upcoming' CHECK(type IN ('upcoming', 'past')),
        category TEXT DEFAULT 'webinar',
        is_featured INTEGER DEFAULT 0,
        teams_link TEXT,
        recording_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Team Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS team_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        linkedin_url TEXT,
        categories TEXT DEFAULT '["leadership"]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Questions Table (Modified: Match backend routes)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        details TEXT,
        status TEXT DEFAULT 'open',
        user_id INTEGER,
        category_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `);

    // Answers/Responses Table 
    await db.exec(`
      CREATE TABLE IF NOT EXISTS answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question_id INTEGER,
        user_id INTEGER,
        content TEXT NOT NULL,
        is_official INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Playbooks Table 
    await db.exec(`
      CREATE TABLE IF NOT EXISTS playbooks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        brief TEXT,
        framework TEXT NOT NULL,
        category TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_type TEXT NOT NULL,
        download_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Tables created successfully.');
    console.log('Seeding dummy data...');

    // 1. Seed Admin and Users
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.run(
      `INSERT INTO users (id, name, email, password_hash, role, approval_status) VALUES (1, 'Admin', 'admin@example.com', ?, 'admin', 'approved')`,
      hashedPassword
    );

    // Dummy user awaiting approval
    const hashedUserPassword = await bcrypt.hash('password123', 10);
    await db.run(
      `INSERT INTO users (id, name, email, password_hash, role, approval_status) VALUES (2, 'John Doe', 'john@example.com', ?, 'member', 'pending')`,
      hashedUserPassword
    );

    // Dummy user approved
    await db.run(
      `INSERT INTO users (id, name, email, password_hash, role, approval_status) VALUES (3, 'Jane Smith', 'jane@example.com', ?, 'member', 'approved')`,
      hashedUserPassword
    );

    // Dummy Executive
    await db.run(
      `INSERT INTO users (id, name, email, password_hash, role, approval_status) VALUES (4, 'Exec Officer', 'exec@example.com', ?, 'executive', 'approved')`,
      hashedUserPassword
    );

    // Dummy University
    await db.run(
      `INSERT INTO users (id, name, email, password_hash, role, approval_status) VALUES (5, 'Tech University', 'uni@example.com', ?, 'university', 'approved')`,
      hashedUserPassword
    );

    // Dummy Company
    await db.run(
      `INSERT INTO users (id, name, email, password_hash, role, approval_status, organization_name, gst, pan) VALUES (6, 'Tech Corp', 'corp@example.com', ?, 'company', 'approved', 'Tech Corp Inc', '22AAAAA0000A1Z5', 'AAAAA0000A')`,
      hashedUserPassword
    );

    // 2. Seed Categories
    await db.run(`INSERT INTO categories (id, name, description) VALUES (1, 'AI Governance', 'Frameworks and best practices')`);
    await db.run(`INSERT INTO categories (id, name, description) VALUES (2, 'Cybersecurity', 'Protecting AI systems')`);

    // 3. Seed Resources
    await db.run(`INSERT INTO resources (title, description, type, category_id) VALUES ('AI Risk Mitigation Strategies', 'Comprehensive guide to mitigating common AI risks.', 'guide', 1)`);
    await db.run(`INSERT INTO resources (title, description, type, category_id) VALUES ('State of AI Security 2026', 'Annual whitepaper on AI security trends.', 'whitepaper', 2)`);
    await db.run(`INSERT INTO resources (title, description, type, category_id) VALUES ('Vulnerability Scanner', 'Tool to scan LLM endpoints.', 'tool', 2)`);

    // 4. Seed Events
    await db.run(`INSERT INTO events (title, date, location, link, type, category) VALUES ('AI Privacy Roadshow 2026', 'Saturday 28th February, 2026', 'Gandhinagar', 'https://example.com/register/1', 'upcoming', 'seminar')`);
    await db.run(`INSERT INTO events (title, date, location, link, type, category) VALUES ('Certified Risk Officer Course (Batch 4)', '28th Feb - 1st March, 2026', 'Virtual', 'https://example.com/register/2', 'upcoming', 'webinar')`);
    await db.run(`INSERT INTO events (title, date, location, link, type, category) VALUES ('Security & Trust Summit 2026', 'Friday, 20th February, 2026', 'T-Hub, Hyderabad', 'https://example.com/register/3', 'upcoming', 'conference')`);
    await db.run(`INSERT INTO events (title, date, location, link, type, category) VALUES ('Annual AI Safety Conference 2025', 'December 10th, 2025', 'Delhi', '#', 'past', 'conference')`);

    // 5. Seed Team Members
    await db.run(`INSERT INTO team_members (name, role, categories, linkedin_url) VALUES ('Akarsh Singh A.', 'Chief Policy Officer', '["leadership"]', 'https://linkedin.com')`);
    await db.run(`INSERT INTO team_members (name, role, categories, linkedin_url) VALUES ('Elena Rodriguez', 'Head of AI Research', '["leadership"]', 'https://linkedin.com')`);
    await db.run(`INSERT INTO team_members (name, role, categories, linkedin_url) VALUES ('Dr. Pawan Chawla', 'Senior Security Advisor', '["leadership", "industrial"]', 'https://linkedin.com')`);
    await db.run(`INSERT INTO team_members (name, role, categories, linkedin_url) VALUES ('Sarah Chen', 'Director of Ethics', '["industrial"]', 'https://linkedin.com')`);

    // 6. Seed QnA
    await db.run(`INSERT INTO questions (id, title, details, status, user_id, category_id) VALUES (1, 'How do we comply with the new EU AI Act?', 'I am looking for specific checklist templates.', 'answered', 3, 1)`);
    await db.run(`INSERT INTO questions (id, title, details, status, user_id, category_id) VALUES (2, 'What are the best open-source tools for red-teaming LLMs?', 'Please share any python libraries.', 'open', 3, 2)`);

    await db.run(`INSERT INTO answers (question_id, user_id, content, is_official) VALUES (1, 1, 'We recommend starting with a gap analysis using our provided assessment framework under Resources.', 1)`);

    console.log('Seeding QnA complete');

    // 7. Seed Playbooks
    const playbooks = [
      { title: 'AI Risk Management Guide', brief: 'A comprehensive guide to identifying and mitigating AI risks.', framework: 'NIST AI RMF', category: 'Guide', type: 'PDF' },
      { title: 'EU AI Act Compliance Checklist', brief: 'Step-by-step checklist to ensure compliance with the latest EU AI Act regulations.', framework: 'EU AI Act', category: 'Checklist', type: 'PDF' },
      { title: 'ISO 42001 Implementation Template', brief: 'Ready-to-use template for drafting your AI management system policies.', framework: 'ISO 42001', category: 'Template', type: 'Word' },
      { title: 'GDPR & AI Assessment Tool', brief: 'Excel tool to assess the impact of AI systems on data privacy and GDPR compliance.', framework: 'GDPR', category: 'Checklist', type: 'Excel' },
      { title: 'General AI Governance Policy', brief: 'A broad governance policy document suitable for organizations adopting AI.', framework: 'General', category: 'Policy', type: 'Word' },
      { title: 'NIST AI RMF Self-Assessment', brief: 'Evaluate your organization’s maturity against the NIST framework.', framework: 'NIST AI RMF', category: 'Template', type: 'Excel' }
    ];

    for (const pb of playbooks) {
      await db.run(
        'INSERT INTO playbooks (title, brief, framework, category, file_path, file_type) VALUES (?, ?, ?, ?, ?, ?)',
        [pb.title, pb.brief, pb.framework, pb.category, '/uploads/sample-playbook.pdf', pb.type]
      );
    }

    console.log('Database initialization and seeding complete.');

  } catch (err) {
    console.error('Error setting up the database:', err);
  }
}

setup();
