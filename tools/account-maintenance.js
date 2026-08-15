#!/usr/bin/env node
/**
 * Production account maintenance: fix staff roles and create real staff accounts.
 *
 * Run INSIDE the backend container so KIU_DATABASE_URL / encryption keys resolve:
 *   cat tools/account-maintenance.js | docker exec -i kiu-portal-backend node -
 *
 * Safe by default: it only prints credentials (never writes them to any file).
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const envPath = process.env.KIU_PRODUCTION_ENV_FILE || path.join(root, '.env.production');
if (fs.existsSync(envPath)) {
    const envText = fs.readFileSync(envPath, 'utf8');
    for (const line of envText.split(/\r?\n/)) {
        const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
        if (match && process.env[match[1]] === undefined) {
            process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
        }
    }
}

const cwd = process.cwd();
const candidates = [
    path.join(cwd, 'backend', 'platform', 'store.js'),
    path.join(cwd, 'platform', 'store.js')
];
const foundStore = candidates.find((candidate) => fs.existsSync(candidate));
if (!foundStore) {
    throw new Error('Could not resolve backend/platform/store.js from cwd=' + cwd + ' (run from repo root or inside the backend container)');
}

const { PlatformStore } = require(foundStore);

function genPassword() {
    return crypto.randomBytes(18).toString('base64url');
}

// Which operations to run (override via --no-professor / --no-tarole for partial runs).
const DO_PROFESSOR = process.argv.includes('--no-professor') === false;
const DO_TA_ROLE = process.argv.includes('--no-tarole') === false;

(async () => {
    const store = await PlatformStore.create({
        statePath: process.env.KIU_LOCAL_PLATFORM_STATE_PATH || path.join(root, 'backend', 'platform', '.local-platform-state.json'),
        uploadsDir: process.env.KIU_UPLOADS_DIR || path.join(root, 'uploads'),
        environment: 'production',
        fileStorageMode: process.env.KIU_FILE_STORAGE_MODE || 'external',
        storageDriver: process.env.KIU_STORAGE_DRIVER || 'postgres',
        databaseUrl: process.env.KIU_DATABASE_URL || '',
        databaseTableName: process.env.KIU_DATABASE_TABLE_NAME || '',
        allowLocalFallback: false,
        mailTokenEncryptionKey: process.env.KIU_MAIL_TOKEN_ENCRYPTION_KEY || '',
        bootstrapAdmin: {}
    });

    const out = [];
    const accounts = store.state.accounts || {};

    if (DO_TA_ROLE) {
        const taId = 'TA-ECON-1786469103119'; // stf-2026-004@kiu.edu.ge
        const existing = accounts[taId];
        if (existing) {
            store.upsertAccount({ ...existing, id: taId, role: 'ta', facultyCode: existing.facultyCode || 'ECON', faculty: existing.faculty || 'ECON' });
            out.push(`OK  Fixed role of ${existing.email} (${taId}) -> ta`);
        } else {
            out.push(`WARN Account ${taId} not found; TA role not changed.`);
        }
    }

    if (DO_PROFESSOR) {
        const profId = 'PROF-ECON-2026';
        const profEmail = 'professor@kiu.edu.ge';
        if (!accounts[profId]) {
            const password = genPassword();
            store.upsertAccount({
                id: profId,
                email: profEmail,
                name: 'Professor',
                nameEn: 'Professor',
                displayName: 'Professor (rename me)',
                role: 'professor',
                facultyCode: 'ECON',
                faculty: 'ECON',
                accountStatus: 'active',
                status: 'Active',
                activationRequired: false,
                password
            });
            out.push(`OK  Created professor   id=${profId}`);
            out.push(`OK  professor email     ${profEmail}`);
            out.push(`OK  professor password  ${password}`);
        } else {
            out.push(`WARN ${profEmail} (${profId}) already exists; not recreated.`);
        }
    }

    await store.flushPendingWrites();
    console.log(out.join('\n'));
    process.exit(0);
})().catch((error) => {
    console.error('account-maintenance failed:', error?.stack || error);
    process.exit(1);
});