import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

process.env.KIU_LOCAL_PLATFORM_STATE_PATH = path.join(ROOT, 'backend/platform/.local-platform-state.json');
process.env.KIU_ALLOW_LOCAL_PLATFORM_FALLBACK = '1';
process.env.KIU_ENVIRONMENT = 'development';
process.env.NODE_ENV = 'development';

const { PlatformStore } = require(path.join(ROOT, 'backend/platform/store.js'));

const startedAt = Date.now();
const store = await PlatformStore.create({
    statePath: process.env.KIU_LOCAL_PLATFORM_STATE_PATH,
    environment: 'development',
    allowLocalFallback: true,
    storageDriver: 'postgres',
    databaseUrl: ''
});
const loadMs = Date.now() - startedAt;

const buildStartedAt = Date.now();
const bootstrap = store.createApplicationBootstrap();
const buildMs = Date.now() - buildStartedAt;

const serializeStartedAt = Date.now();
const serialized = JSON.stringify(bootstrap);
const serializeMs = Date.now() - serializeStartedAt;

console.log(JSON.stringify({
    loadMs,
    buildMs,
    serializeMs,
    totalMs: Date.now() - startedAt,
    bytes: serialized.length
}, null, 2));