#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARCHIVE="${KIU_DESKTOP_ARCHIVE:-$ROOT/anti-cheat/out/kiu-anti-cheat-public-linux-x64.tar.gz}"
INSTALL_ROOT="${KIU_DESKTOP_INSTALL_ROOT:-$HOME/.local/opt}"
APP_DIR="$INSTALL_ROOT/kiu-anti-cheat-public"
DESKTOP_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
DESKTOP_FILE="$DESKTOP_DIR/kiu-anti-cheat-public.desktop"
TEMP_DIR="$(mktemp -d)"

cleanup() {
    rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

if [[ ! -f "$ARCHIVE" ]]; then
    echo "Desktop anti-cheat archive not found: $ARCHIVE" >&2
    echo "Build it first with: KIU_PUBLIC_APP_URL=https://YOUR_HOST npm run build:anti-cheat:desktop" >&2
    exit 1
fi

mkdir -p "$INSTALL_ROOT" "$DESKTOP_DIR"
tar -xzf "$ARCHIVE" -C "$TEMP_DIR"

PACKAGE_DIR="$TEMP_DIR/anti-cheat-linux-x64"
if [[ ! -x "$PACKAGE_DIR/anti-cheat" ]]; then
    echo "Packaged anti-cheat executable was not found." >&2
    exit 1
fi

rm -rf "$APP_DIR"
mv "$PACKAGE_DIR" "$APP_DIR"

cat > "$DESKTOP_FILE" <<EOF
[Desktop Entry]
Name=KIU Anti-Cheat Browser (Public Demo)
Comment=Open protected KIU quizzes and exams
Exec=$APP_DIR/anti-cheat
Path=$APP_DIR
Terminal=false
Type=Application
Categories=Education;Security;
StartupNotify=true
EOF

chmod +x "$DESKTOP_FILE" "$APP_DIR/anti-cheat"
command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "$DESKTOP_DIR" >/dev/null 2>&1 || true

echo "Installed KIU Anti-Cheat Browser:"
echo "$APP_DIR/anti-cheat"
echo "Desktop launcher:"
echo "$DESKTOP_FILE"
