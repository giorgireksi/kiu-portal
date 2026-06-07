#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_DIR="$ROOT/anti-cheat/android"
APK_PATH="$ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"

if [[ -f "$APK_PATH" ]]; then
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
