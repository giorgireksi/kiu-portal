#!/usr/bin/env node
/**
 * Wipes local platform JSON to an empty state and keeps the bootstrap admin only.
 * Usage: node tools/reset-local-platform-state.mjs
 */
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const STATE_PATH = resolve(ROOT, 'backend/platform/.local-platform-state.json');

function loadEnvFile(filePath) {
    if (!existsSync(filePath)) return;
    const raw = readFileSync(filePath, 'utf8');
    raw.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eq = trimmed.indexOf('=');
        if (eq <= 0) return;
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (process.env[key] === undefined) process.env[key] = value;
    });
}

loadEnvFile(resolve(ROOT, '.env'));
loadEnvFile(resolve(ROOT, 'backend/.env'));

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');

const bootstrapAdmin = {
    id: process.env.KIU_ADMIN_ID || 'admin-root',
    name: process.env.KIU_ADMIN_NAME || 'Portal Administrator',
    nameEn: process.env.KIU_ADMIN_NAME_EN || process.env.KIU_ADMIN_NAME || 'Portal Administrator',
    displayName: process.env.KIU_ADMIN_DISPLAY_NAME || process.env.KIU_ADMIN_NAME_EN || process.env.KIU_ADMIN_NAME || 'Portal Administrator',
    email: process.env.KIU_ADMIN_EMAIL || 'admin@kiu.local',
    password: process.env.KIU_ADMIN_PASSWORD || 'change-me-admin',
    facultyCode: process.env.KIU_ADMIN_FACULTY || ''
};

async function main() {
    const store = await PlatformStore.create({
        statePath: STATE_PATH,
        storageDriver: 'local-json',
        allowLocalFallback: true,
        bootstrapAdmin
    });
    store.resetPlatformState({ preserveAdmin: true });
    const accountIds = Object.keys(store.state.accounts || {});
    console.log(`Reset complete: ${STATE_PATH}`);
    console.log(`Accounts remaining (${accountIds.length}): ${accountIds.join(', ') || '(none)'}`);
    if (!bootstrapAdmin.email || !bootstrapAdmin.password) {
        console.warn('Set KIU_ADMIN_EMAIL and KIU_ADMIN_PASSWORD in .env so ensureBootstrapAdmin can create the admin account.');
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
