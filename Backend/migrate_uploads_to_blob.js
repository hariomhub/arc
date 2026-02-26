const fs = require('fs');
const path = require('path');
const db = require('./Db');
const { uploadToBlob, USE_BLOB } = require('./blobStorage');

async function migrate() {
    if (!USE_BLOB) {
        console.error("❌ Azure Blob Storage is not configured. Please set AZURE_STORAGE_CONNECTION_STRING in your .env file.");
        process.exit(1);
    }

    console.log("🚀 Starting migration of local uploads to Azure Blob Storage...");
    const uploadsDir = path.join(__dirname, 'uploads');
    let totalMigrated = 0;

    // 1. Resources
    console.log("\n--- Migrating Resources ---");
    const [resources] = await db.query(`SELECT id, file_path FROM resources WHERE file_path LIKE '%/uploads/%' AND blob_name IS NULL`);
    for (const res of resources) {
        // extract relative path from /uploads/
        const relPath = res.file_path.split('/uploads/')[1];
        if (!relPath) continue;
        const localPath = path.join(uploadsDir, relPath);

        if (fs.existsSync(localPath)) {
             console.log(`Uploading resource ${res.id}: ${res.file_path}`);
             const buffer = fs.readFileSync(localPath);
             try {
                 const result = await uploadToBlob(buffer, path.basename(localPath), 'application/octet-stream', 'resources');
                 await db.query(`UPDATE resources SET file_path = ?, blob_name = ? WHERE id = ?`, [result.url, result.blobName, res.id]);
                 console.log(`✅ Updated resource ${res.id}`);
                 totalMigrated++;
             } catch (err) {
                 console.error(`❌ Failed to upload resource ${res.id}:`, err.message);
             }
        } else {
             console.warn(`⚠️ File not found for resource ${res.id}: ${localPath}`);
        }
    }

    // 2. Playbooks
    console.log("\n--- Migrating Playbooks ---");
    const [playbooks] = await db.query(`SELECT id, file_path FROM playbooks WHERE file_path LIKE '%/uploads/%' AND blob_name IS NULL`);
    for (const pb of playbooks) {
        const relPath = pb.file_path.split('/uploads/')[1];
        if (!relPath) continue;
        const localPath = path.join(uploadsDir, relPath);

        if (fs.existsSync(localPath)) {
             console.log(`Uploading playbook ${pb.id}: ${pb.file_path}`);
             const buffer = fs.readFileSync(localPath);
             try {
                 const result = await uploadToBlob(buffer, path.basename(localPath), 'application/octet-stream', 'playbooks');
                 await db.query(`UPDATE playbooks SET file_path = ?, blob_name = ? WHERE id = ?`, [result.url, result.blobName, pb.id]);
                 console.log(`✅ Updated playbook ${pb.id}`);
                 totalMigrated++;
             } catch (err) {
                 console.error(`❌ Failed to upload playbook ${pb.id}:`, err.message);
             }
        } else {
             console.warn(`⚠️ File not found for playbook ${pb.id}: ${localPath}`);
        }
    }

    // 3. User Profiles
    console.log("\n--- Migrating User Profiles ---");
    const [users] = await db.query(`SELECT id, profile_image FROM users WHERE profile_image LIKE '%/uploads/%' AND profile_blob_name IS NULL`);
    for (const user of users) {
        const relPath = user.profile_image.split('/uploads/')[1];
        if (!relPath) continue;
        const localPath = path.join(uploadsDir, relPath);

        if (fs.existsSync(localPath)) {
             console.log(`Uploading profile image for user ${user.id}: ${user.profile_image}`);
             const buffer = fs.readFileSync(localPath);
             try {
                 const result = await uploadToBlob(buffer, path.basename(localPath), 'application/octet-stream', 'profiles');
                 await db.query(`UPDATE users SET profile_image = ?, profile_blob_name = ? WHERE id = ?`, [result.url, result.blobName, user.id]);
                 console.log(`✅ Updated user ${user.id}`);
                 totalMigrated++;
             } catch (err) {
                 console.error(`❌ Failed to upload user ${user.id}:`, err.message);
             }
        } else {
             console.warn(`⚠️ File not found for user ${user.id}: ${localPath}`);
        }
    }

    // 4. Team Members
    console.log("\n--- Migrating Team Members ---");
    const [team] = await db.query(`SELECT id, image_url FROM team_members WHERE image_url LIKE '%/uploads/%' AND blob_name IS NULL`);
    for (const t of team) {
        const relPath = t.image_url.split('/uploads/')[1];
        if (!relPath) continue;
        const localPath = path.join(uploadsDir, relPath);

        if (fs.existsSync(localPath)) {
             console.log(`Uploading image for team member ${t.id}: ${t.image_url}`);
             const buffer = fs.readFileSync(localPath);
             try {
                 const result = await uploadToBlob(buffer, path.basename(localPath), 'application/octet-stream', 'team');
                 await db.query(`UPDATE team_members SET image_url = ?, blob_name = ? WHERE id = ?`, [result.url, result.blobName, t.id]);
                 console.log(`✅ Updated team member ${t.id}`);
                 totalMigrated++;
             } catch (err) {
                 console.error(`❌ Failed to upload team member ${t.id}:`, err.message);
             }
        } else {
             console.warn(`⚠️ File not found for team member ${t.id}: ${localPath}`);
        }
    }

    console.log(`\n🎉 Migration complete. Total files migrated: ${totalMigrated}`);
    process.exit(0);
}

migrate();
