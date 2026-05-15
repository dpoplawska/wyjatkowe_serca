#!/usr/bin/env bash
# Build a debug Android APK locally. Pairs with `make mobile-start --dev-client`.
# Run from anywhere; the script cd's to mobile/.

set -euo pipefail

export ANDROID_HOME=$HOME/android-sdk
export ANDROID_SDK_ROOT=$HOME/android-sdk
export ANDROID_NDK_HOME=$HOME/android-sdk/ndk/27.1.12297006
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/35.0.0

cd "$(dirname "$0")"

CLEAN=${CLEAN:-1}
RELEASE=${RELEASE:-0}

if [[ "$CLEAN" == "1" ]]; then
  echo "==> Cleaning previous android/ for a fresh prebuild"
  rm -rf android
fi

echo "==> Running expo prebuild"
npx expo prebuild --platform android --no-install

# WSL2 Kotlin daemon workaround (from pomo)
GRADLE_PROPS=android/gradle.properties
if ! grep -q "kotlin.compiler.execution.strategy" "$GRADLE_PROPS"; then
  echo "" >> "$GRADLE_PROPS"
  echo "# WSL2 Kotlin daemon fix" >> "$GRADLE_PROPS"
  echo "kotlin.compiler.execution.strategy=in-process" >> "$GRADLE_PROPS"
  echo "org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=2g" >> "$GRADLE_PROPS"
fi

if [[ "$RELEASE" == "1" ]]; then
  echo "==> Running gradle assembleRelease (self-contained APK, JS bundled, signed with debug keystore)"
  cd android
  ./gradlew assembleRelease
  APK=app/build/outputs/apk/release/app-release.apk
else
  echo "==> Running gradle assembleDebug (dev client APK, needs Metro)"
  cd android
  ./gradlew assembleDebug
  APK=app/build/outputs/apk/debug/app-debug.apk
fi
if [[ ! -f "$APK" ]]; then
  echo "BUILD FAILED — no APK at $APK"
  exit 1
fi

echo ""
echo "============================================================"
echo "  APK ready: mobile/android/$APK"
echo "  Size: $(du -h "$APK" | cut -f1)"
echo "============================================================"
echo ""

DROPBOX_TARGET="/mnt/c/Users/mk/Dropbox/wyjatkoweserca.apk"
if [[ -d "$(dirname "$DROPBOX_TARGET")" ]]; then
  cp "$APK" "${DROPBOX_TARGET}.tmp" && mv "${DROPBOX_TARGET}.tmp" "$DROPBOX_TARGET"
  echo "Copied to: $DROPBOX_TARGET"
else
  echo "Dropbox folder not found at $(dirname "$DROPBOX_TARGET") — skipping copy"
fi

echo ""
echo "Install on phone: copy the file or use adb if device is connected:"
echo "  adb install -r mobile/android/$APK"
