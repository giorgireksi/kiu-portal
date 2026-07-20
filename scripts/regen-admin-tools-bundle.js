const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, '..', 'assets', 'js', 'features', 'index-admin-tools.bundle-source.js');
const plainPath = path.join(__dirname, '..', 'assets', 'js', 'features', 'index-admin-tools.plain.js');
const outPath = path.join(__dirname, '..', 'assets', 'js', 'features', 'index-admin-tools.js');
const src = fs.readFileSync(sourcePath, 'utf8');
fs.writeFileSync(plainPath, src);

const PLAIN_URL = 'assets/js/features/index-admin-tools.plain.js?v=20260718-adminplain1';
const out = `(function registerLuxuryAdminToolsChunk() {
  if (typeof window.__kiuRegisterLuxuryAdminToolsChunkUrl === "function") {
    window.__kiuRegisterLuxuryAdminToolsChunkUrl("${PLAIN_URL}");
    return;
  }
  window.__kiuLuxuryAdminToolsChunkUrl = "${PLAIN_URL}";
})();
`;
fs.writeFileSync(outPath, out);
console.log('admin-tools plain chunk:', plainPath);
console.log('registrar:', outPath);
