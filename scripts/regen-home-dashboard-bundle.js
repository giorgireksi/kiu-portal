const fs = require('fs');
const path = require('path');

const featuresDir = path.join(__dirname, '..', 'assets', 'js', 'features');
const partsDir = path.join(featuresDir, 'home-dashboard');
const plainPath = path.join(featuresDir, 'index-home-dashboard.plain.js');
const outPath = path.join(featuresDir, 'index-home-dashboard.js');

/** Editable SSOT: assets/js/features/home-dashboard/*.js (order fixed). */
const HOME_DASHBOARD_PARTS = [
  'prefs-visuals.js',
  'widget-layout.js',
  'editor-draft.js',
  'widget-render.js',
  'editor-ui.js',
  'shell.js'
];

function readPart(fileName) {
  return fs.readFileSync(path.join(partsDir, fileName), 'utf8').replace(/\s+$/, '');
}

function buildHomeDashboardSource() {
  return `${HOME_DASHBOARD_PARTS.map(readPart).join('\n\n')}\n`;
}

const bundleSource = buildHomeDashboardSource();
// Plain source for fetch+install (no base64 wire tax / atob cost).
fs.writeFileSync(plainPath, bundleSource);

const PLAIN_URL = 'assets/js/features/index-home-dashboard.plain.js?v=20260719-homewd1';
const out = `(function registerLuxuryHomeDashboardChunk() {
    if (typeof window.__kiuRegisterLuxuryHomeChunkUrl === 'function') {
        window.__kiuRegisterLuxuryHomeChunkUrl('${PLAIN_URL}');
        return;
    }
    // Fallback if runtime not ready yet: store URL for later ensure.
    window.__kiuLuxuryHomeChunkUrl = '${PLAIN_URL}';
})();
`;
fs.writeFileSync(outPath, out);
console.log('home-dashboard SSOT: features/home-dashboard/* (' + HOME_DASHBOARD_PARTS.length + ' parts)');
console.log('plain chunk:', plainPath);
console.log('registrar:', outPath);
