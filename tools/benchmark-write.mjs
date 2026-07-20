import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const statePath = path.join(ROOT, 'backend/platform/.local-platform-state.json');

const raw = fs.readFileSync(statePath, 'utf8');
const state = JSON.parse(raw);
console.log('file bytes:', raw.length);

let t = Date.now();
const pretty = JSON.stringify(state, null, 2);
console.log('pretty stringify ms:', Date.now() - t, 'out bytes:', pretty.length);

t = Date.now();
const compact = JSON.stringify(state);
console.log('compact stringify ms:', Date.now() - t, 'out bytes:', compact.length);

t = Date.now();
const portalOnly = JSON.stringify(state.portal);
console.log('portal stringify ms:', Date.now() - t, 'out bytes:', portalOnly.length);