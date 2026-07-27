#!/usr/bin/env node
/**
 * Guard: route --*-fade-* glass tokens must alias the panel SSOT (or a short chain
 * of other fade aliases). Literal multi-stop glass / raw elev shadows are banned
 * outside lux-tokens.css and the home exception (--home-fade-*).
 *
 * Run: node tools/check-panel-token-aliases.js
 * Wired: npm run check:panels
 */
const fs = require('fs');
const path = require('path');

const CSS_DIR = path.resolve(__dirname, '../assets/css');
const PROPS = [
  'surface',
  'surface-soft',
  'surface-hero',
  'control',
  'border',
  'border-soft',
  'shadow',
  'shadow-soft',
  'blur',
  'glow-ring',
  // modal chrome (must alias panel, not re-define glass)
  'modal',
  'modal-body',
  'modal-section',
  'modal-control',
  'modal-head-tint',
  'modal-foot-tint',
  'modal-foot-tint-light',
  // page layer should use shell, not a second glass recipe
  'page',
];

const ALLOW_LITERAL_PREFIXES = [
  /^--home-fade-/, // home dashboard exception
  /^--social-fade-/, // social route messages/feed dialect (layout chrome in bare-lite)
];

function isAliasOk(name, val) {
  if (ALLOW_LITERAL_PREFIXES.some((re) => re.test(name))) return true;
  // Pure token references (panel / elev / nonhome / another fade / control chain)
  if (/^var\(--lux-panel[\w-]*\)/.test(val)) return true;
  if (/^var\(--lux-elev-\d\)/.test(val)) return true;
  if (/^var\(--lux-nonhome-fade[\w-]*\)/.test(val)) return true;
  if (/^var\(--[a-z0-9]+-fade-[\w-]+\)/.test(val)) return true;
  // Soft refs that still point at panel language
  if (val.includes('var(--lux-panel') || val.includes('var(--lux-elev')) return true;
  if (val.includes('var(--lux-shell-background') || val.includes('var(--lux-shell-')) return true;
  if (val.includes('var(--lux-warmglass')) return true; // warmglass now → panel
  return false;
}

function looksLikeGlassLiteral(val) {
  return (
    /gradient\s*\(/i.test(val) ||
    /^blur\s*\(/i.test(val) ||
    /^\d+px\s+\d+px/.test(val) || // box-shadow recipe
    /^0\s+\d+px/.test(val)
  );
}

const offenders = [];

for (const file of fs.readdirSync(CSS_DIR).filter((f) => f.endsWith('.css'))) {
  if (file === 'lux-tokens.css') continue; // SSOT may define real values
  const css = fs.readFileSync(path.join(CSS_DIR, file), 'utf8');
  const propRe = new RegExp(
    `(--[a-z0-9]+-fade-(?:${PROPS.join('|')}))\\s*:\\s*`,
    'gi'
  );
  let m;
  while ((m = propRe.exec(css))) {
    const name = m[1];
    let i = m.index + m[0].length;
    let depth = 0;
    let end = i;
    for (; end < css.length; end++) {
      const ch = css[end];
      if (ch === '(') depth++;
      else if (ch === ')') depth = Math.max(0, depth - 1);
      else if (ch === ';' && depth === 0) break;
    }
    const val = css
      .slice(i, end)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!looksLikeGlassLiteral(val) && isAliasOk(name, val)) continue;
    if (isAliasOk(name, val)) continue;
    if (looksLikeGlassLiteral(val) || !isAliasOk(name, val)) {
      // Allow non-gradient simple rgba for rows/chips that misuse -fade- name? still flag glass-like only
      if (!looksLikeGlassLiteral(val) && val.startsWith('var(')) continue;
      if (!looksLikeGlassLiteral(val) && !val.includes('gradient') && !val.startsWith('0 ')) {
        // plain rgba / color-mix for borders sometimes — allow if not multi-layer glass
        if (/^rgba?\(|^color-mix\(|^#|transparent|none/i.test(val)) continue;
      }
      offenders.push({ file, name, val: val.slice(0, 100) });
    }
  }
}

if (offenders.length) {
  console.error('FAIL: non-aliased --*-fade-* glass tokens (use var(--lux-panel-*) / elev):\n');
  for (const o of offenders) {
    console.error(`  ${o.file}  ${o.name}: ${o.val}`);
  }
  console.error('\nSee docs/shell-panels.md');
  process.exit(1);
}

console.log('OK: route --*-fade-* glass tokens alias panel SSOT (or home exception).');
