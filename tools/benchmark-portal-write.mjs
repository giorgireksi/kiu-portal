import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { LocalRecordStore } = require(path.join(ROOT, 'backend/platform/local-record-store.js'));

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kiu-portal-write-'));
const statePath = path.join(tmpDir, 'platform-state.json');
const sourcePath = path.join(ROOT, 'backend/platform/.local-platform-state.json');
fs.copyFileSync(sourcePath, statePath);

const store = new LocalRecordStore({ statePath });
await store.init();
const state = await store.loadState();

const startedAt = Date.now();
await store.writeNamespaces({ portal: state.portal });
const elapsedMs = Date.now() - startedAt;
const slicePath = `${statePath}.portal.json`;
const sliceBytes = fs.existsSync(slicePath) ? fs.statSync(slicePath).size : 0;

console.log(JSON.stringify({ elapsedMs, sliceBytes, slicePath }, null, 2));