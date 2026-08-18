#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT/anti-cheat"
CONFIG_PATH="$APP_DIR/src/config.json"
PUBLIC_URL="${KIU_PUBLIC_APP_URL:-${KIU_ANTI_CHEAT_APP_URL:-}}"

PUBLIC_URL="${PUBLIC_URL%/}"
if [[ ! "$PUBLIC_URL" =~ ^https://[^/]+$ ]]; then
    echo "Set KIU_PUBLIC_APP_URL to an HTTPS origin." >&2
    echo "Example: KIU_PUBLIC_APP_URL=https://demo.example.ts.net npm run build:anti-cheat:desktop" >&2
    exit 1
fi

CONFIG_BACKUP="$(mktemp)"
cp "$CONFIG_PATH" "$CONFIG_BACKUP"
restore_config() {
    cp "$CONFIG_BACKUP" "$CONFIG_PATH"
    rm -f "$CONFIG_BACKUP"
}
trap restore_config EXIT

CONFIG_PATH="$CONFIG_PATH" PUBLIC_URL="$PUBLIC_URL" node <<'NODE'
const fs = require('fs');

const file = process.env.CONFIG_PATH;
const appUrl = process.env.PUBLIC_URL;
const config = JSON.parse(fs.readFileSync(file, 'utf8'));
const host = new URL(appUrl).hostname;

config.appUrl = appUrl;
config.backendUrl = appUrl;
config.quizUrl = `${appUrl}/exam-portal.html`;
config.allowedDomains = Array.from(new Set([
    ...(Array.isArray(config.allowedDomains) ? config.allowedDomains : []),
    host
]));

fs.writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
console.log(`Building desktop anti-cheat browser for ${appUrl}`);
NODE

cd "$APP_DIR"
if npm run make; then
    echo
    echo "Desktop anti-cheat artifacts are under:"
    echo "$APP_DIR/out/make/"
    exit 0
fi

echo
echo "Native Linux makers are unavailable; creating a portable Linux archive..."
npm run package
PACKAGE_DIR="$(node - <<'NODE'
const fs = require('fs');
const path = require('path');
const outDir = path.resolve('out');
const entry = fs.readdirSync(outDir, { withFileTypes: true })
    .find(item => item.isDirectory() && /linux-x64$/.test(item.name));
process.stdout.write(entry ? path.join(outDir, entry.name) : '');
NODE
)"
if [[ -z "$PACKAGE_DIR" || ! -d "$PACKAGE_DIR" ]]; then
    echo "Electron packaged output was not found under $APP_DIR/out." >&2
    exit 1
fi

ARCHIVE_PATH="$APP_DIR/out/kiu-anti-cheat-public-linux-x64.tar.gz"
tar -czf "$ARCHIVE_PATH" -C "$(dirname "$PACKAGE_DIR")" "$(basename "$PACKAGE_DIR")"
echo
echo "Portable desktop anti-cheat archive:"
echo "$ARCHIVE_PATH"

