import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);

const sources = [
  'assets/css/lux-tokens.css',
  'assets/css/lux-fouc-ht.css',
  'assets/css/lux-shell.css',
  'assets/css/lux-controls.css',
  'assets/css/lux-focus-panel.css',
  'assets/css/lux-layout-primitives.css',
  'assets/css/mobile-shell-core.css',
  'assets/css/route-bare/core/lux-page-bare-lite.css',
];

function stripCssComments(source) {
  const without = source.replace(/\/\*[\s\S]*?\*\//g, '');
  return `${without.split('\n').map(l => l.replace(/\s+$/g, '')).join('\n').trimEnd()}\n`;
}

let combined = '';
for (const rel of sources) {
  const path = resolve(root, rel);
  let text;
  try { text = await readFile(path, 'utf8'); } catch { console.warn(`[shared-core] missing ${rel}, skipping`); continue; }
  combined += `/* source: ${rel} */\n` + stripCssComments(text) + '\n';
}

const hash = createHash('sha256').update(combined).digest('hex').slice(0, 8);
const outPath = resolve(root, 'assets/css/shared-lux-core.css');
const banner = `/* shared-lux-core — generated from ${sources.length} sources — hash ${hash} — edit SOURCES, run tools/build-shared-lux-core.mjs */\n`;
await mkdir(dirname(outPath), { recursive: true });
await writeFile(outPath, banner + combined.trimEnd() + '\n', 'utf8');
console.log(`shared-lux-core.css — ${hash} — ${Buffer.byteLength(combined)} bytes from ${sources.length} sources`);
