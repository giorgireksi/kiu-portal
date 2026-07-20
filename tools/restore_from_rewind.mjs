#!/usr/bin/env node
// Disaster recovery only — restores files from Grok rewind_points snapshots.
// Never use `git checkout --` on dirty working-tree files.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const REWIND_PATH =
    '/home/reksi/.grok/sessions/%2Fhome%2Freksi%2F2%2Ftest%2Fasd/019eef69-ea21-7f80-9ed3-6835eab89c8c/rewind_points.jsonl';
const REWIND_LINE = 40;

const TARGETS = [
    'assets/js/pages/social-page.js',
    'assets/css/social-rebuild.css',
    'assets/js/features/luxury-shell-chrome.js',
    'social.html',
];

function sha256(text) {
    return createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 16);
}

function backupCurrent(relativePath, backupDir) {
    const full = join(ROOT, relativePath);
    if (!existsSync(full)) return null;
    const content = readFileSync(full, 'utf8');
    const out = join(backupDir, relativePath);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, content, 'utf8');
    return content;
}

function loadSnapshot() {
    const lines = readFileSync(REWIND_PATH, 'utf8').split('\n').filter(Boolean);
    if (REWIND_LINE >= lines.length) {
        throw new Error(`Rewind line ${REWIND_LINE} missing (only ${lines.length} lines)`);
    }
    const obj = JSON.parse(lines[REWIND_LINE]);
    return obj.file_snapshots || {};
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = join(ROOT, '.tmp', `destroyed-backup-${stamp}`);
mkdirSync(backupDir, { recursive: true });

const snapshots = loadSnapshot();
console.log(`Restoring from ${REWIND_PATH} line ${REWIND_LINE}`);
console.log(`Backup dir: ${backupDir}`);

for (const relativePath of TARGETS) {
    const snap = snapshots[relativePath];
    if (!snap?.content) {
        throw new Error(`Snapshot missing content for ${relativePath}`);
    }
    backupCurrent(relativePath, backupDir);
    const out = join(ROOT, relativePath);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, snap.content, 'utf8');
    const lines = snap.content.split('\n').length;
    console.log(`OK ${relativePath}: ${lines} lines, sha256=${sha256(snap.content)}`);
}

console.log('Restore complete.');