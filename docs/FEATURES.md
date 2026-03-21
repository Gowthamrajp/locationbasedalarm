# Features

## 📍 Core Features

### 1. Location-Based Alarms
- **Tap on map** to select a destination or **search by name/address**
- Set a custom **geofence radius** (50m to 10km)
- Alarm triggers automatically when you enter the geofence radius
- Works both in foreground and background

### 2. Alarm Creation & Management
- **Alarm name/label** — Give each alarm a descriptive name (e.g., "Work", "Home", "Bus Stop")
- **Address display** — Automatically reverse geocodes the selected location to show a human-readable address
- **Radius control** — Two ways to set radius:
  - **Slider** — Drag between 50m and 10km with 50m steps
  - **Manual input** — Tap the radius badge to type exact distance in meters or kilometers
- **Vibration toggle** — Enable/disable vibration on arrival
- **Sound toggle** — Enable/disable alarm sound on arrival
- **Ringtone picker** — Choose from 10 different alarm sounds (Default, Beacon, Chime, Radar, Signal, Waves, Ping, Classic Bell, Digital, Gentle Wake)

### 3. Map Features
- **Interactive Google Maps** with satellite/terrain support
- **Search bar** — Search for places and addresses with auto-complete (using Expo Location geocoding)
- **Current location button** — Jump to your current GPS position
- **Geofence visualization** — Blue circle on the map showing the alarm radius
- **Pin marker** — Shows exact alarm trigger point

### 4. Alarm List
- **Unified card design** — All alarms displayed with consistent styling
- **Active/inactive toggle** — Switch individual alarms on/off
- **Status tags** — Shows radius, vibrate, sound, and active status for each alarm
- **Edit & delete** — Tap to edit, long-press to delete
- **Monitoring badge** — Shows "Monitoring" in the top bar when background service is active
- **Active alarm count** — "X active of Y alarms" subtitle

### 5. Background Geofence Monitoring
- **Automatic start** — Monitoring begins automatically when there are active alarms
- **Persistent notification** — "Monitoring X location alarms" shown in notification bar
- **Battery efficient** — Uses distance interval (50m) and time interval (10s) for updates
- **Background permissions** — Requests `ACCESS_BACKGROUND_LOCATION` for full background support
- **Foreground service** — Ensures monitoring continues even when app is in background

### 6. Alarm Trigger & Active Alarm Screen
- **Auto-navigation** — When geofence triggers, app automatically opens the Active Alarm screen
- **Push notification** — Sends a notification with alarm details (works even in background)
- **Continuous vibration** — Repeating vibration pattern (800ms on, 400ms off) until dismissed
- **Continuous alarm sound** — Looping two-tone beep that plays even in silent mode
- **Distance tracking** — Live distance display showing how far you are from the destination
- **Progress bar** — Visual indicator of proximity to the geofence
- **Alarm active indicator** — Shows "Vibrating & Playing Sound" with a pulsing red dot

### 7. Snooze Feature
- **One-tap snooze** — Stops the current alarm immediately
- **Re-entry trigger** — Alarm is "snoozed" (not dismissed), meaning:
  1. Current sound/vibration stops
  2. Alarm stays active in the background
  3. When you **leave the geofence** (beyond 1.5x radius), the snooze is cleared
  4. When you **re-enter the geofence**, the alarm triggers again
- **Snooze vs Dismiss**:
  - **Dismiss** = Permanently stops the alarm for this session
  - **Snooze** = Temporarily stops, re-arms on next entry

### 8. Forced Auto-Update System
- **Version check on launch** — Fetches `version.json` from GitHub on every app open
- **Force update** — If user's version < `minimumVersion`, shows a non-dismissable alert → redirects to Play Store → exits app
- **Optional update** — If newer version available, shows dismissable prompt with "Update" or "Later" options
- **Remote control** — Simply edit `version.json` in the repo to trigger updates for all users

### 9. Navigation Integration
- **"Open Navigation" button** — Opens Google Maps navigation directly to the alarm destination
- Works on Android with `google.navigation:q=` intent

## 🎨 Design Features

### Visual Design
- **"Horizon Pulse" design system** — Custom Material Design 3 color palette
- **Blue primary theme** (#0040a1) with orange secondary accents
- **Gradient buttons** — Linear gradient on primary actions (Save, FAB)
- **Card-based layout** — Consistent rounded cards with subtle shadows
- **Bottom tab bar** — Semi-transparent with active state highlighting

### Onboarding
- Multi-step onboarding flow for first-time users
- Explains app features and requests necessary permissions

## 📋 Permissions Used

| Permission | Purpose |
|-----------|---------|
| `ACCESS_FINE_LOCATION` | Precise GPS tracking |
| `ACCESS_COARSE_LOCATION` | Approximate location |
| `ACCESS_BACKGROUND_LOCATION` | Track location when app is in background |
| `FOREGROUND_SERVICE` | Run persistent notification for monitoring |
| `FOREGROUND_SERVICE_LOCATION` | Location-specific foreground service |
| `POST_NOTIFICATIONS` | Send alarm trigger notifications |
| `VIBRATE` | Vibrate the device on alarm |
| `WAKE_LOCK` | Keep device awake during alarm |
| `INTERNET` | Location search and update checks |
