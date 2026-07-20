#!/usr/bin/env node
/**
 * Strict audit: gradient backgrounds that do NOT go through panel/fade/home tokens.
 * Evidence for "does anything still override the panel SSOT?"
 *
 *   node tools/audit-panel-overrides.js
 *   node tools/audit-panel-overrides.js --json
 *   node tools/audit-panel-overrides.js --no-write   # stdout only
 *
 * Writes docs/panel-override-audit.md by default.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CSS_DIR = path.join(ROOT, 'assets/css');
const UTIL = path.join(ROOT, 'assets/js/shared/utilities.js');
const OUT_MD = path.join(ROOT, 'docs/panel-override-audit.md');

const args = new Set(process.argv.slice(2));
const writeMd = !args.has('--no-write');
const asJson = args.has('--json');

/** True if a CSS var() name is panel/fade/home/elev language (not arbitrary). */
function isTokenVarName(name) {
  return (
    /^lux-panel([\w-]*)?$/.test(name) ||
    /^lux-elev-\d$/.test(name) ||
    /^lux-nonhome-fade-/.test(name) ||
    /^home-fade-/.test(name) ||
    /^[a-z0-9]+-fade-/.test(name) ||
    // common shell aliases that already point at panel language
    /^lux-soft-chrome-/.test(name) ||
    /^lux-focus-/.test(name) ||
    /^lux-shell-topbar-/.test(name) ||
    /^lux-shell-background$/.test(name) ||
    /^lux-shell-sidebar-/.test(name) ||
    /^lux-shell-topbar-/.test(name) ||
    // phase B collapsed parallel glass → panel (definitions alias SSOT)
    /^lux-warmglass-/.test(name) ||
    /^lms-glass-fill(-soft)?$/.test(name) ||
    /^lms-glass-(shadow|shadow-soft|blur)$/.test(name) ||
    /^lms-pro-surface(-soft)?$/.test(name) ||
    /^lms-pro-control$/.test(name) ||
    /^lms-create-glass-/.test(name) ||
    /^social-glass-/.test(name) ||
    /^group-create-(surface|blur)$/.test(name) ||
    /^[a-z0-9]+-(create|dialog|editor)-surface$/.test(name) ||
    /^project-(task-create|health|risk)-surface$/.test(name)
  );
}

function isGlassValue(val) {
  if (/gradient\s*\(/i.test(val) || /^blur\s*\(/i.test(val)) return true;
  // Token-only panel/fade backgrounds (no "gradient" word in the declaration)
  if (isTokenOk(val)) return true;
  return false;
}

function isTokenOk(val) {
  // Ignore importance for classification
  let v = val.replace(/\s*!important\s*$/i, '').trim();
  // Extract all var(--name) occurrences (with optional fallbacks)
  const vars = [];
  const re = /var\(\s*--([\w-]+)(?:\s*,[^)]*)?\)/g;
  let m;
  while ((m = re.exec(v))) vars.push(m[1]);
  if (!vars.length) return false;
  // Remove all var() calls; leftovers must not contain gradients
  const rest = v
    .replace(/var\(\s*--[\w-]+(?:\s*,[^)]*)?\)/g, '')
    .replace(/[,()\s]/g, '');
  if (rest.length > 0) return false; // raw gradient / color left
  return vars.every(isTokenVarName);
}

function severity(val, selector, file) {
  const sel = selector.toLowerCase();
  const v = val.toLowerCase();
  const isHome =
    /lux-route-home|home-fade|#page-home|#lux-home/.test(sel) ||
    file.includes('index-home-dashboard');
  if (isHome) return 'P3';

  // Full panel-soft/rich recipe fingerprints (not intentional multi-tint via card-rgb vars)
  const panelSoftish =
    /circle at 12%\s*0%/.test(v) &&
    /circle at 84%/.test(v) &&
    /linear-gradient\(135deg/.test(v);
  const panelRichish =
    /circle at 6%\s*0%/.test(v) &&
    /circle at 74%/.test(v) &&
    /linear-gradient\(135deg/.test(v);
  const intentionalTint = /student-service-card-rgb|card-rgb-2/.test(v);
  if ((panelSoftish || panelRichish) && !intentionalTint) return 'P0';
  if ((panelSoftish || panelRichish) && intentionalTint) return 'P1';

  const important = /!important/i.test(val);
  const shellish =
    /page-hero|lux-card|lux-panel|command|stage|shell|hero|surface|modal|filter-shell/.test(sel);
  if (important && shellish && /gradient/.test(v)) return 'P1';
  if (shellish && /gradient/.test(v) && /rgba\(\s*10\s*,\s*15\s*,\s*24/.test(v)) return 'P1';

  // Accent-only decorative
  if (/circle at/.test(v) && !/linear-gradient\(135deg/.test(v)) return 'P2';
  if (/gradient/.test(v)) return 'P2';
  return 'P2';
}

function findSelector(css, declIndex) {
  let i = declIndex;
  while (i > 0 && css[i] !== '{') i--;
  if (css[i] !== '{') return '(unknown)';
  let j = i - 1;
  while (j > 0 && css[j] !== '}' && css[j] !== '{') j--;
  if (css[j] === '}' || css[j] === '{') j++;
  let sel = css.slice(j, i).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim();
  if (sel.length > 120) sel = sel.slice(0, 117) + '…';
  return sel || '(unknown)';
}

function lineAt(css, index) {
  return css.slice(0, index).split('\n').length;
}

function auditCssFile(filePath) {
  const file = path.basename(filePath);
  const css = fs.readFileSync(filePath, 'utf8');
  const hits = [];
  const re = /background(?:-image)?\s*:\s*([^;]+);/gi;
  let m;
  while ((m = re.exec(css))) {
    const raw = m[1].trim();
    const val = raw.replace(/\s+/g, ' ');
    if (!isGlassValue(val)) continue;
    if (isTokenOk(val)) {
      hits.push({
        file,
        line: lineAt(css, m.index),
        kind: 'ok-token',
        severity: null,
        selector: findSelector(css, m.index),
        val: val.slice(0, 100),
      });
      continue;
    }
    const sev = severity(val, findSelector(css, m.index), file);
    hits.push({
      file,
      line: lineAt(css, m.index),
      kind: 'override-risk',
      severity: sev,
      selector: findSelector(css, m.index),
      val: val.slice(0, 120),
      important: /!important/i.test(raw),
    });
  }
  return hits;
}

function auditJsPaint() {
  if (!fs.existsSync(UTIL)) return [];
  const src = fs.readFileSync(UTIL, 'utf8');
  const lines = src.split('\n');
  const out = [];
  lines.forEach((line, idx) => {
    if (/setProperty\(\s*['"]background['"]/.test(line)) {
      out.push({ line: idx + 1, text: line.trim().slice(0, 140) });
    }
  });
  return out;
}

function main() {
  const files = fs
    .readdirSync(CSS_DIR)
    .filter((f) => f.endsWith('.css'))
    .map((f) => path.join(CSS_DIR, f));

  let all = [];
  for (const f of files) all = all.concat(auditCssFile(f));

  const risks = all.filter((h) => h.kind === 'override-risk');
  const oks = all.filter((h) => h.kind === 'ok-token');

  const bySev = { P0: [], P1: [], P2: [], P3: [] };
  for (const h of risks) bySev[h.severity || 'P2'].push(h);

  const byFile = {};
  for (const h of risks) {
    byFile[h.file] = byFile[h.file] || { P0: 0, P1: 0, P2: 0, P3: 0, total: 0 };
    byFile[h.file][h.severity]++;
    byFile[h.file].total++;
  }

  const jsPaint = auditJsPaint();

  const summary = {
    glassBackgroundsTotal: all.length,
    okToken: oks.length,
    overrideRisk: risks.length,
    bySeverity: {
      P0: bySev.P0.length,
      P1: bySev.P1.length,
      P2: bySev.P2.length,
      P3: bySev.P3.length,
    },
    topFiles: Object.entries(byFile)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 20)
      .map(([file, c]) => ({ file, ...c })),
    jsBackgroundSetProperty: jsPaint.length,
  };

  // CLI
  console.log('Panel override audit');
  console.log('--------------------');
  console.log(`  glass backgrounds scanned : ${summary.glassBackgroundsTotal}`);
  console.log(`  via tokens (ok)           : ${summary.okToken}`);
  console.log(`  raw override-risk         : ${summary.overrideRisk}`);
  console.log(
    `  P0=${summary.bySeverity.P0}  P1=${summary.bySeverity.P1}  P2=${summary.bySeverity.P2}  P3(home)=${summary.bySeverity.P3}`
  );
  console.log(`  JS setProperty(background): ${summary.jsBackgroundSetProperty}`);
  console.log('\nTop files (override-risk):');
  for (const row of summary.topFiles.slice(0, 12)) {
    console.log(
      `  ${row.file.padEnd(36)} total=${String(row.total).padStart(4)}  P0=${row.P0} P1=${row.P1} P2=${row.P2} P3=${row.P3}`
    );
  }

  if (asJson) {
    console.log(JSON.stringify({ summary, risks: risks.slice(0, 200) }, null, 2));
  }

  if (writeMd) {
    const md = buildMarkdown(summary, bySev, byFile, jsPaint);
    fs.mkdirSync(path.dirname(OUT_MD), { recursive: true });
    fs.writeFileSync(OUT_MD, md, 'utf8');
    console.log(`\nWrote ${path.relative(ROOT, OUT_MD)}`);
  }
}

function buildMarkdown(summary, bySev, byFile, jsPaint) {
  const now = new Date().toISOString().slice(0, 10);
  const lines = [];
  lines.push('# Panel override audit');
  lines.push('');
  lines.push(`Generated: ${now} by \`tools/audit-panel-overrides.js\`.`);
  lines.push('');
  lines.push('## What this means');
  lines.push('');
  lines.push('- **ok-token**: `background` uses `var(--lux-panel-*)` / route `--*-fade-*` / `--home-fade-*` / elev only.');
  lines.push('- **override-risk**: raw `linear/radial-gradient` (or similar) **not** going through those tokens — can look different from timetable panel glass.');
  lines.push('- **P0**: fingerprint matches full panel soft/rich recipe (highest priority to tokenize/delete).');
  lines.push('- **P1**: shell/hero/card-like selector + often `!important`.');
  lines.push('- **P2**: decorative / accent / partial gradients.');
  lines.push('- **P3**: home dashboard exception.');
  lines.push('');
  lines.push('Token path being green (`check-panel-token-aliases`) **does not** mean zero overrides — only that fade **variables** alias panel.');
  lines.push('');
  lines.push('## Residual policy (post panel-glass migration)');
  lines.push('');
  lines.push('- **P0 must stay 0** — competing full panel recipes are bugs.');
  lines.push('- **Remaining P1 is mostly intentional** (status/danger CTAs, badges, color-mix heroes, page-shell cream, branded modal heads) — not unfinished panel glass.');
  lines.push('- **P2** = decorative / partial; clean only when already editing a file.');
  lines.push('- **P3** = home (`--home-fade-*`) exception.');
  lines.push('- This report is **evidence**, not a CI fail gate. Contract: [shell-panels.md](./shell-panels.md).');
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Count |');
  lines.push('|--------|------:|');
  lines.push(`| Glass-like backgrounds scanned | ${summary.glassBackgroundsTotal} |`);
  lines.push(`| Via tokens (ok) | ${summary.okToken} |`);
  lines.push(`| Raw override-risk | ${summary.overrideRisk} |`);
  lines.push(`| P0 (panel recipe copy) | ${summary.bySeverity.P0} |`);
  lines.push(`| P1 (shell/card risk) | ${summary.bySeverity.P1} |`);
  lines.push(`| P2 (decorative) | ${summary.bySeverity.P2} |`);
  lines.push(`| P3 (home exception) | ${summary.bySeverity.P3} |`);
  lines.push(`| JS \`setProperty('background')\` sites | ${summary.jsBackgroundSetProperty} |`);
  lines.push('');
  lines.push('## By file (override-risk)');
  lines.push('');
  lines.push('| File | Total | P0 | P1 | P2 | P3 |');
  lines.push('|------|------:|---:|---:|---:|---:|');
  for (const row of summary.topFiles) {
    lines.push(
      `| \`${row.file}\` | ${row.total} | ${row.P0} | ${row.P1} | ${row.P2} | ${row.P3} |`
    );
  }
  lines.push('');

  function dumpSev(sev, limit) {
    const list = bySev[sev] || [];
    lines.push(`## ${sev} listings (top ${Math.min(limit, list.length)} of ${list.length})`);
    lines.push('');
    if (!list.length) {
      lines.push('_None._');
      lines.push('');
      return;
    }
    lines.push('| File | Line | Selector | Value (truncated) |');
    lines.push('|------|-----:|----------|------------------|');
    for (const h of list.slice(0, limit)) {
      const sel = h.selector.replace(/\|/g, '\\|');
      const val = h.val.replace(/\|/g, '\\|');
      lines.push(`| \`${h.file}\` | ${h.line} | \`${sel}\` | \`${val}\` |`);
    }
    lines.push('');
  }

  dumpSev('P0', 60);
  dumpSev('P1', 40);
  dumpSev('P2', 20);

  lines.push('## JS background paint sites');
  lines.push('');
  lines.push('From `assets/js/shared/utilities.js` (inline `!important` can override CSS if not stripped by keep-path):');
  lines.push('');
  if (!jsPaint.length) {
    lines.push('_None found._');
  } else {
    lines.push('| Line | Code |');
    lines.push('|-----:|------|');
    for (const j of jsPaint) {
      lines.push(`| ${j.line} | \`${j.text.replace(/\|/g, '\\|')}\` |`);
    }
  }
  lines.push('');
  lines.push('## Re-run');
  lines.push('');
  lines.push('```bash');
  lines.push('node tools/audit-panel-overrides.js');
  lines.push('npm run check:panels');
  lines.push('```');
  lines.push('');
  lines.push('Related: [shell-panels.md](./shell-panels.md), `tools/check-panel-token-aliases.js`, `tools/check-panel-snowflakes.js`.');
  lines.push('');
  return lines.join('\n');
}

main();
