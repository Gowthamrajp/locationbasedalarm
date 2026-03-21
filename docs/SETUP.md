# Setup & Development

## Prerequisites

- **Node.js** 20+ ([download](https://nodejs.org/))
- **Android Studio** with Android SDK ([download](https://developer.android.com/studio))
- **Java 17** (JDK)
- **Git**
- An Android device or emulator for testing

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Gowthamrajp/locationbasedalarm.git
cd locationbasedalarm
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Android SDK

Ensure `ANDROID_HOME` is set, or create `android/local.properties`:

```properties
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
```

On macOS with default Android Studio installation:
```bash
echo "sdk.dir=$HOME/Library/Android/sdk" > android/local.properties
```

### 4. Google Maps API Key

The app uses Google Maps. The API key is already configured in:
- `app.json` → `expo.android.config.googleMaps.apiKey`
- `AndroidManifest.xml` → `com.google.android.geo.API_KEY`

If you need to use your own key:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable "Maps SDK for Android"
3. Create an API key
4. Replace the key in both files above

## Running the App

### Development Mode (with hot reload)

```bash
# Start Metro bundler + run on connected Android device
npx expo run:android

# Or start Metro separately
npx expo start
# Then press 'a' for Android
```

### Release Mode (production build, no Metro needed)

```bash
npx expo run:android --variant release
```

### Build APK Only (without installing)

```bash
cd android
chmod +x gradlew
./gradlew app:assembleRelease -x lint -x test
# Output: android/app/build/outputs/apk/release/app-release.apk
```

### Build AAB for Play Store

```bash
cd android
./gradlew app:bundleRelease -x lint -x test
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

## Testing on Physical Device

### USB Debugging
1. Enable Developer Options on your Android phone (tap Build Number 7 times)
2. Enable USB Debugging in Developer Options
3. Connect via USB
4. Run `npx expo run:android`

### Install APK Directly
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

## Project Configuration Files

| File | Purpose |
|------|---------|
| `app.json` | Expo config: app name, version, permissions, icons |
| `eas.json` | EAS Build profiles (if using Expo cloud builds) |
| `android/app/build.gradle` | Android build config, signing, dependencies |
| `android/gradle.properties` | Signing credentials, build flags |
| `android/app/src/main/AndroidManifest.xml` | Android permissions |

## Common Issues

### "SDK location not found"
Create `android/local.properties` with your SDK path.

### Build fails with "Out of memory"
Increase Gradle JVM memory in `android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
```

### "Bundler cache is empty"
This is normal on first build. Metro rebuilds the cache automatically.

### Location permissions not working
Ensure you've granted "Allow all the time" location permission in Android Settings → Apps → Vigilant Path → Permissions → Location.

### Background monitoring stops
Some Android manufacturers (Xiaomi, Samsung, Huawei, OnePlus) have aggressive battery optimization. Users need to:
1. Disable battery optimization for the app
2. Allow background activity
3. Lock the app in recent apps (varies by manufacturer)
