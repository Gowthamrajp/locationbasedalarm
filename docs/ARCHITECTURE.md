# Architecture

## 📁 Project Structure

```
locationbasedalarm/
├── App.js                          # Root component, navigation, update checks
├── index.js                        # Entry point
├── app.json                        # Expo configuration
├── package.json                    # Dependencies
├── version.json                    # Remote version config for forced updates
├── eas.json                        # EAS Build configuration
│
├── src/
│   ├── screens/
│   │   ├── OnboardingScreen.js     # First-time user onboarding flow
│   │   ├── AlarmListScreen.js      # Main screen - list of all alarms
│   │   ├── CreateAlarmScreen.js    # Create/edit alarm with map
│   │   └── ActiveAlarmScreen.js    # Triggered alarm with sound/vibration
│   │
│   ├── services/
│   │   ├── GeofenceService.js      # Background location monitoring & geofencing
│   │   └── UpdateService.js        # App version check & forced update logic
│   │
│   ├── components/
│   │   ├── BottomTabBar.js         # Bottom navigation tab bar
│   │   └── GradientButton.js       # Reusable gradient button component
│   │
│   ├── constants/
│   │   └── theme.js                # Design tokens: colors, typography, spacing
│   │
│   └── navigation/                 # (Reserved for future navigation config)
│
├── assets/
│   ├── alarm-sound.mp3             # Generated alarm beep sound (WAV in MP3 container)
│   ├── icon.png                    # App icon
│   ├── splash-icon.png             # Splash screen icon
│   ├── android-icon-*.png          # Adaptive icon layers
│   └── fonts/                      # Custom fonts directory
│
├── android/                        # Native Android project
│   ├── app/
│   │   ├── build.gradle            # App-level build config with signing
│   │   ├── keystores/              # Production keystore (gitignored)
│   │   └── src/main/
│   │       └── AndroidManifest.xml # Permissions & app config
│   ├── build.gradle                # Project-level build config
│   └── gradle.properties           # Signing credentials & build settings
│
├── .github/
│   └── workflows/
│       └── build-and-deploy.yml    # CI/CD pipeline
│
├── docs/                           # Documentation
│   ├── README.md                   # Documentation index
│   ├── FEATURES.md                 # Feature list
│   ├── ARCHITECTURE.md             # This file
│   ├── SETUP.md                    # Development setup
│   ├── DEPLOYMENT.md               # Deployment guide
│   ├── SIGNING.md                  # Signing & security
│   └── UPDATE_SYSTEM.md            # Update mechanism
│
└── whatsnew/
    └── en-US/
        └── default.txt             # Play Store "What's New" text
```

## 🏗 Architecture Overview

### Navigation Flow

```
App.js (NavigationContainer)
├── OnboardingScreen     (first launch only)
├── AlarmListScreen      (main screen, default)
├── CreateAlarmScreen    (modal, slide from bottom)
└── ActiveAlarmScreen    (fullscreen modal, fade)
```

**Navigation:** `@react-navigation/native-stack` with native transitions.

### Data Flow

```
┌─────────────────────────────────────────────────┐
│                    App.js                        │
│  - Initializes GeofenceService                  │
│  - Checks for updates (UpdateService)           │
│  - Listens for notification taps                │
│  - Manages navigation ref                       │
└─────────────────────┬───────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│ AlarmList    │ │ Create   │ │ ActiveAlarm  │
│ Screen       │ │ Alarm    │ │ Screen       │
│              │ │ Screen   │ │              │
│ - Loads from │ │          │ │ - Watches    │
│   AsyncStore │ │ - Saves  │ │   location   │
│ - Starts/   │ │   to     │ │ - Plays sound│
│   stops     │ │   Async  │ │ - Vibrates   │
│   monitoring│ │   Store  │ │ - Snooze/    │
│ - Checks    │ │          │ │   Dismiss    │
│   triggers  │ │          │ │              │
└──────┬───────┘ └──────────┘ └──────────────┘
       │
       ▼
┌──────────────────────────────────────────────┐
│           GeofenceService.js                  │
│                                               │
│  ┌─────────────────────────────────────────┐ │
│  │  Background Task (TaskManager)           │ │
│  │  - Receives location updates             │ │
│  │  - Checks all active alarm geofences     │ │
│  │  - Manages triggered/snoozed state       │ │
│  │  - Sends notifications on trigger        │ │
│  └─────────────────────────────────────────┘ │
│                                               │
│  Exports:                                     │
│  - startGeofenceMonitoring()                  │
│  - stopGeofenceMonitoring()                   │
│  - clearTriggeredAlarm(id)                    │
│  - snoozeTriggeredAlarm(id)                   │
│  - setupNotifications()                       │
│  - getDistanceMeters(lat1,lon1,lat2,lon2)    │
└──────────────────────────────────────────────┘
```

### Data Storage (AsyncStorage)

| Key | Type | Purpose |
|-----|------|---------|
| `@vigilant_alarms` | `Alarm[]` | All saved alarms |
| `@vigilant_triggered` | `string[]` | IDs of currently triggered alarms |
| `@vigilant_snoozed` | `string[]` | IDs of snoozed alarms (waiting for exit) |
| `@vigilant_current_trigger` | `object` | Current trigger info for foreground pickup |
| `@vigilant_onboarding_done` | `string` | "true" if onboarding completed |

### Alarm Object Schema

```javascript
{
  id: "1234567890",           // Unique ID (timestamp string)
  label: "Work",              // User-defined name
  address: "123 Main St...",  // Reverse geocoded address
  latitude: 12.9716,          // GPS latitude
  longitude: 77.5946,         // GPS longitude
  radius: 500,                // Geofence radius in meters
  vibrate: true,              // Vibrate on arrival
  sound: true,                // Play alarm sound
  ringtone: "default",        // Selected ringtone ID
  active: true,               // Alarm enabled/disabled
  createdAt: "2026-03-20..."  // ISO timestamp
}
```

## 🔄 Geofence Monitoring Flow

```
App Launch
    │
    ▼
startGeofenceMonitoring()
    │
    ├── Request foreground location permission
    ├── Request background location permission
    ├── Load active alarms from AsyncStorage
    │
    ▼
Location.startLocationUpdatesAsync()
    │ (every 50m or 10s)
    ▼
Background Task: checkGeofences(lat, lon)
    │
    ├── For each active alarm:
    │   ├── Calculate distance (Haversine formula)
    │   │
    │   ├── If INSIDE geofence AND not triggered AND not snoozed:
    │   │   ├── Mark as triggered
    │   │   ├── Store trigger info
    │   │   └── Send notification → Auto-navigate to ActiveAlarmScreen
    │   │
    │   ├── If snoozed AND OUTSIDE geofence (1.5x radius):
    │   │   ├── Clear snooze
    │   │   └── Re-arm alarm (can trigger again)
    │   │
    │   └── Otherwise: continue monitoring
    │
    └── Loop continues...
```

## 🎨 Design System: "Horizon Pulse"

### Color Palette
- **Primary:** `#0040a1` (Deep Blue)
- **Primary Container:** `#0056d2` (Bright Blue)
- **Secondary:** `#a43c12` (Orange)
- **Tertiary:** `#5b4300` (Gold)
- **Surface:** `#faf8ff` (Near White)
- **On Surface:** `#191b23` (Near Black)

### Typography
- **Display:** Manrope, 800 weight
- **Body/Labels:** Plus Jakarta Sans, 400-700 weight

### Spacing Scale
`xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48`

### Border Radius Scale
`sm: 4, md: 12, lg: 16, xl: 24, xxl: 32, full: 9999`

## 🔌 Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `expo` | ~55.0.8 | Core Expo SDK |
| `react-native` | 0.83.2 | UI framework |
| `expo-location` | ~55.1.4 | GPS & geocoding |
| `expo-task-manager` | ~55.0.10 | Background tasks |
| `expo-notifications` | ~55.0.13 | Push notifications |
| `expo-av` | ~16.0.8 | Audio playback |
| `react-native-maps` | ~1.27.2 | Google Maps |
| `@react-native-community/slider` | latest | Radius slider |
| `@react-navigation/native` | ~7.1.34 | Navigation |
| `@react-native-async-storage/async-storage` | ~1.23.1 | Local storage |
| `expo-linear-gradient` | ~55.0.9 | Gradient effects |
