import { Alert, Linking, BackHandler, Platform } from 'react-native';
import Constants from 'expo-constants';

// GitHub raw URL for version config - update this with your actual repo
const VERSION_CONFIG_URL = 'https://raw.githubusercontent.com/Gowthamrajp/locationbasedalarm/main/version.json';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.vigilantpath.locationbasedalarm';

// Get current app version
function getCurrentVersion() {
  return Constants.expoConfig?.version || '1.0.0';
}

function getCurrentVersionCode() {
  return Constants.expoConfig?.android?.versionCode || 1;
}

// Compare version strings: returns -1 if a < b, 0 if equal, 1 if a > b
function compareVersions(a, b) {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  const maxLen = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < maxLen; i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA < numB) return -1;
    if (numA > numB) return 1;
  }
  return 0;
}

export async function checkForUpdates() {
  try {
    const response = await fetch(VERSION_CONFIG_URL, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    });

    if (!response.ok) return null;

    const config = await response.json();
    const currentVersion = getCurrentVersion();

    const isBelowMinimum = compareVersions(currentVersion, config.minimumVersion) < 0;
    const isUpdateAvailable = compareVersions(currentVersion, config.latestVersion) < 0;

    return {
      ...config,
      currentVersion,
      isBelowMinimum,
      isUpdateAvailable,
      needsForceUpdate: isBelowMinimum || config.forceUpdate,
    };
  } catch (e) {
    console.log('Update check failed (offline?):', e.message);
    return null;
  }
}

export function showForceUpdateAlert(config) {
  const message = config?.updateMessage || 'A critical update is required. Please update to continue using the app.';

  Alert.alert(
    '⚠️ Update Required',
    message,
    [
      {
        text: 'Update Now',
        onPress: () => {
          const url = config?.playStoreUrl || PLAY_STORE_URL;
          Linking.openURL(url).catch(() => {});
          // On Android, exit the app to force them to update
          if (Platform.OS === 'android') {
            setTimeout(() => BackHandler.exitApp(), 1000);
          }
        },
      },
    ],
    { cancelable: false } // Cannot dismiss
  );
}

export function showOptionalUpdateAlert(config) {
  const message = config?.updateMessage || 'A new version is available with improvements and bug fixes.';

  Alert.alert(
    '🆕 Update Available',
    `${message}\n\nCurrent: v${config.currentVersion}\nLatest: v${config.latestVersion}`,
    [
      { text: 'Later', style: 'cancel' },
      {
        text: 'Update',
        onPress: () => {
          const url = config?.playStoreUrl || PLAY_STORE_URL;
          Linking.openURL(url).catch(() => {});
        },
      },
    ]
  );
}

export { getCurrentVersion, getCurrentVersionCode, compareVersions };
