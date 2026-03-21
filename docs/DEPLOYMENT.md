# Deployment Guide

## 📦 Google Play Store — First Upload

### Step 1: Create App on Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Click **"Create app"**
3. Fill in:
   - **App name:** Vigilant Path
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free
4. Accept declarations and create

### Step 2: Complete Store Listing

Navigate to **Grow → Store presence → Main store listing**:

| Field | Value |
|-------|-------|
| App name | Vigilant Path |
| Short description | Location-based alarm that wakes you when you arrive at your destination |
| Full description | See below |
| App icon | 512x512 PNG (use `assets/icon.png` or create a 512px version) |
| Feature graphic | 1024x500 PNG (create one showcasing the app) |
| Phone screenshots | At least 2 screenshots (use phone screen captures) |

**Suggested full description:**
```
Vigilant Path is a smart location-based alarm app that alerts you when you reach your destination. Perfect for commuters, travelers, and anyone who needs location-aware reminders.

🔔 KEY FEATURES:
• Set alarms for any location on the map
• Search for places and addresses
• Custom geofence radius (50m to 10km)
• Continuous alarm with sound and vibration
• Background monitoring — works even when the app is closed
• Snooze feature — re-triggers when you leave and come back
• Multiple alarm support with individual settings

📍 HOW IT WORKS:
1. Open the app and tap + to create a new alarm
2. Select a location on the map or search for an address
3. Set your desired radius and alarm preferences
4. The app monitors your location in the background
5. When you enter the geofence, the alarm triggers!

Perfect for bus/train commuters who need to wake up before their stop, travelers approaching their hotel, or anyone who needs a location-based reminder.
```

### Step 3: Complete App Content

Navigate to **Policy → App content** and complete:
- **Privacy policy** — You need a URL (create one on your website or use a free generator)
- **Ads declaration** — No ads
- **App access** — All functionality available without restrictions
- **Content ratings** — Complete the IARC questionnaire
- **Target audience** — 13+ (uses location)
- **Data safety** — Declare location data collection (on-device only, not shared)

### Step 4: Upload AAB

1. Navigate to **Release → Production** (or **Testing → Internal testing** for first test)
2. Click **"Create new release"**
3. Upload the AAB file: `android/app/build/outputs/bundle/release/app-release.aab`
4. Add release notes from `whatsnew/en-US/default.txt`
5. Click **"Review release"** → **"Start rollout"**

### Step 5: Review

- Internal testing: Available immediately
- Production: Google reviews within 1-7 days (first submission may take longer)

---

## 🔄 CI/CD Pipeline (GitHub Actions)

### How It Works

The CI/CD pipeline is defined in `.github/workflows/build-and-deploy.yml`:

```
Push to main branch     → Builds APK → Uploads as artifact (for testing)
Push tag v*.*.*         → Builds AAB → Uploads to Play Store → Creates GitHub Release
Pull request to main    → Builds APK → Uploads as artifact (for review)
```

### Setup GitHub Secrets (One-Time)

Go to your GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**

#### Required Secrets:

**1. `KEYSTORE_BASE64`** — Your keystore encoded as base64
```bash
# Run this locally and copy the output
base64 android/app/keystores/release.keystore | pbcopy
# Paste as the secret value
```

**2. `KEYSTORE_PASSWORD`**
```
VigilantPath2026
```

**3. `KEY_ALIAS`**
```
vigilantpath
```

**4. `KEY_PASSWORD`**
```
VigilantPath2026
```

**5. `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`** (for auto-deploy to Play Store)

To create a service account:
1. Go to [Google Play Console](https://play.google.com/console) → **Settings → API access**
2. Click **"Create new service account"**
3. Follow the link to Google Cloud Console
4. Create a service account with **"Service Account User"** role
5. Create a JSON key and download it
6. Back in Play Console, grant the service account **"Release manager"** permission
7. Copy the entire JSON file content as the secret value

### Deploy a Release

```bash
# 1. Update version in app.json and android/app/build.gradle
# 2. Update version.json with new version numbers
# 3. Update whatsnew/en-US/default.txt with release notes
# 4. Commit changes
git add .
git commit -m "Release v1.1.0"

# 5. Create and push a tag
git tag v1.1.0
git push origin main --tags
```

This triggers the pipeline which:
1. ✅ Builds the AAB with production signing
2. ✅ Uploads to Play Store Internal Testing track
3. ✅ Creates a GitHub Release with the AAB attached

### Promote to Production

After testing on Internal track:
1. Go to Play Console → **Release → Internal testing**
2. Click **"Promote release"** → **"Production"**
3. Review and confirm

### Manual Build Downloads

Every push to `main` produces a downloadable APK:
1. Go to GitHub repo → **Actions** tab
2. Click the latest workflow run
3. Download the **"app-release-apk"** artifact

---

## 📋 Version Bumping Checklist

When releasing a new version, update these files:

| File | What to Update |
|------|---------------|
| `app.json` | `expo.version` (e.g., "1.1.0") |
| `android/app/build.gradle` | `versionCode` (increment by 1) and `versionName` |
| `version.json` | `latestVersion`, `latestVersionCode` |
| `whatsnew/en-US/default.txt` | Release notes |
| `package.json` | `version` (optional, for consistency) |

### Example: Bumping from 1.0.0 to 1.1.0

```bash
# app.json: "version": "1.1.0"
# build.gradle: versionCode 2, versionName "1.1.0"
# version.json: latestVersion "1.1.0", latestVersionCode 2
# package.json: "version": "1.1.0"
```

---

## 🌍 Release Tracks

| Track | Purpose | Availability |
|-------|---------|-------------|
| Internal testing | Team testing | Invited testers only |
| Closed testing | Beta testing | Up to 100 testers |
| Open testing | Public beta | Anyone can join |
| Production | Live release | All Play Store users |

**Recommended flow:** Internal → Closed → Production
