#!/usr/bin/env node
// Alias every route's bespoke *-fade-* panel surface tokens to the canonical --lux-panel-* language.
// This is what makes all panels match the timetable look (verified on programs pilot).
// Dry-run by default; --write to apply. Theme-aware: canonical tokens carry their own light-mode
// overrides, so aliasing both dark AND light definitions yields correct results in both themes.
// Core glass tokens alias to panel SSOT. Chip/row/matte stay local (not in alias guard).
// ponytail: mechanical string swap; each file is one git-revertible unit.

const fs = require('fs');
const path = require('path');
const CSS_DIR = path.resolve(__dirname, '../assets/css');
const WRITE = process.argv.includes('--write');

// token suffix -> canonical alias. Longest suffixes first so 'surface-soft' wins over 'surface'.
const MAP = [
  ['surface-hero', 'var(--lux-panel-surface)'],
  ['surface-soft', 'var(--lux-panel-surface-soft)'],
  ['surface',      'var(--lux-panel-surface)'],
  ['border-soft',  'var(--lux-panel-border-soft)'],
  ['border',       'var(--lux-panel-border)'],
  ['shadow-soft',  'var(--lux-panel-shadow-soft)'],
  ['shadow',       'var(--lux-panel-shadow)'],
  ['glow-ring',    'var(--lux-panel-glow-ring)'],
  ['control',      'var(--lux-panel-control)'],
  ['blur',         'var(--lux-panel-blur-filter)'],
  ['modal-body',   'var(--lux-panel-surface)'],
  ['modal-section','var(--lux-panel-surface-soft)'],
  ['modal-control','var(--lux-panel-control)'],
  ['modal-head-tint', 'var(--lux-panel-surface-soft)'],
  ['modal-foot-tint-light', 'var(--lux-panel-surface-soft)'],
  ['modal-foot-tint', 'var(--lux-panel-surface-soft)'],
  ['modal',        'var(--lux-panel-surface)'],
];

// Skip only the token file itself. Timetable IS aliased too: canonical was seeded from its exact
// values, so aliasing it is pixel-identical (idempotent) and makes it a consumer of the shared layer.
const files = fs.readdirSync(CSS_DIR).filter(f =>
  f.endsWith('.css') && f !== 'lux-tokens.css');

let grandTotal = 0;
const perFile = [];

for (const f of files) {
  const p = path.join(CSS_DIR, f);
  let css = fs.readFileSync(p, 'utf8');
  let hits = 0;
  for (const [suffix, alias] of MAP) {
    // Match `--<prefix>-fade-<suffix>: <value up to ;>;` where value is NOT already the alias.
    // [^;{}]+ spans newlines (gradients) but never crosses a rule boundary.
    const re = new RegExp(
      '(--[a-z0-9]+-fade-' + suffix + '\\s*:\\s*)(?!var\\(--lux-panel-)[^;{}]+;',
      'gi'
    );
    css = css.replace(re, (_m, decl) => { hits++; return decl + alias + ';'; });
  }
  if (hits) {
    grandTotal += hits;
    perFile.push({ f, hits });
    if (WRITE) fs.writeFileSync(p, css);
  }
}

perFile.sort((a, b) => b.hits - a.hits);
console.log((WRITE ? 'APPLIED' : 'DRY-RUN') + ' — *-fade-* surface tokens aliased to --lux-panel-*\n');
for (const r of perFile) console.log('  ' + r.f.padEnd(34), r.hits);
console.log(`\nTOTAL: ${grandTotal} token aliases across ${perFile.length} files` + (WRITE ? '' : '  (add --write to apply)'));