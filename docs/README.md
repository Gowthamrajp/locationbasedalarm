# Vigilant Path - Location Based Alarm

> A React Native (Expo) Android app that triggers alarms when you reach a geographic destination. Set a location, define a radius, and get notified with sound and vibration when you arrive — even in the background.

## 📚 Documentation Index

| Document | Description |
|----------|-------------|
| [Features](./FEATURES.md) | Complete feature list with details |
| [Architecture](./ARCHITECTURE.md) | App architecture, tech stack, and code structure |
| [Setup & Development](./SETUP.md) | How to set up the project locally |
| [Deployment](./DEPLOYMENT.md) | Play Store upload, CI/CD, and release process |
| [Signing & Security](./SIGNING.md) | Keystore management and app signing |
| [API Keys](./API_KEYS.md) | Google Maps API key setup, security, and restrictions |
| [Update System](./UPDATE_SYSTEM.md) | Forced updates and version management |

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/Gowthamrajp/locationbasedalarm.git
cd locationbasedalarm

# Install dependencies
npm install

# Run on Android device/emulator
npx expo run:android

# Build release APK
npx expo run:android --variant release

# Build AAB for Play Store
cd android && ./gradlew app:bundleRelease -x lint -x test
```

## 📱 App Overview

**Vigilant Path** is a location-based alarm app designed for commuters, travelers, and anyone who needs to be alerted when they reach a specific destination. Unlike time-based alarms, this app uses GPS geofencing to trigger alerts based on proximity to a location.

### Key Use Cases
- 🚌 **Commuters** — Get woken up before your bus/train stop
- ✈️ **Travelers** — Alert when approaching your hotel or destination
- 🏠 **Daily life** — Remind yourself when you're near the grocery store
- 📍 **Any location-based reminder** — Works for any geo-aware notification need

## 🛠 Tech Stack

- **React Native** 0.83 with **Expo** SDK 55
- **expo-location** — Foreground + background GPS tracking
- **expo-task-manager** — Background geofence monitoring service
- **expo-notifications** — Push notifications for alarm triggers
- **expo-av** — Alarm sound playback
- **react-native-maps** — Interactive map with markers and geofence circles
- **@react-native-community/slider** — Radius adjustment slider
- **AsyncStorage** — Local alarm data persistence

## 📄 License

This project is private and proprietary.
