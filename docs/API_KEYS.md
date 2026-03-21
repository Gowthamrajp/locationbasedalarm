# API Keys Management

## 🗺️ Google Maps API Key

### Overview

The app uses **Google Maps SDK for Android** to display interactive maps. This requires a Google Maps API key which is billed based on usage (generous free tier: 28,000 map loads/month).

### Where the Key is Used

| Location | Purpose |
|----------|---------|
| `android/gradle.properties` | Source of truth (local builds) |
| `android/app/build.gradle` | Reads key via `manifestPlaceholders` |
| `AndroidManifest.xml` | Uses `${googleMapsApiKey}` placeholder |
| GitHub Secrets | `GOOGLE_MAPS_API_KEY` (CI/CD builds) |

> ⚠️ The key is **NOT** hardcoded in source files. It's injected at build time from gradle.properties (local) or GitHub Secrets (CI).

### Setup for Local Development

1. Copy the example file:
   ```bash
   cp android/gradle.properties.example android/gradle.properties
   ```

2. Edit `android/gradle.properties` and add your key:
   ```properties
   GOOGLE_MAPS_API_KEY=AIzaSy_YOUR_ACTUAL_KEY_HERE
   ```

### Setup for CI/CD

Add `GOOGLE_MAPS_API_KEY` as a GitHub Secret:
1. Go to repo → Settings → Secrets → Actions
2. New secret: `GOOGLE_MAPS_API_KEY`
3. Value: Your API key

### How to Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **"Maps SDK for Android"** in APIs & Services → Library
4. Go to APIs & Services → Credentials
5. Click **"Create Credentials"** → **"API Key"**
6. Copy the key

### 🔒 Restrict Your API Key (IMPORTANT!)

An unrestricted API key can be abused. Always restrict it:

1. In Google Cloud Console → APIs & Services → Credentials
2. Click on your API key
3. Under **"Application restrictions"**:
   - Select **"Android apps"**
   - Add restriction:
     - Package name: `com.vigilantpath.locationbasedalarm`
     - SHA-1 fingerprint: Get it with:
       ```bash
       keytool -list -v -keystore android/app/keystores/release.keystore -alias vigilantpath 2>/dev/null | grep SHA1
       ```
4. Under **"API restrictions"**:
   - Select **"Restrict key"**
   - Choose only: **"Maps SDK for Android"**
5. Click **"Save"**

### Cost & Billing

| API | Free Tier | After Free Tier |
|-----|-----------|-----------------|
| Maps SDK for Android | $200/month credit (~28,000 loads) | $7 per 1,000 loads |
| Geocoding API | $200/month credit (~40,000 requests) | $5 per 1,000 requests |

For a personal app with < 28K monthly users, Google Maps is essentially **free**.

**Tip:** Set up a **billing alert** in Google Cloud Console → Billing → Budgets & alerts to get notified if usage exceeds a threshold.

### Rotating Your API Key

If your key is compromised:
1. Go to Google Cloud Console → Credentials
2. Create a new API key with the same restrictions
3. Update `android/gradle.properties` locally
4. Update `GOOGLE_MAPS_API_KEY` GitHub Secret
5. Rebuild and deploy
6. Delete the old API key

### Troubleshooting

**"Maps not loading" / Blank map:**
- Verify the key is correct in `gradle.properties`
- Ensure "Maps SDK for Android" is enabled in Google Cloud Console
- Check that API key restrictions match your package name and SHA-1 fingerprint
- Check billing is enabled on your Google Cloud project

**"This API key is not authorized":**
- The SHA-1 fingerprint doesn't match. You need to add both:
  - Debug keystore SHA-1 (for development)
  - Release keystore SHA-1 (for production)
  
  Get debug SHA-1:
  ```bash
  keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android 2>/dev/null | grep SHA1
  ```

### Security Checklist

- [x] API key NOT hardcoded in source code
- [x] API key loaded from `gradle.properties` (gitignored)
- [x] `gradle.properties` is in `.gitignore`
- [x] `gradle.properties.example` committed without real key
- [x] CI/CD uses GitHub Secrets for the key
- [x] AndroidManifest uses `${googleMapsApiKey}` placeholder
- [ ] API key restricted to Android apps + package name (do this in Google Cloud Console)
- [ ] API key restricted to Maps SDK only (do this in Google Cloud Console)
- [ ] Billing alert set up (recommended)
