#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_DIR="$ROOT/anti-cheat/android"
APK_PATH="$ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"
CONFIG_PATH="$ANDROID_DIR/app/src/main/assets/config.json"
PUBLIC_CONFIG_REQUESTED=0
for value in \
    "${KIU_ANTI_CHEAT_APP_URL:-}" \
    "${KIU_ANTI_CHEAT_BACKEND_URL:-}" \
    "${KIU_ANTI_CHEAT_QUIZ_URL:-}" \
    "${KIU_ANTI_CHEAT_EXAM_PORTAL_URL:-}" \
    "${KIU_ANTI_CHEAT_REPORTING_URL:-}" \
    "${KIU_ANTI_CHEAT_HEARTBEAT_URL:-}"; do
    if [[ -n "$value" ]]; then
        PUBLIC_CONFIG_REQUESTED=1
        break
    fi
done

if [[ -f "$APK_PATH" && "${KIU_ANDROID_FORCE_REBUILD:-0}" != "1" && "$PUBLIC_CONFIG_REQUESTED" != "1" ]]; then
    echo "Android APK already exists:"
    echo "$APK_PATH"
    exit 0
fi

if ! command -v java >/dev/null 2>&1; then
    echo "Java was not found. Install a JDK before building the Android APK." >&2
    echo "Expected output path: $APK_PATH" >&2
    exit 1
fi

SDK_DIR="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Android/Sdk}}"
LOCAL_PROPERTIES="$ANDROID_DIR/local.properties"

if [[ ! -f "$LOCAL_PROPERTIES" ]]; then
    if [[ -d "$SDK_DIR" ]]; then
        cat > "$LOCAL_PROPERTIES" <<EOF
sdk.dir=$SDK_DIR
EOF
        echo "Wrote Android SDK path to $LOCAL_PROPERTIES"
    else
        echo "Android SDK was not found. Set ANDROID_HOME or install the SDK at $SDK_DIR." >&2
        echo "Expected output path: $APK_PATH" >&2
        exit 1
    fi
fi

CONFIG_BACKUP=""
restore_android_config() {
    if [[ -n "$CONFIG_BACKUP" && -f "$CONFIG_BACKUP" ]]; then
        cp "$CONFIG_BACKUP" "$CONFIG_PATH"
        rm -f "$CONFIG_BACKUP"
    fi
}
trap restore_android_config EXIT

if [[ "$PUBLIC_CONFIG_REQUESTED" == "1" ]]; then
    if [[ ! -f "$CONFIG_PATH" ]]; then
        echo "Android anti-cheat config was not found: $CONFIG_PATH" >&2
        exit 1
    fi
    CONFIG_BACKUP="$(mktemp)"
    cp "$CONFIG_PATH" "$CONFIG_BACKUP"
    CONFIG_PATH="$CONFIG_PATH" node <<'NODE'
const fs = require('fs');

const file = process.env.CONFIG_PATH;
const config = JSON.parse(fs.readFileSync(file, 'utf8'));
const normalizeUrl = (value) => String(value || '').trim().replace(/\/+$/, '');
const appUrl = normalizeUrl(process.env.KIU_ANTI_CHEAT_APP_URL);
const backendUrl = normalizeUrl(process.env.KIU_ANTI_CHEAT_BACKEND_URL);
const quizUrl = normalizeUrl(process.env.KIU_ANTI_CHEAT_QUIZ_URL);
const examPortalUrl = normalizeUrl(process.env.KIU_ANTI_CHEAT_EXAM_PORTAL_URL);
const reportingUrl = normalizeUrl(process.env.KIU_ANTI_CHEAT_REPORTING_URL);
const heartbeatUrl = normalizeUrl(process.env.KIU_ANTI_CHEAT_HEARTBEAT_URL);

if (appUrl) config.appUrl = appUrl;
if (backendUrl) config.backendUrl = backendUrl;
if (quizUrl) config.quizUrl = quizUrl;
else if (appUrl) config.quizUrl = `${appUrl}/lms.html`;
if (examPortalUrl) config.examPortalUrl = examPortalUrl;
else if (appUrl) config.examPortalUrl = `${appUrl}/exam-portal.html`;
if (reportingUrl) config.reportingUrl = reportingUrl;
if (heartbeatUrl) config.heartbeatUrl = heartbeatUrl;

const hosts = [config.appUrl, config.backendUrl]
    .map(value => {
        try {
            return new URL(value).hostname;
        } catch (error) {
            return '';
        }
    })
    .filter(Boolean);
config.allowedDomains = Array.from(new Set([
    ...(Array.isArray(config.allowedDomains) ? config.allowedDomains : []),
    ...hosts
]));

fs.writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
console.log(`Building Android anti-cheat APK for ${config.appUrl}`);
NODE
fi

cd "$ANDROID_DIR"

if [[ -x ./gradlew ]]; then
    echo "Building Android APK with ./gradlew assembleRelease..."
    ./gradlew assembleRelease
elif command -v gradle >/dev/null 2>&1; then
    echo "Building Android APK with gradle assembleRelease..."
    gradle assembleRelease
else
    echo "Gradle was not found. Install Gradle or add a gradle wrapper, then build the APK." >&2
    echo "Expected output path: $APK_PATH" >&2
    exit 1
fi

if [[ -f "$APK_PATH" ]]; then
    echo "Android APK built successfully:"
    echo "$APK_PATH"
else
    echo "Build finished, but the APK was not found at the expected path." >&2
    echo "Expected output path: $APK_PATH" >&2
    exit 1
fi
