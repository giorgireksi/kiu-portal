#!/usr/bin/env node
// Ratchet guard: fails if the number of RAW (non-tokenized) box-shadow / backdrop-filter
// declarations grows past the committed baseline. New panels must use --lux-elev-* / --lux-panel-*
// tokens instead of one-off values. The baseline only ever ratchets DOWN — lower it when you migrate.
// Run: node tools/check-panel-snowflakes.js   (add to the check:frontend npm script)
// ponytail: a count ratchet, not a full linter. Upgrade path: per-value snap-to-scale report if needed.

const fs = require('fs');
const path = require('path');
const CSS_DIR = path.resolve(__dirname, '../assets/css');

// Baselines captured 2026-07-17 after the panel-surface migration. Lower these as you tokenize more.
// Re-baselined after counting route/home fade aliases as tokenized (not only lux-panel/elev).
// After HEAD structure restore + fade→panel aliases only (no exact-dup merges).
// Ratcheted down after 2026-07 hard-clean (LMS+timetable skins archived out of live path).
// Ratcheted down after 2026-07 mobile/layout/base legacy chrome diet.
const BASELINE = { boxShadow: 129, backdropFilter: 26 };

function listLiveCssFiles(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('_') || ent.name === 'node_modules') continue; // skip _archive
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...listLiveCssFiles(full));
    else if (ent.isFile() && ent.name.endsWith('.css')) out.push(full);
  }
  return out;
}

function countRaw(prop, tokenRe) {
  let n = 0;
  for (const full of listLiveCssFiles(CSS_DIR)) {
    const css = fs.readFileSync(full, 'utf8');
    for (const m of css.matchAll(new RegExp(prop + '\\s*:\\s*([^;]+);', 'gi'))) {
      const val = m[1].trim();
      if (/^(none|inherit|unset|initial)(\s*!important)?$/i.test(val)) continue;
      if (tokenRe.test(val)) continue;               // already tokenized → fine
      n++;
    }
  }
  return n;
}

// Accept panel/elev SSOT and route/home fade aliases that chain to them.
const boxShadow = countRaw('box-shadow', /var\(--(?:lux-(?:panel|elev|shell|droplist|popup|frosted|modal|warmglass)|[a-z0-9]+-fade-|home-fade)/);
const backdropFilter = countRaw('backdrop-filter', /var\(--(?:lux-(?:panel|surface|shell|warmglass|droplist|popup|frosted|modal)|[a-z0-9]+-fade-|home-fade)/);

let failed = false;
for (const [k, cur] of [['boxShadow', boxShadow], ['backdropFilter', backdropFilter]]) {
  const base = BASELINE[k];
  const sign = cur > base ? 'GREW ✗' : cur < base ? `improved (${base}→${cur}) — lower baseline` : 'ok';
  console.log(`  ${k.padEnd(16)} raw=${cur}  baseline=${base}  ${sign}`);
  if (cur > base) failed = true;
}

if (failed) {
  console.error('\nFAIL: new raw box-shadow/backdrop-filter added. Use --lux-elev-* / --lux-panel-* tokens instead.');
  process.exit(1);
}
console.log('\nOK: no new panel snowflakes.');

// self-check: token'd values must not be counted as raw
if (process.env.SELFTEST) {
  const tmp = 'x{box-shadow:var(--lux-elev-2);box-shadow:0 1px 2px #000;}';
  const p = path.join(CSS_DIR, '__selftest.css');
  fs.writeFileSync(p, tmp);
  const c = countRaw('box-shadow', /var\(--lux-(panel|elev)/);
  fs.unlinkSync(p);
  console.assert(c === boxShadow + 1, 'selftest: exactly one raw shadow should be counted from the temp file');
  console.log('[selftest] token-ref excluded, raw counted: OK');
}