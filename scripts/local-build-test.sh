#!/bin/bash
# ============================================================
# Local Build & Test Script for Vigilant Path
# ============================================================
# Run this BEFORE pushing or creating a PR:
#   ./scripts/local-build-test.sh
#
# What it does:
# 1. Builds the release APK
# 2. Installs on connected device/emulator
# 3. Runs Appium E2E tests (if Appium is available)
# 4. Reports pass/fail
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Vigilant Path - Local Build & Test     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Check prerequisites
echo -e "${YELLOW}[1/5] Checking prerequisites...${NC}"

if [ -z "$ANDROID_HOME" ]; then
  export ANDROID_HOME="$HOME/Library/Android/sdk"
fi

if [ ! -d "$ANDROID_HOME" ]; then
  echo -e "${RED}❌ Android SDK not found at $ANDROID_HOME${NC}"
  exit 1
fi
echo -e "${GREEN}  ✓ Android SDK found${NC}"

# Check for connected device
DEVICE_COUNT=$($ANDROID_HOME/platform-tools/adb devices 2>/dev/null | grep -c "device$" || true)
if [ "$DEVICE_COUNT" -eq 0 ]; then
  echo -e "${YELLOW}  ⚠ No device/emulator connected. Build will proceed but tests will be skipped.${NC}"
  NO_DEVICE=true
else
  echo -e "${GREEN}  ✓ Device connected ($DEVICE_COUNT device(s))${NC}"
  NO_DEVICE=false
fi

# Step 2: Install dependencies
echo ""
echo -e "${YELLOW}[2/5] Installing dependencies...${NC}"
npm install --silent 2>/dev/null
echo -e "${GREEN}  ✓ Dependencies installed${NC}"

# Step 3: Build APK
echo ""
echo -e "${YELLOW}[3/5] Building release APK...${NC}"
cd android
chmod +x gradlew
./gradlew app:assembleRelease -x lint -x test --no-daemon -q 2>&1
cd ..

APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_PATH" ]; then
  APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
  echo -e "${GREEN}  ✓ APK built successfully ($APK_SIZE)${NC}"
else
  echo -e "${RED}❌ APK build failed!${NC}"
  exit 1
fi

# Step 4: Install on device
echo ""
echo -e "${YELLOW}[4/5] Installing on device...${NC}"
if [ "$NO_DEVICE" = true ]; then
  echo -e "${YELLOW}  ⚠ Skipped (no device connected)${NC}"
else
  $ANDROID_HOME/platform-tools/adb install -r "$APK_PATH" 2>/dev/null
  echo -e "${GREEN}  ✓ Installed on device${NC}"
fi

# Step 5: Run E2E tests
echo ""
echo -e "${YELLOW}[5/5] Running E2E tests...${NC}"

# Check if Appium is available
if command -v appium &> /dev/null && [ "$NO_DEVICE" = false ]; then
  echo "  Starting Appium..."
  appium --relaxed-security &>/dev/null &
  APPIUM_PID=$!
  sleep 5

  echo "  Running tests..."
  APK_PATH=$(pwd)/$APK_PATH npx wdio tests/appium/wdio.conf.js 2>&1
  TEST_EXIT=$?

  # Kill Appium
  kill $APPIUM_PID 2>/dev/null || true

  if [ $TEST_EXIT -eq 0 ]; then
    echo -e "${GREEN}  ✓ All E2E tests passed!${NC}"
  else
    echo -e "${RED}  ❌ Some E2E tests failed (exit code: $TEST_EXIT)${NC}"
    echo -e "${RED}  Fix the failures before pushing.${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}  ⚠ Skipped (Appium not installed or no device)${NC}"
  echo -e "${YELLOW}  Install: npm install -g appium && appium driver install uiautomator2${NC}"
fi

# Done
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ All checks passed! Safe to push.    ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "Next steps:"
echo -e "  ${BLUE}git add -A && git commit -m 'your message'${NC}"
echo -e "  ${BLUE}git push origin main${NC}"
echo -e "  Or create a PR: ${BLUE}gh pr create${NC}"
echo ""
