# Signing & Security

## 🔐 App Signing Overview

Android requires all apps to be digitally signed before installation. The signing keystore is critical — it proves you are the owner of the app on the Play Store.

> ⚠️ **CRITICAL: If you lose your keystore, you cannot update your app on the Play Store. You would have to create a new app with a new package name. Back it up securely!**

## 📋 Current Signing Configuration

| Property | Value |
|----------|-------|
| Keystore file | `android/app/keystores/release.keystore` |
| Keystore type | PKCS12 |
| Key alias | `vigilantpath` |
| Key algorithm | RSA 2048-bit |
| Validity | 10,000 days (~27 years) |
| Certificate DN | CN=Vigilant Path, OU=Mobile, O=Gowthamraj, L=Bangalore, ST=Karnataka, C=IN |

### Passwords
| Secret | Value |
|--------|-------|
| Store password | `VigilantPath2026` |
| Key password | `VigilantPath2026` |

## 🔑 How Signing Works

### Local Builds

The signing config is loaded from `android/gradle.properties`:
```properties
VIGILANT_STORE_FILE=keystores/release.keystore
VIGILANT_STORE_PASSWORD=VigilantPath2026
VIGILANT_KEY_ALIAS=vigilantpath
VIGILANT_KEY_PASSWORD=VigilantPath2026
```

The `android/app/build.gradle` reads these and applies them to the release signing config.

### CI/CD Builds (GitHub Actions)

In CI, the keystore is stored as a base64-encoded GitHub Secret (`KEYSTORE_BASE64`) and decoded at build time. The password and alias are also stored as secrets.

The build.gradle has a fallback chain:
1. **Gradle properties** (local) → Used for local development
2. **Environment variables** (CI) → Used in GitHub Actions
3. **Debug keystore** (fallback) → Used if neither is configured

## 🛡️ Security Best Practices

### DO ✅
- **Back up your keystore** to a secure location (cloud drive, password manager, USB)
- **Back up your passwords** in a password manager
- Store keystore secrets in **GitHub Secrets** (encrypted at rest)
- Keep the keystore **out of git** (it's in `.gitignore`)
- Use **Google Play App Signing** as additional protection

### DON'T ❌
- Don't commit the keystore to git
- Don't share passwords in plain text
- Don't store passwords in source code
- Don't use the debug keystore for Play Store releases

## 📦 Backup Your Keystore

### Option 1: Secure Cloud Storage
```bash
# Copy to a secure location
cp android/app/keystores/release.keystore ~/Dropbox/secure/vigilantpath-keystore.keystore
```

### Option 2: Base64 Encode (for storage in password managers)
```bash
base64 android/app/keystores/release.keystore > keystore-backup.txt
# Store keystore-backup.txt in your password manager
```

### Option 3: Verify Your Keystore
```bash
keytool -list -v -keystore android/app/keystores/release.keystore -alias vigilantpath
# Enter password when prompted
```

## 🔄 Google Play App Signing (Recommended)

Google Play offers an additional layer of protection called **Play App Signing**:

1. Go to Play Console → **Setup → App signing**
2. Choose **"Use Google-generated key"** or upload your own
3. Google manages the signing key and you use an **upload key**

Benefits:
- If you lose your upload key, Google can help you reset it
- Smaller APK sizes (Google optimizes per device)
- Additional security layer

## 🆕 Creating a New Keystore (if needed)

```bash
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore android/app/keystores/release.keystore \
  -alias vigilantpath \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass YOUR_PASSWORD \
  -keypass YOUR_PASSWORD \
  -dname "CN=Your Name, OU=Mobile, O=Your Org, L=City, S=State, C=Country"
```

## 🔍 Verify APK/AAB Signature

```bash
# For APK
jarsigner -verify -verbose -certs android/app/build/outputs/apk/release/app-release.apk

# For AAB (requires bundletool)
jarsigner -verify android/app/build/outputs/bundle/release/app-release.aab
```

## 📝 SHA-256 Fingerprint (for Google APIs)

If you need the SHA-256 fingerprint for API key restrictions:
```bash
keytool -list -v -keystore android/app/keystores/release.keystore -alias vigilantpath 2>/dev/null | grep SHA256
```
