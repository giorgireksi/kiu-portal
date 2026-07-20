#!/usr/bin/env node
/**
 * Wave 16 peel helper.
 * Extracts [start,end] inclusive (1-based) from host into factory peel;
 * replaces that range with window const aliases (classroom-tabs style).
 */
'use strict';

const fs = require('fs');
const path = require('path');

function arg(name, fallback = null) {
    const i = process.argv.indexOf(`--${name}`);
    if (i === -1) return fallback;
    return process.argv[i + 1];
}

const hostRel = arg('host');
const peelRel = arg('peel');
const start = Number(arg('start'));
const end = Number(arg('end'));
const factory = arg('factory');
const loaded = arg('loaded');
const init = arg('init') || 'initPeel';
const header = arg('header') || `Peeled from ${hostRel}.`;
const aliasStyle = arg('alias-style') || 'window'; // window | destructure | none
const dryRun = process.argv.includes('--dry-run');

if (!hostRel || !peelRel || !start || !end || !factory || !loaded) {
    console.error('Usage: --host --peel --start --end --factory --loaded [--init] [--header] [--alias-style]');
    process.exit(1);
}

const root = path.resolve(__dirname, '..');
const hostPath = path.join(root, hostRel);
const peelPath = path.join(root, peelRel);
const hostText = fs.readFileSync(hostPath, 'utf8');
const hostLines = hostText.split('\n');
const slice = hostLines.slice(start - 1, end);
const body = slice.join('\n');

const nameRe = /^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(|^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?function\b/gm;
const exportNames = [];
let m;
while ((m = nameRe.exec(body))) {
    const name = m[1] || m[2];
    if (name && !exportNames.includes(name)) exportNames.push(name);
}

if (!exportNames.length) {
    console.error('No function names found in range', start, end);
    process.exit(1);
}

const apiEntries = exportNames.map((n) => `            ${n},`).join('\n');
const peelSource = `/* ${header}
 * Load before ${path.basename(hostRel)}.
 */
(function ${init}() {
    if (window.${loaded}) return;
    window.${loaded} = true;

    window.${factory} = function createKiuPeelApi(deps = {}) {
        const d = deps;
        void d;
        /* Non-strict factory body: free vars resolve to window globals at call time. */

${body}

        const api = {
${apiEntries}
        };
        Object.assign(window, api);
        return api;
    };

    window.${factory}({});
})();
`;

let bridge;
if (aliasStyle === 'none') {
    bridge = `/* ${path.basename(peelRel)} owns: ${exportNames.slice(0, 3).join(', ')}${exportNames.length > 3 ? ', …' : ''} */`;
} else if (aliasStyle === 'destructure') {
    bridge = `const __peelApi = typeof window.${factory} === 'function' ? window.${factory}({}) : {};\nconst {\n    ${exportNames.join(',\n    ')}\n} = __peelApi;`;
} else {
    bridge = exportNames.map((n) => `const ${n} = window.${n};`).join('\n');
}

const hostAfterLines = hostLines.length - (end - start + 1) + bridge.split('\n').length;
console.log(`Peel ${exportNames.length} fns, ${end - start + 1} lines -> ${peelRel}`);
console.log(`Host ${hostLines.length} -> ~${hostAfterLines} (need <=1999)`);
console.log(`Names: ${exportNames.slice(0, 8).join(', ')}${exportNames.length > 8 ? '...' : ''}`);

if (dryRun) process.exit(0);

fs.mkdirSync(path.dirname(peelPath), { recursive: true });
fs.writeFileSync(peelPath, peelSource);
const next = [...hostLines.slice(0, start - 1), ...bridge.split('\n'), ...hostLines.slice(end)].join('\n');
fs.writeFileSync(hostPath, next);
console.log('Wrote peel + host. Host lines:', next.split('\n').length);
