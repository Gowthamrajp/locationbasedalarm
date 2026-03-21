# Update System

## 🔄 Overview

Vigilant Path uses a **remote version check** system that allows you to force users to update without any backend server — just by editing a JSON file in your GitHub repo.

## How It Works

```
App Launch
    │
    ▼
Fetch version.json from GitHub (raw.githubusercontent.com)
    │
    ▼
Compare current app version with remote config
    │
    ├── currentVersion < minimumVersion  →  FORCE UPDATE (non-dismissable)
    │                                        → Opens Play Store → Exits app
    │
    ├── currentVersion < latestVersion   →  OPTIONAL UPDATE (dismissable)
    │                                        → "Update" or "Later" buttons
    │
    └── currentVersion >= latestVersion  →  No action (up to date)
```

## 📄 version.json Configuration

Located at project root: `version.json`

```json
{
  "latestVersion": "1.0.0",
  "latestVersionCode": 1,
  "minimumVersion": "1.0.0",
  "minimumVersionCode": 1,
  "forceUpdate": false,
  "updateMessage": "A new version of Vigilant Path is available!",
  "playStoreUrl": "https://play.google.com/store/apps/details?id=com.vigilantpath.locationbasedalarm"
}
```

### Fields Explained

| Field | Type | Description |
|-------|------|-------------|
| `latestVersion` | string | The newest version available on Play Store |
| `latestVersionCode` | number | Android versionCode of the latest version |
| `minimumVersion` | string | The minimum version users must have (older = force update) |
| `minimumVersionCode` | number | Android versionCode of minimum version |
| `forceUpdate` | boolean | If `true`, forces ALL users to update regardless of version |
| `updateMessage` | string | Custom message shown in the update dialog |
| `playStoreUrl` | string | URL to open when user taps "Update" |

## 📖 Usage Scenarios

### Scenario 1: New Version Available (Optional Update)

You've released v1.1.0 with new features. Users on v1.0.0 should see a gentle prompt.

```json
{
  "latestVersion": "1.1.0",
  "latestVersionCode": 2,
  "minimumVersion": "1.0.0",
  "minimumVersionCode": 1,
  "forceUpdate": false,
  "updateMessage": "Version 1.1.0 is available with new features! Update now for the best experience."
}
```

**Result:** Users on v1.0.0 see a dismissable "Update Available" dialog with "Update" and "Later" buttons.

### Scenario 2: Critical Bug Fix (Force Update)

You've found a critical bug in v1.0.0 and released v1.0.1. All users MUST update.

```json
{
  "latestVersion": "1.0.1",
  "latestVersionCode": 2,
  "minimumVersion": "1.0.1",
  "minimumVersionCode": 2,
  "forceUpdate": false,
  "updateMessage": "A critical security update is required. Please update to continue using the app."
}
```

**Result:** Users on v1.0.0 see a **non-dismissable** dialog. They can only tap "Update Now" which opens Play Store and exits the app.

### Scenario 3: Emergency — Force All Users to Update

Something is terribly wrong with all current versions. Force everyone.

```json
{
  "forceUpdate": true,
  "updateMessage": "An emergency update is required. Please update immediately."
}
```

**Result:** ALL users, regardless of version, see a force update dialog.

### Scenario 4: Disable Force Update

Everything is fine, just let users know about the latest version.

```json
{
  "forceUpdate": false,
  "minimumVersion": "1.0.0"
}
```

**Result:** Only users below minimum version are forced. Others see optional update if behind latest.

## 🔧 Technical Implementation

### Files Involved

| File | Role |
|------|------|
| `src/services/UpdateService.js` | Fetches config, compares versions, shows alerts |
| `App.js` | Calls `checkForUpdates()` on app launch |
| `version.json` | Remote config hosted on GitHub |

### UpdateService.js Exports

```javascript
// Check for updates and return config with comparison results
checkForUpdates() → Promise<{
  currentVersion, latestVersion, minimumVersion,
  isBelowMinimum, isUpdateAvailable, needsForceUpdate
} | null>

// Show a non-dismissable force update alert
showForceUpdateAlert(config)

// Show a dismissable optional update alert  
showOptionalUpdateAlert(config)

// Utility functions
getCurrentVersion()      // Returns app version from expo config
getCurrentVersionCode()  // Returns Android versionCode
compareVersions(a, b)    // Compares semver strings: -1, 0, or 1
```

### Version Comparison Logic

Uses semantic versioning comparison:
- `"1.0.0"` vs `"1.0.1"` → -1 (older)
- `"1.1.0"` vs `"1.0.0"` → 1 (newer)  
- `"1.0.0"` vs `"1.0.0"` → 0 (equal)
- `"2.0.0"` vs `"1.9.9"` → 1 (newer)

### Config URL

The version config is fetched from:
```
https://raw.githubusercontent.com/Gowthamrajp/locationbasedalarm/main/version.json
```

This uses GitHub's raw content CDN, which:
- Is **free** and highly available
- Updates within ~5 minutes of pushing to `main`
- Has `no-cache` headers to prevent stale data

### Offline Behavior

If the fetch fails (no internet, GitHub down), the update check silently fails and the app continues normally. Users are never blocked from using the app due to network issues.

## 📋 Update Deployment Workflow

```bash
# 1. Make your code changes and build
# 2. Update version numbers in all files
# 3. Update version.json:
{
  "latestVersion": "1.2.0",
  "latestVersionCode": 3,
  "minimumVersion": "1.1.0",  // Only force update for very old versions
  ...
}

# 4. Commit and push
git add .
git commit -m "Release v1.2.0"
git tag v1.2.0
git push origin main --tags

# 5. CI/CD builds and deploys to Play Store
# 6. Users launching the app will see the update prompt
```

## ⚡ How Fast Do Updates Propagate?

| Step | Time |
|------|------|
| Push `version.json` to GitHub | Instant |
| GitHub raw CDN updates | ~1-5 minutes |
| User opens app and sees prompt | Next app launch |
| Play Store processes new AAB | 30 min - 24 hours |
| Play Store review (new version) | Usually same day |
