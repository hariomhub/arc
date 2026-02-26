/**
 * Migration & Seed script
 * - Adds is_featured column to events table
 * - Seeds news items into resources table (with status='approved')
 * - Re-seeds team members with profile images from randomuser.me
 */
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const https = require('https');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const uploadsDir = path.resolve(__dirname, 'uploads');

const downloadImage = (url, filepath) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode === 200) {
                res.pipe(fs.createWriteStream(filepath))
                    .on('error', reject)
                    .once('close', () => resolve(filepath));
            } else if (res.statusCode === 301 || res.statusCode === 302) {
                // Follow redirect
                https.get(res.headers.location, (res2) => {
                    if (res2.statusCode === 200) {
                        res2.pipe(fs.createWriteStream(filepath))
                            .on('error', reject)
                            .once('close', () => resolve(filepath));
                    } else {
                        res2.resume();
                        reject(new Error(`Redirect failed: ${res2.statusCode}`));
                    }
                });
            } else {
                res.resume();
                reject(new Error(`Status: ${res.statusCode}`));
            }
        }).on('error', reject);
    });
};

async function run() {
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    console.log('Connected to SQLite database.');

    // =====================================================================
    // 1. ADD is_featured COLUMN TO events TABLE (if not exists)
    // =====================================================================
    try {
        const columns = await db.all("PRAGMA table_info(events)");
        const hasIsFeatured = columns.some(c => c.name === 'is_featured');
        if (!hasIsFeatured) {
            await db.run("ALTER TABLE events ADD COLUMN is_featured INTEGER DEFAULT 0");
            console.log('✅ Added is_featured column to events table.');
        } else {
            console.log('ℹ️  is_featured column already exists.');
        }
    } catch (err) {
        console.error('Error adding is_featured column:', err.message);
    }

    // =====================================================================
    // 2. SEED NEWS ITEMS INTO resources TABLE
    // =====================================================================
    try {
        // Check if news items already exist
        const existing = await db.get("SELECT COUNT(*) as cnt FROM resources WHERE type = 'news'");
        if (existing.cnt > 0) {
            console.log(`ℹ️  ${existing.cnt} news items already exist. Clearing and re-seeding...`);
            await db.run("DELETE FROM resources WHERE type = 'news'");
        }

        const newsItems = [
            ['Q1 Regulatory Update: EU AI Act', 'The European Union has finalized the sweeping AI Act. Understand the compliance requirements for deploying high-risk foundational models across member states.', 'news', 'Public', 'approved'],
            ['Council Expansion Announcement', 'We are thrilled to expand the Risk Council size to include 500 new diverse members globally, providing representation across 40 different countries.', 'news', 'Public', 'approved'],
            ['New Threat Vector Identified', 'Our research team has published a new brief detailing prompt injection vulnerabilities in popular customer service LLMs. We advise immediate patching.', 'news', 'Public', 'approved'],
            ['Annual AI Security Report 2026', 'Download the summary of our annual findings on enterprise AI adoption risk. The report highlights severe gaps in data provenance tracking.', 'news', 'Public', 'approved'],
            ['Partnership with GovTech Lab', 'AI Risk Council is partnering with the National GovTech Lab to develop standardized red-teaming benchmarks for public sector algorithms.', 'news', 'Public', 'approved'],
            ['Open Source Auditing Framework v2', 'We just released version 2 of our open-source AI auditing framework. It now includes comprehensive tools for evaluating dataset bias and representation.', 'news', 'Public', 'approved'],
            ['Upcoming Executive Webinar', 'Join our upcoming webinar on navigating the complex landscape of global AI regulations. Featuring guest speakers from top regulatory bodies.', 'news', 'Public', 'approved']
        ];

        for (const item of newsItems) {
            await db.run(
                "INSERT INTO resources (title, description, type, access, status) VALUES (?, ?, ?, ?, ?)",
                item
            );
        }
        console.log(`✅ Seeded ${newsItems.length} news items with status='approved'.`);
    } catch (err) {
        console.error('Error seeding news:', err.message);
    }

    // =====================================================================
    // 3. RE-SEED TEAM MEMBERS WITH PROFILE IMAGES
    // =====================================================================
    try {
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const teamMembers = [
            { name: 'Dr. Sarah Chen', role: 'Head of AI Research', category: 'leadership', description: 'Dr. Chen leads our core research initiatives focusing on neural network safety and interpretability.', linkedin: 'https://linkedin.com/', img: 'https://randomuser.me/api/portraits/women/14.jpg' },
            { name: 'Marcus Johnson', role: 'Chief Risk Officer', category: 'leadership', description: 'Marcus brings 15 years of standard risk management and applies it to modern AI systems governance.', linkedin: 'https://linkedin.com/', img: 'https://randomuser.me/api/portraits/men/32.jpg' },
            { name: 'Elena Rodriguez', role: 'Ethics Lead', category: 'leadership', description: 'Elena focuses on algorithmic bias, fairness, and the ethical deployment of autonomous systems.', linkedin: 'https://linkedin.com/', img: 'https://randomuser.me/api/portraits/women/68.jpg' },
            { name: 'David Kim', role: 'Senior Security Engineer', category: 'leadership', description: 'Specializes in red-teaming LLMs and identifying vulnerabilities in production ML pipelines.', linkedin: 'https://linkedin.com/', img: 'https://randomuser.me/api/portraits/men/46.jpg' },
            { name: 'Priya Sharma', role: 'Director of Policy', category: 'leadership', description: 'Priya bridges the gap between technical AI capabilities and emerging global regulatory frameworks.', linkedin: 'https://linkedin.com/', img: 'https://randomuser.me/api/portraits/women/59.jpg' },
            { name: 'Alex Thompson', role: 'Lead Auditor', category: 'leadership', description: 'Alex develops our proprietary frameworks for conducting comprehensive AI system audits.', linkedin: 'https://linkedin.com/', img: 'https://randomuser.me/api/portraits/men/22.jpg' },
            { name: 'Dr. James Wilson', role: 'Principal Data Scientist', category: 'leadership', description: 'Focuses on privacy-preserving machine learning techniques including federated learning.', linkedin: 'https://linkedin.com/', img: 'https://randomuser.me/api/portraits/men/82.jpg' },
            { name: 'Maria Garcia', role: 'Compliance Manager', category: 'leadership', description: 'Ensures our internal and external operations adhere to the highest international data standards.', linkedin: 'https://linkedin.com/', img: 'https://randomuser.me/api/portraits/women/33.jpg' },
            { name: 'Tom Baker', role: 'Systems Architect', category: 'leadership', description: 'Designs scalable, secure infrastructure for deploying large-scale AI models reliably.', linkedin: 'https://linkedin.com/', img: 'https://randomuser.me/api/portraits/men/62.jpg' },
            { name: 'Nina Patel', role: 'Community Outreach', category: 'leadership', description: 'Engages with external stakeholders, organizing our workshops, seminars, and public forums.', linkedin: 'https://linkedin.com/', img: 'https://randomuser.me/api/portraits/women/11.jpg' },
            // Industrial AI Experts
            { name: 'Dr. Robert Chang', role: 'Industrial Automation Specialist', category: 'industrial', description: 'Robert focuses on the integration of computer vision in smart manufacturing facilities.', linkedin: 'https://linkedin.com/', img: 'https://randomuser.me/api/portraits/men/15.jpg' },
            { name: 'Samantha Lee', role: 'Supply Chain AI Modeler', category: 'industrial', description: 'Samantha builds predictive models to anticipate supply chain disruptions on a global scale.', linkedin: 'https://linkedin.com/', img: 'https://randomuser.me/api/portraits/women/24.jpg' },
            { name: 'Prof. Hans Mueller', role: 'Robotics Integration Lead', category: 'industrial', description: 'Hans ensures safety protocols are strictly followed in human-robot collaborative environments.', linkedin: 'https://linkedin.com/', img: 'https://randomuser.me/api/portraits/men/44.jpg' },
            { name: 'Jessica Taylor', role: 'IoT Edge Computing', category: 'industrial', description: 'Jessica optimizes machine learning models to run efficiently on low-power industrial edge devices.', linkedin: 'https://linkedin.com/', img: 'https://randomuser.me/api/portraits/women/42.jpg' },
            { name: 'Oliver Green', role: 'Predictive Maintenance Lead', category: 'industrial', description: 'Oliver develops acoustic and vibration analysis tools to predict heavy machinery failures.', linkedin: 'https://linkedin.com/', img: 'https://randomuser.me/api/portraits/men/51.jpg' },
            // Security Team
            { name: 'Amira Hassan', role: 'Head of Penetration Testing', category: 'security', description: 'Amira specializes in highly complex cyber-physical attacks against emerging AI models.', linkedin: 'https://linkedin.com/', img: 'https://randomuser.me/api/portraits/women/71.jpg' },
            { name: 'Daniel Foster', role: 'Cloud Security Architect', category: 'security', description: 'Daniel hardens our cloud training pipelines against external intrusion and internal leakage.', linkedin: 'https://linkedin.com/', img: 'https://randomuser.me/api/portraits/men/88.jpg' },
            { name: 'Chloe Davies', role: 'Cryptography Expert', category: 'security', description: 'Chloe is pioneering the use of homomorphic encryption for training models on sensitive health data.', linkedin: 'https://linkedin.com/', img: 'https://randomuser.me/api/portraits/women/8.jpg' },
            { name: "Kevin O'Connor", role: 'Threat Intelligence Lead', category: 'security', description: 'Kevin monitors deep web channels to track emerging adversarial tactics weaponized against AI.', linkedin: 'https://linkedin.com/', img: 'https://randomuser.me/api/portraits/men/38.jpg' },
            { name: 'Rachel Zane', role: 'Incident Response Commander', category: 'security', description: "Rachel orchestrates the council's rapid response protocol during active security breaches.", linkedin: 'https://linkedin.com/', img: 'https://randomuser.me/api/portraits/women/92.jpg' }
        ];

        // Clear old team data
        await db.run('DELETE FROM team_members');
        console.log('Cleared old team members.');

        let successCount = 0;
        for (let i = 0; i < teamMembers.length; i++) {
            const t = teamMembers[i];
            const fileName = `team-seed-v3-${i + 1}.jpg`;
            const localPath = path.join(uploadsDir, fileName);

            try {
                // Check if we already have this image downloaded
                if (!fs.existsSync(localPath)) {
                    console.log(`  Downloading image for ${t.name}...`);
                    await downloadImage(t.img, localPath);
                }
                const dbImgPath = `/uploads/${fileName}`;
                await db.run(
                    'INSERT INTO team_members (name, role, description, linkedin_url, image_url, categories) VALUES (?, ?, ?, ?, NULL, ?)',
                    [t.name, t.role, t.description, t.linkedin, JSON.stringify([t.category])]
                );
                successCount++;
            } catch (err) {
                // If image download fails, insert without image
                console.warn(`  ⚠ Image failed for ${t.name}: ${err.message}. Inserting without image.`);
                await db.run(
                    'INSERT INTO team_members (name, role, description, linkedin_url, image_url, category) VALUES (?, ?, ?, ?, NULL, ?)',
                    [t.name, t.role, t.description, t.linkedin, t.category]
                );
                successCount++;
            }
        }
        console.log(`✅ Seeded ${successCount} team members with profile images.`);
    } catch (err) {
        console.error('Error seeding team:', err.message);
    }

    await db.close();
    console.log('\n🎉 Migration and seeding complete!');
    process.exit(0);
}

run();
