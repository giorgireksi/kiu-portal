import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

const port = Number(process.env.KIU_REALTIME_PORT || 48933);
const baseUrl = `http://127.0.0.1:${port}`;

async function timedFetch(url, options = {}) {
    const startedAt = Date.now();
    const response = await fetch(url, options);
    const text = await response.text();
    return {
        ok: response.ok,
        status: response.status,
        elapsedMs: Date.now() - startedAt,
        bytes: text.length
    };
}

const health = await timedFetch(`${baseUrl}/health`);
console.log('health', health);

if (!health.ok) {
    console.error('Backend is not reachable on', baseUrl);
    process.exit(1);
}

process.env.KIU_LOCAL_PLATFORM_STATE_PATH = path.join(ROOT, 'backend/platform/.local-platform-state.json');
process.env.KIU_ALLOW_LOCAL_PLATFORM_FALLBACK = '1';
const { PlatformStore } = require(path.join(ROOT, 'backend/platform/store.js'));
const store = await PlatformStore.create({
    statePath: process.env.KIU_LOCAL_PLATFORM_STATE_PATH,
    environment: 'development',
    allowLocalFallback: true,
    storageDriver: 'postgres',
    databaseUrl: ''
});

const accounts = Object.keys(store.state.accounts || {});
const accountId = accounts.find((id) => store.state.accounts[id]?.role === 'admin') || accounts[0];
if (!accountId) {
    console.error('No accounts in state file');
    process.exit(1);
}

const session = store.createSessionForAccount(accountId, { identityProvider: 'portal' });
const token = session?.session?.token;
if (!token) {
    console.error('Failed to create session');
    process.exit(1);
}

const bootstrap = await timedFetch(`${baseUrl}/api/bootstrap`, {
    headers: {
        accept: 'application/json',
        'x-portal-session': token
    }
});
console.log('bootstrap', bootstrap);