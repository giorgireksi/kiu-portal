#!/usr/bin/env node
// Conservative dead-CSS reporter. Reports, never deletes.
// A class is a "dead candidate" only if its literal name appears in NO html and NO js file.
// Dynamic class names (built by JS string concat like 'staff-hub-'+type) are protected:
// if any live token shares the class's dashed prefix, the class is treated as maybe-dynamic, not dead.
// ponytail: static heuristic; a human confirms each candidate before deletion. Upgrade path: browser coverage run if this proves too coarse.

const fs = require('fs');
const path = require('path');
const postcss = require('postcss');

const ROOT = path.resolve(__dirname, '..');
const CSS_DIR = path.join(ROOT, 'assets/css');

// Build the "used" corpus from every html + js source token.
function walk(dir, exts, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git' || e.name.startsWith('.tmp')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, exts, out);
    else if (exts.some(x => e.name.endsWith(x))) out.push(p);
  }
  return out;
}

const sources = [
  ...walk(ROOT, ['.html']),
  ...walk(path.join(ROOT, 'assets/js'), ['.js']),
];
const corpus = sources.map(f => fs.readFileSync(f, 'utf8')).join('\n');

// Every identifier-ish token that literally appears anywhere in html/js.
const usedTokens = new Set(corpus.match(/[A-Za-z0-9_-]+/g) || []);
// Dashed prefixes of used tokens, to shield dynamically-built class names.
const usedPrefixes = new Set();
for (const t of usedTokens) {
  const parts = t.split('-');
  for (let i = 1; i < parts.length; i++) usedPrefixes.add(parts.slice(0, i).join('-') + '-');
}

function classesInFile(file) {
  const css = fs.readFileSync(file, 'utf8');
  const set = new Set();
  let root;
  try { root = postcss.parse(css); } catch { return set; }
  root.walkRules(rule => {
    const m = rule.selector.match(/\.([A-Za-z0-9_-]+)/g) || [];
    for (const c of m) set.add(c.slice(1));
  });
  return set;
}

const targets = process.argv.slice(2).length
  ? process.argv.slice(2).map(f => path.join(CSS_DIR, path.basename(f)))
  : walk(CSS_DIR, ['.css']).sort();

let totalDefined = 0, totalDead = 0, totalDynamic = 0;
const perFile = [];

for (const file of targets) {
  const classes = classesInFile(file);
  const dead = [], dynamic = [];
  for (const c of classes) {
    if (usedTokens.has(c)) continue;
    // shielded if any used token shares this class's dashed prefix (likely built at runtime)
    const isDynamic = [...usedPrefixes].some(p => c.startsWith(p));
    (isDynamic ? dynamic : dead).push(c);
  }
  totalDefined += classes.size;
  totalDead += dead.length;
  totalDynamic += dynamic.length;
  if (classes.size) perFile.push({ file: path.basename(file), defined: classes.size, dead: dead.length, dynamic: dynamic.length, deadList: dead });
}

perFile.sort((a, b) => b.dead - a.dead);
console.log('file'.padEnd(38), 'defined  dead  maybe-dynamic  dead%');
for (const r of perFile) {
  const pct = r.defined ? Math.round((r.dead / r.defined) * 100) : 0;
  console.log(r.file.padEnd(38), String(r.defined).padStart(7), String(r.dead).padStart(5), String(r.dynamic).padStart(14), String(pct + '%').padStart(6));
}
console.log('-'.repeat(80));
console.log(`TOTAL: ${totalDefined} classes defined | ${totalDead} confirmed-dead candidates | ${totalDynamic} maybe-dynamic (shielded)`);

if (process.env.LIST) {
  console.log('\n=== dead-candidate class names (safe to review for deletion) ===');
  for (const r of perFile) if (r.dead) console.log(`\n# ${r.file}\n` + r.deadList.sort().join('\n'));
}

// self-check: prefix shield must protect a known dynamic pattern
if (process.env.SELFTEST) {
  const shielded = [...usedPrefixes].some(p => 'staff-hub-info-card'.startsWith(p));
  console.assert(usedTokens.size > 100, 'corpus should be large');
  console.log('\n[selftest] corpus tokens:', usedTokens.size, '| staff-hub- shield active:', shielded);
}