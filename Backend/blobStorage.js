/**
 * Azure Blob Storage helper
 * Automatically categorizes files into folders by type:
 *   videos/             → mp4, webm, mov, avi
 *   images/resources    → jpg, jpeg, png, gif, webp, svg (from resource uploads)
 *   images/profiles     → user profile images
 *   images/team         → team member photos
 *   documents/resources → pdf, docx, xlsx (from resource uploads)
 *   documents/playbooks → playbook files
 *   misc/               → anything else
 *
 * Falls back to local disk if AZURE_STORAGE_CONNECTION_STRING is not set
 */
const { BlobServiceClient } = require('@azure/storage-blob');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME || 'airiskcouncil';
const USE_BLOB = !!CONNECTION_STRING;

let containerClient = null;

if (USE_BLOB) {
    try {
        const blobServiceClient = BlobServiceClient.fromConnectionString(CONNECTION_STRING);
        containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
        console.log(`[Blob] Azure Blob Storage ready — container: ${CONTAINER_NAME}`);
    } catch (e) {
        console.error('[Blob] Failed to initialize Azure Blob client:', e.message);
    }
} else {
    console.log('[Blob] No AZURE_STORAGE_CONNECTION_STRING — using local disk');
}

// ── File type → folder mapping ────────────────────────────────────────────────
const VIDEO_EXTS = new Set(['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v']);
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico']);
const DOC_EXTS   = new Set(['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt', '.txt', '.csv']);

/**
 * Determine the blob subfolder based on file extension + upload context
 * @param {string} originalName
 * @param {string} hint - 'resources' | 'playbooks' | 'profiles' | 'team'
 */
function getFolder(originalName, hint = 'resources') {
    const ext = path.extname(originalName).toLowerCase();

    // Named contexts go to specific folders regardless of type
    if (hint === 'playbooks') return 'documents/playbooks';
    if (hint === 'profiles')  return 'images/profiles';
    if (hint === 'team')      return 'images/team';

    // Auto-detect by extension for 'resources'
    if (VIDEO_EXTS.has(ext))  return 'videos';
    if (IMAGE_EXTS.has(ext))  return 'images/resources';
    if (DOC_EXTS.has(ext))    return 'documents/resources';

    return 'misc';
}

// ── MIME type map ─────────────────────────────────────────────────────────────
const MIME_MAP = {
    '.mp4':  'video/mp4',
    '.webm': 'video/webm',
    '.mov':  'video/quicktime',
    '.avi':  'video/x-msvideo',
    '.mkv':  'video/x-matroska',
    '.m4v':  'video/mp4',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png':  'image/png',
    '.gif':  'image/gif',
    '.webp': 'image/webp',
    '.svg':  'image/svg+xml',
    '.bmp':  'image/bmp',
    '.pdf':  'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc':  'application/msword',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xls':  'application/vnd.ms-excel',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.ppt':  'application/vnd.ms-powerpoint',
    '.txt':  'text/plain',
    '.csv':  'text/csv',
};

function getMimeType(originalName, provided) {
    if (provided && provided !== 'application/octet-stream') return provided;
    return MIME_MAP[path.extname(originalName).toLowerCase()] || 'application/octet-stream';
}

/**
 * Upload a file buffer to Azure Blob Storage
 * @param {Buffer} buffer - file buffer (use multer memoryStorage)
 * @param {string} originalName - original filename
 * @param {string} mimeType - mimetype from multer
 * @param {string} hint - upload context: 'resources' | 'playbooks' | 'profiles' | 'team'
 * @returns {Promise<{ blobName: string, url: string, folder: string }>}
 */
async function uploadToBlob(buffer, originalName, mimeType, hint = 'resources') {
    if (!USE_BLOB || !containerClient) {
        throw new Error('Azure Blob Storage is not configured');
    }

    await containerClient.createIfNotExists({ access: 'blob' });

    const ext = path.extname(originalName).toLowerCase();
    const folder = getFolder(originalName, hint);
    const baseName = path.basename(originalName, ext)
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .substring(0, 60);

    // e.g. videos/1740000000000-a1b2c3d4-my_video.mp4
    const blobName = `${folder}/${Date.now()}-${uuidv4().split('-')[0]}-${baseName}${ext}`;
    const contentType = getMimeType(originalName, mimeType);

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: { blobContentType: contentType }
    });

    console.log(`[Blob] ✅ Uploaded → ${blobName} (${contentType})`);

    return { blobName, url: blockBlobClient.url, folder };
}

/**
 * Delete a blob by its name (e.g. 'videos/1740000000000-abc-file.mp4')
 */
async function deleteFromBlob(blobName) {
    if (!USE_BLOB || !containerClient || !blobName) return;
    try {
        await containerClient.getBlockBlobClient(blobName).deleteIfExists();
        console.log(`[Blob] 🗑  Deleted → ${blobName}`);
    } catch (e) {
        console.error('[Blob] Delete failed:', e.message);
    }
}

/**
 * Extract blob name from a full Azure Blob URL
 * https://account.blob.core.windows.net/container/videos/file.mp4
 * → videos/file.mp4
 */
function blobNameFromUrl(url) {
    if (!url) return null;
    try {
        const parts = new URL(url).pathname.split('/');
        parts.shift(); // ''
        parts.shift(); // container name
        return parts.join('/');
    } catch {
        return null;
    }
}

function isBlobUrl(url) {
    return !!(url && url.includes('.blob.core.windows.net'));
}

module.exports = {
    uploadToBlob,
    deleteFromBlob,
    blobNameFromUrl,
    isBlobUrl,
    getFolder,
    USE_BLOB,
    CONTAINER_NAME
};