# Testing

## 🧪 E2E Testing with Appium

The app uses **Appium + WebdriverIO** for end-to-end (E2E) testing on Android.

### Test Structure

```
tests/
└── appium/
    ├── wdio.conf.js              # WebdriverIO configuration
    └── specs/
        ├── onboarding.test.js    # Onboarding flow tests
        ├── alarm-list.test.js    # Alarm list screen tests
        └── create-alarm.test.js  # Alarm creation tests
```

### Test Cases

#### Onboarding Tests (`onboarding.test.js`)
- ✅ Welcome screen displays on first launch
- ✅ Feature chips visible (GPS, Sound, Vibration, Snooze)
- ✅ Navigate to location permission screen
- ✅ Privacy details visible

#### Alarm List Tests (`alarm-list.test.js`)
- ✅ Alarm list screen displays
- ✅ Empty state shown when no alarms
- ✅ FAB button visible
- ✅ Bottom tab bar visible (Alarms, Explore, Settings)
- ✅ App title visible
- ✅ Navigate to create alarm via FAB

#### Create Alarm Tests (`create-alarm.test.js`)
- ✅ Create alarm screen displays
- ✅ Search bar visible
- ✅ Save button visible
- ✅ Alarm name input visible
- ✅ Radius section visible with default 500m
- ✅ Vibrate toggle visible
- ✅ Sound toggle visible
- ✅ Alert shown when saving without location

### Quick Commands (Makefile)

```bash
make test        # Full pipeline: build → install → test
make test-only   # Run Appium tests only (APK must exist)
make build       # Build APK only
make install     # Build + install on device
make check       # Build + test, shows "safe to push"
make help        # Show all commands
```

Or use the script directly:
```bash
./scripts/local-build-test.sh
```

The script runs 5 steps:
1. ✅ Check prerequisites (Android SDK, device)
2. ✅ Install npm dependencies
3. ✅ Build release APK
4. ✅ Install on connected device
5. ✅ Run Appium E2E tests

If any step fails, the script exits with an error — preventing you from pushing broken code.

### Running Tests Locally (Manual)

#### Prerequisites
```bash
# Install Appium globally
npm install -g appium
appium driver install uiautomator2

# Install WebdriverIO deps
npm install @wdio/cli @wdio/local-runner @wdio/mocha-framework @wdio/spec-reporter @wdio/appium-service webdriverio
```

#### Run Tests
```bash
# 1. Build the APK
cd android && ./gradlew app:assembleRelease -x lint -x test

# 2. Start an emulator or connect a device
# 3. Start Appium
appium --relaxed-security &

# 4. Run tests
npx wdio tests/appium/wdio.conf.js
```

### CI/CD Pipeline

Tests run automatically in GitHub Actions on every push/PR:

```
Push/PR → Build APK → Run Appium E2E Tests → (Pass?) → Deploy
                                                  ↓
                                              (Fail?) → Block Deploy
```

The pipeline uses `reactivecircus/android-emulator-runner` to spin up an Android emulator in CI.

### Adding New Tests

1. Create a new file in `tests/appium/specs/`
2. Follow the pattern:
```javascript
describe('Feature Name', () => {
  it('should do something', async () => {
    const element = await $('//*[contains(@text, "Expected Text")]');
    await expect(element).toBeDisplayed();
  });
});
```

3. Common selectors:
- By text: `$('//*[contains(@text, "Button Text")]')`
- By accessibility ID: `$('~accessibilityLabel')`
- By class: `$('android.widget.TextView')`

### Test Strategy

| Level | Tool | What it Tests | When it Runs |
|-------|------|--------------|-------------|
| E2E (Appium) | WebdriverIO + Appium | Full user flows on real/emulated device | Every push/PR |
| Future: Unit | Jest | Pure functions (distance calc, version compare) | Every push |
| Future: Component | React Native Testing Library | Individual screen rendering | Every push |
