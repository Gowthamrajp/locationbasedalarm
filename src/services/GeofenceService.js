import { NativeModules, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { AlarmModule } = NativeModules;

const STORAGE_KEY = '@vigilant_alarms';
const TRIGGERED_KEY = '@vigilant_triggered';
const SNOOZED_KEY = '@vigilant_snoozed';
const MONITORING_STATE_KEY = '@vigilant_monitoring_state';
const LOCATION_TASK_NAME = 'vigilant-geofence-task';

// ============================================================
// ADAPTIVE BATTERY OPTIMIZATION
// ============================================================
// Instead of always using high-accuracy GPS (battery killer),
// we adapt based on distance to nearest alarm:
//
// FAR (>5km)     → Low accuracy, check every 500m / 60s  (~0.5% battery/hr)
// MEDIUM (1-5km) → Balanced,     check every 200m / 30s  (~1% battery/hr)
// NEAR (<1km)    → High accuracy, check every 50m / 10s  (~2-3% battery/hr)
// VERY NEAR      → Highest,      check every 20m / 5s    (~3-5% battery/hr)
// ============================================================

const MONITORING_ZONES = {
  FAR: {
    name: 'far',
    accuracy: Location.Accuracy.Low,
    distanceInterval: 500,
    timeInterval: 60000,     // 60 seconds
    threshold: 5000,         // > 5km
  },
  MEDIUM: {
    name: 'medium',
    accuracy: Location.Accuracy.Balanced,
    distanceInterval: 200,
    timeInterval: 30000,     // 30 seconds
    threshold: 1000,         // 1-5km
  },
  NEAR: {
    name: 'near',
    accuracy: Location.Accuracy.High,
    distanceInterval: 50,
    timeInterval: 10000,     // 10 seconds
    threshold: 300,          // 300m-1km
  },
  VERY_NEAR: {
    name: 'very_near',
    accuracy: Location.Accuracy.Highest,
    distanceInterval: 20,
    timeInterval: 5000,      // 5 seconds
    threshold: 0,            // < 300m
  },
};

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Determine which monitoring zone based on closest alarm distance
function getMonitoringZone(closestDistance) {
  if (closestDistance > MONITORING_ZONES.FAR.threshold) return MONITORING_ZONES.FAR;
  if (closestDistance > MONITORING_ZONES.MEDIUM.threshold) return MONITORING_ZONES.MEDIUM;
  if (closestDistance > MONITORING_ZONES.NEAR.threshold) return MONITORING_ZONES.NEAR;
  return MONITORING_ZONES.VERY_NEAR;
}

// Track current zone to avoid unnecessary restarts
let currentZoneName = null;
let zoneCheckCounter = 0;

// Define the background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.log('Background location error:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    if (locations && locations.length > 0) {
      const loc = locations[0];
      await checkGeofences(loc.coords.latitude, loc.coords.longitude);
    }
  }
});

async function checkGeofences(lat, lon) {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return;
    const alarms = JSON.parse(data);
    const activeAlarms = alarms.filter(a => a.active);

    if (activeAlarms.length === 0) {
      // No active alarms - stop monitoring to save battery
      await stopGeofenceMonitoring();
      return;
    }

    // Get already triggered alarms
    const triggeredData = await AsyncStorage.getItem(TRIGGERED_KEY);
    const triggered = triggeredData ? JSON.parse(triggeredData) : [];

    // Get snoozed alarms
    const snoozedData = await AsyncStorage.getItem(SNOOZED_KEY);
    let snoozed = snoozedData ? JSON.parse(snoozedData) : [];

    let snoozedChanged = false;
    let closestDistance = Infinity;

    for (const alarm of activeAlarms) {
      const dist = getDistanceMeters(lat, lon, alarm.latitude, alarm.longitude);
      const radius = alarm.radius || 500;
      const isInsideGeofence = dist <= radius;
      const isOutsideGeofence = dist > radius * 1.5;

      // Track closest alarm for adaptive monitoring
      if (dist < closestDistance) {
        closestDistance = dist;
      }

      // Check if snoozed and user left geofence
      if (snoozed.includes(alarm.id) && isOutsideGeofence) {
        snoozed = snoozed.filter(id => id !== alarm.id);
        snoozedChanged = true;
        const idx = triggered.indexOf(alarm.id);
        if (idx !== -1) triggered.splice(idx, 1);
        await AsyncStorage.setItem(TRIGGERED_KEY, JSON.stringify(triggered));
        console.log(`Alarm "${alarm.label}" re-armed after user left geofence`);
      }

      // Trigger alarm if inside geofence
      if (isInsideGeofence && !triggered.includes(alarm.id) && !snoozed.includes(alarm.id)) {
        triggered.push(alarm.id);
        await AsyncStorage.setItem(TRIGGERED_KEY, JSON.stringify(triggered));

        await AsyncStorage.setItem('@vigilant_current_trigger', JSON.stringify({
          alarmId: alarm.id,
          triggeredAt: new Date().toISOString(),
          distance: Math.round(dist),
        }));

        // Start native alarm service (plays sound + vibrates from background)
        if (Platform.OS === 'android' && AlarmModule) {
          try {
            AlarmModule.startAlarm(
              alarm.sound !== false,
              alarm.vibrate !== false,
              alarm.label || 'Alarm'
            );
          } catch (e) {
            console.log('Native alarm error, falling back to notification:', e);
          }
        }

        // Also send notification (for foreground awareness + iOS fallback)
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '📍 Arrived at destination!',
            body: `You are within ${radius}m of "${alarm.label}"`,
            data: { alarmId: alarm.id, alarm: alarm },
            sound: true,
          },
          trigger: null,
        });
      }
    }

    if (snoozedChanged) {
      await AsyncStorage.setItem(SNOOZED_KEY, JSON.stringify(snoozed));
    }

    // ============================================================
    // ADAPTIVE ZONE SWITCHING
    // Check every 5 location updates if we need to switch zones
    // This prevents constant restarting of the location service
    // ============================================================
    zoneCheckCounter++;
    if (zoneCheckCounter >= 5) {
      zoneCheckCounter = 0;
      const newZone = getMonitoringZone(closestDistance);
      if (newZone.name !== currentZoneName) {
        console.log(`Zone change: ${currentZoneName || 'init'} → ${newZone.name} (closest alarm: ${Math.round(closestDistance)}m)`);
        // Store state and let the next startGeofenceMonitoring pick it up
        await AsyncStorage.setItem(MONITORING_STATE_KEY, JSON.stringify({
          zone: newZone.name,
          closestDistance: Math.round(closestDistance),
          timestamp: Date.now(),
        }));
        // Restart with new accuracy settings
        await restartWithZone(newZone, activeAlarms.length);
      }
    }
  } catch (e) {
    console.log('Geofence check error:', e);
  }
}

async function restartWithZone(zone, alarmCount) {
  try {
    const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => false);
    if (isRunning) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }

    const zoneLabels = {
      far: '🟢 Power saving',
      medium: '🟡 Balanced',
      near: '🟠 High accuracy',
      very_near: '🔴 Maximum accuracy',
    };

    currentZoneName = zone.name;

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: zone.accuracy,
      distanceInterval: zone.distanceInterval,
      timeInterval: zone.timeInterval,
      foregroundService: {
        notificationTitle: '📍 Vigilant Path Active',
        notificationBody: `${alarmCount} alarm${alarmCount > 1 ? 's' : ''} • ${zoneLabels[zone.name] || 'Monitoring'}`,
        notificationColor: '#0040a1',
        killServiceOnDestroy: false,
      },
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
    });

    console.log(`Monitoring restarted in ${zone.name} zone (accuracy: ${zone.accuracy}, interval: ${zone.distanceInterval}m/${zone.timeInterval/1000}s)`);
  } catch (e) {
    console.log('Error restarting monitoring:', e);
  }
}

export async function startGeofenceMonitoring() {
  try {
    const { status: foreStatus } = await Location.requestForegroundPermissionsAsync();
    if (foreStatus !== 'granted') {
      console.log('Foreground location permission not granted');
      return false;
    }

    const { status: backStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backStatus !== 'granted') {
      console.log('Background location permission not granted - using foreground only');
    }

    // Check if already running
    const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => false);
    if (isRunning) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }

    // Check if there are any active alarms
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    const alarms = data ? JSON.parse(data) : [];
    const activeAlarms = alarms.filter(a => a.active);

    if (activeAlarms.length === 0) {
      console.log('No active alarms, not starting monitoring');
      return false;
    }

    // Start with balanced accuracy (will adapt after first location fix)
    const initialZone = MONITORING_ZONES.MEDIUM;
    currentZoneName = initialZone.name;

    if (backStatus === 'granted') {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: initialZone.accuracy,
        distanceInterval: initialZone.distanceInterval,
        timeInterval: initialZone.timeInterval,
        foregroundService: {
          notificationTitle: '📍 Vigilant Path Active',
          notificationBody: `${activeAlarms.length} alarm${activeAlarms.length > 1 ? 's' : ''} • 🟡 Balanced mode`,
          notificationColor: '#0040a1',
          killServiceOnDestroy: false,
        },
        pausesUpdatesAutomatically: false,
        showsBackgroundLocationIndicator: true,
      });
      console.log('Background geofence monitoring started (balanced mode, will adapt)');
    }

    return true;
  } catch (e) {
    console.log('Error starting geofence monitoring:', e);
    return false;
  }
}

export async function stopGeofenceMonitoring() {
  try {
    const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => false);
    if (isRunning) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      currentZoneName = null;
      console.log('Background geofence monitoring stopped');
    }
  } catch (e) {
    console.log('Error stopping geofence monitoring:', e);
  }
}

export async function clearTriggeredAlarm(alarmId) {
  try {
    const data = await AsyncStorage.getItem(TRIGGERED_KEY);
    const triggered = data ? JSON.parse(data) : [];
    const updated = triggered.filter(id => id !== alarmId);
    await AsyncStorage.setItem(TRIGGERED_KEY, JSON.stringify(updated));
    await AsyncStorage.removeItem('@vigilant_current_trigger');

    const snoozedData = await AsyncStorage.getItem(SNOOZED_KEY);
    const snoozed = snoozedData ? JSON.parse(snoozedData) : [];
    const updatedSnoozed = snoozed.filter(id => id !== alarmId);
    await AsyncStorage.setItem(SNOOZED_KEY, JSON.stringify(updatedSnoozed));
  } catch (e) {
    console.log('Error clearing triggered alarm:', e);
  }
}

export async function snoozeTriggeredAlarm(alarmId) {
  try {
    const snoozedData = await AsyncStorage.getItem(SNOOZED_KEY);
    const snoozed = snoozedData ? JSON.parse(snoozedData) : [];
    if (!snoozed.includes(alarmId)) {
      snoozed.push(alarmId);
      await AsyncStorage.setItem(SNOOZED_KEY, JSON.stringify(snoozed));
    }
    await AsyncStorage.removeItem('@vigilant_current_trigger');
    console.log(`Alarm ${alarmId} snoozed - will re-trigger on next entry`);
  } catch (e) {
    console.log('Error snoozing alarm:', e);
  }
}

export async function setupNotifications() {
  try {
    // Only check, don't request - onboarding handles the request
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus !== 'granted') {
      // Request only if not already granted
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Notification permissions not granted');
      }
    }
  } catch (e) {
    console.log('Notification setup error:', e);
  }
}

export { LOCATION_TASK_NAME, getDistanceMeters };
