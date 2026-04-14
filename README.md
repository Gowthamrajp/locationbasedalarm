# Vigilant Path — Location-Based Alarm

A native Android app that triggers alarms when you arrive at a destination. Built with **Kotlin** and **Jetpack Compose**.

Set a pin on the map, define a geofence radius, and the app will alert you with sound and vibration when you enter that zone — even when your phone is locked or the app is in the background.

## Features

- 📍 **Location-Based Alarms** — Tap on a map or search an address to set a destination
- 🔔 **Sound & Vibration** — Alarm plays even in silent mode using `USAGE_ALARM` audio
- 🌐 **Background Monitoring** — Persistent foreground service with adaptive GPS zones
- 🔁 **Snooze & Re-trigger** — Snooze stops the alarm; re-entering the geofence triggers it again
- 📏 **Custom Radius** — Slider (50m–10km) or manual input for any distance up to 50km
- 🗺️ **Google Maps** — Full interactive map with search, marker, and geofence circle
- 🔄 **Auto-Update Check** — Fetches `version.json` from GitHub to prompt updates
- 🚀 **Boot Receiver** — Automatically restarts monitoring after device reboot

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Language | Kotlin |
| UI | Jetpack Compose + Material 3 |
| Navigation | Navigation Compose |
| Database | Room |
| Preferences | DataStore |
| Maps | Google Maps Compose |
| Location | FusedLocationProviderClient |
| Networking | OkHttp + Gson |
| Build | Gradle 8.10 + AGP 8.7 |
| Min SDK | 26 (Android 8.0) |
| Target SDK | 35 |

## Project Structure

```
android/
├── app/
│   ├── build.gradle                    # App-level build config
│   ├── proguard-rules.pro              # ProGuard rules
│   └── src/main/
│       ├── AndroidManifest.xml         # Permissions & components
│       ├── java/com/vigilantpath/locationbasedalarm/
│       │   ├── MainActivity.kt         # Entry point, navigation host
│       │   ├── MainApplication.kt      # Auto-start monitoring on launch
│       │   ├── data/
│       │   │   ├── Alarm.kt            # Room entity
│       │   │   ├── AlarmDao.kt         # Database queries
│       │   │   ├── AppDatabase.kt      # Room database singleton
│       │   │   └── PreferencesManager.kt # DataStore for app state
│       │   ├── service/
│       │   │   ├── AlarmService.kt     # Foreground service: sound + vibration
│       │   │   ├── GeofenceService.kt  # Foreground service: location monitoring
│       │   │   ├── BootReceiver.kt     # Restart monitoring on boot
│       │   │   └── UpdateService.kt    # Version check from GitHub
│       │   └── ui/
│       │       ├── navigation/
│       │       │   └── AppNavigation.kt
│       │       ├── screens/
│       │       │   ├── OnboardingScreen.kt
│       │       │   ├── AlarmListScreen.kt
│       │       │   ├── CreateAlarmScreen.kt
│       │       │   └── ActiveAlarmScreen.kt
│       │       └── theme/
│       │           ├── Theme.kt        # "Horizon Pulse" color scheme
│       │           └── Type.kt         # Typography
│       └── res/
│           ├── drawable/               # Icons
│           ├── mipmap-*/               # App launcher icons
│           ├── raw/alarm_sound.mp3     # Alarm audio
│           └── values/                 # Colors, strings, styles
├── build.gradle                        # Project-level build config
├── settings.gradle                     # Module configuration
├── gradle.properties.example           # Template for secrets
└── gradle/wrapper/                     # Gradle wrapper
```

## Setup

### Prerequisites

- Android Studio Hedgehog (2023.1.1) or later
- JDK 17
- Android SDK 35
- Google Maps API key

### Steps

1. **Clone the repo**
   ```bash
   git clone https://github.com/Gowthamrajp/locationbasedalarm.git
   cd locationbasedalarm
   ```

2. **Configure secrets** — Copy the template and add your keys:
   ```bash
   cp android/gradle.properties.example android/gradle.properties
   ```
   Edit `android/gradle.properties` and set:
   - `GOOGLE_MAPS_API_KEY` — Your Google Maps API key
   - Signing config (for release builds)

3. **Build**
   ```bash
   cd android
   ./gradlew assembleDebug
   ```

4. **Install on device**
   ```bash
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```

   Or open the `android/` folder in Android Studio and run directly.

## Permissions

| Permission | Purpose |
|-----------|---------|
| `ACCESS_FINE_LOCATION` | Precise GPS for geofencing |
| `ACCESS_COARSE_LOCATION` | Approximate location fallback |
| `ACCESS_BACKGROUND_LOCATION` | Monitor location when app is closed |
| `FOREGROUND_SERVICE` | Persistent monitoring notification |
| `FOREGROUND_SERVICE_LOCATION` | Location-specific foreground service |
| `FOREGROUND_SERVICE_MEDIA_PLAYBACK` | Alarm sound playback service |
| `POST_NOTIFICATIONS` | Alarm trigger notifications (Android 13+) |
| `VIBRATE` | Vibrate on alarm |
| `WAKE_LOCK` | Wake screen when alarm triggers |
| `RECEIVE_BOOT_COMPLETED` | Restart monitoring after reboot |
| `INTERNET` | Address search & update checks |
| `USE_FULL_SCREEN_INTENT` | Full-screen alarm notification |

## Architecture

### Navigation Flow

```
Onboarding → AlarmList → CreateAlarm (with map)
                       → ActiveAlarm (when triggered)
```

### Geofence Monitoring

The `GeofenceService` runs as a foreground service with adaptive GPS zones:

| Zone | Distance | Accuracy | Interval | Battery |
|------|----------|----------|----------|---------|
| Far | > 5km | Low | 60s / 500m | ~0.5%/hr |
| Medium | 1–5km | Balanced | 30s / 200m | ~1%/hr |
| Near | 300m–1km | High | 10s / 50m | ~2-3%/hr |
| Very Near | < 300m | Highest | 5s / 20m | ~3-5%/hr |

### Alarm Trigger Flow

1. `GeofenceService` detects user inside geofence radius
2. Starts `AlarmService` (foreground service with sound + vibration)
3. Sends high-priority notification with full-screen intent
4. App navigates to `ActiveAlarmScreen`
5. User can **Dismiss** (deactivates alarm) or **Snooze** (re-triggers on next entry)

### Data Storage

- **Room Database** (`vigilant_path_db`) — Stores all alarm records
- **DataStore** — Onboarding state, triggered/snoozed alarm IDs

## Update System

The app checks `version.json` in the GitHub repo on every launch:

```json
{
  "latestVersion": "2.0.0",
  "minimumVersion": "1.0.0",
  "latestVersionCode": 12,
  "forceUpdate": false,
  "updateMessage": "New features available!",
  "playStoreUrl": "https://play.google.com/store/apps/details?id=com.vigilantpath.locationbasedalarm"
}
```

- If current version < `minimumVersion` → **Force update** (non-dismissable dialog)
- If current version < `latestVersion` → **Optional update** prompt

## Design System

**"Horizon Pulse"** — Material 3 color palette:

- **Primary:** `#0040A1` (Deep Blue)
- **Secondary:** `#A43C12` (Burnt Orange)
- **Tertiary:** `#5B4300` (Gold)
- **Surface:** `#FAF8FF` (Near White)

## License

Private project. All rights reserved.
