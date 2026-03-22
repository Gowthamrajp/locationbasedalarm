import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration, Platform, AppState, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, BorderRadius, Spacing } from '../constants/theme';
import { getDistanceMeters, clearTriggeredAlarm, snoozeTriggeredAlarm } from '../services/GeofenceService';

const { AlarmModule } = NativeModules;

export default function ActiveAlarmScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const alarm = route.params?.alarm;
  const [distance, setDistance] = useState(null);
  const [arrived, setArrived] = useState(false);
  const [triggeredTime, setTriggeredTime] = useState(null);
  const soundRef = useRef(null);
  const vibrationIntervalRef = useRef(null);
  const arrivedRef = useRef(false);

  // Start continuous vibration
  const startContinuousVibration = () => {
    // Vibrate immediately
    Vibration.vibrate([0, 800, 400, 800, 400, 800], true); // repeat=true for Android
    // For extra reliability, set up an interval
    if (vibrationIntervalRef.current) clearInterval(vibrationIntervalRef.current);
    vibrationIntervalRef.current = setInterval(() => {
      Vibration.vibrate([0, 800, 400, 800, 400, 800], false);
    }, 4000);
  };

  // Stop continuous vibration
  const stopContinuousVibration = () => {
    Vibration.cancel();
    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
      vibrationIntervalRef.current = null;
    }
  };

  // Start alarm sound
  const startAlarmSound = async () => {
    try {
      // Set audio mode for alarm - play even in silent mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });

      // Use a system-like alarm sound - create a looping tone
      const { sound } = await Audio.Sound.createAsync(
        // Use a built-in expo asset or a generated beep
        require('../../assets/alarm-sound.mp3'),
        {
          isLooping: true,
          volume: 1.0,
          shouldPlay: true,
        }
      );
      soundRef.current = sound;
    } catch (e) {
      console.log('Could not play alarm sound, trying fallback:', e);
      // Fallback: try without the asset
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: false,
        });
      } catch (e2) {
        console.log('Audio mode error:', e2);
      }
    }
  };

  // Stop alarm sound
  const stopAlarmSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (e) {
      console.log('Error stopping sound:', e);
    }
  };

  // Trigger the alarm
  const triggerAlarm = async () => {
    if (arrivedRef.current) return;
    arrivedRef.current = true;
    setArrived(true);
    setTriggeredTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    // Start vibration if enabled
    if (alarm?.vibrate !== false) {
      startContinuousVibration();
    }

    // Start sound if enabled
    if (alarm?.sound !== false) {
      await startAlarmSound();
    }
  };

  useEffect(() => {
    let subscription;

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 3000 },
        (loc) => {
          if (!alarm) return;
          const dist = getDistanceMeters(
            loc.coords.latitude, loc.coords.longitude,
            alarm.latitude, alarm.longitude
          );
          setDistance(Math.round(dist));

          if (dist <= (alarm.radius || 500) && !arrivedRef.current) {
            triggerAlarm();
          }
        }
      );
    };

    startTracking();

    // Cleanup on unmount
    return () => {
      subscription?.remove();
      stopContinuousVibration();
      stopAlarmSound();
    };
  }, [alarm]);

  // Keep vibrating even when app goes to background/foreground
  useEffect(() => {
    const appStateListener = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && arrivedRef.current) {
        // Re-trigger vibration when coming back to foreground
        if (alarm?.vibrate !== false) {
          startContinuousVibration();
        }
      }
    });

    return () => appStateListener?.remove();
  }, [alarm]);

  const handleSnooze = async () => {
    // Stop native alarm service
    if (Platform.OS === 'android' && AlarmModule) {
      try { AlarmModule.snoozeAlarm(); } catch (e) {}
    }
    // Stop JS-level sound and vibration
    stopContinuousVibration();
    await stopAlarmSound();

    // Snooze the alarm - will re-trigger when user leaves and re-enters geofence
    if (alarm?.id) {
      await snoozeTriggeredAlarm(alarm.id);
    }

    navigation.goBack();
  };

  const handleDismiss = async () => {
    // Stop native alarm service
    if (Platform.OS === 'android' && AlarmModule) {
      try { AlarmModule.stopAlarm(); } catch (e) {}
    }
    // Stop JS-level sound and vibration
    stopContinuousVibration();
    await stopAlarmSound();

    // Clear the triggered state completely
    if (alarm?.id) {
      await clearTriggeredAlarm(alarm.id);

      // Disable the alarm so it doesn't re-trigger
      try {
        const data = await AsyncStorage.getItem('@vigilant_alarms');
        if (data) {
          const alarms = JSON.parse(data);
          const updated = alarms.map(a => a.id === alarm.id ? { ...a, active: false } : a);
          await AsyncStorage.setItem('@vigilant_alarms', JSON.stringify(updated));
        }
      } catch (e) {
        console.log('Error disabling alarm:', e);
      }
    }

    navigation.goBack();
  };

  const formatDistance = (d) => {
    if (d == null) return 'Calculating...';
    if (d < 1000) return `${d}m away`;
    return `${(d / 1000).toFixed(1)}km away`;
  };

  const progressPercent = distance != null && alarm
    ? Math.min(1, Math.max(0, 1 - distance / (alarm.radius * 3 || 1500)))
    : 0;

  return (
    <View style={styles.container}>
      {/* Urgent Gradient Overlay */}
      <LinearGradient
        colors={arrived ? [Colors.secondary, Colors.secondaryContainer] : [Colors.primary, Colors.primaryContainer]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Blurs */}
      <View style={styles.decorBlur1} />
      <View style={styles.decorBlur2} />

      {/* Content */}
      <View style={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
        {/* Top Logo */}
        <View style={styles.topBrand}>
          <Ionicons name="notifications" size={24} color="#fff" />
          <Text style={styles.brandText}>Vigilant Path</Text>
        </View>

        {/* Main Card */}
        <View style={styles.alarmCard}>
          <View style={styles.pulseContainer}>
            <View style={[styles.pulseRing, arrived && styles.pulseRingArrived]} />
            <View style={styles.locationCircle}>
              <Ionicons
                name={arrived ? 'notifications' : 'location'}
                size={36}
                color={arrived ? Colors.secondary : Colors.primary}
              />
            </View>
          </View>

          <View style={styles.destinationInfo}>
            <Text style={styles.arrivedLabel}>
              {arrived ? '🔔 ALARM TRIGGERED' : 'Approaching Destination'}
            </Text>
            <Text style={styles.arrivedTitle}>
              {arrived ? `${alarm?.label || 'Destination'}` : alarm?.label || 'Destination'}
            </Text>
            {alarm?.address && (
              <Text style={styles.addressText} numberOfLines={1}>{alarm.address}</Text>
            )}
            {triggeredTime && (
              <View style={styles.timeRow}>
                <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.timeText}>Triggered at {triggeredTime}</Text>
              </View>
            )}
          </View>

          {/* Alarm Active Indicator */}
          {arrived && (
            <View style={styles.alarmActiveIndicator}>
              <Ionicons name="volume-high" size={16} color="#fff" />
              <Text style={styles.alarmActiveText}>
                {alarm?.vibrate !== false && alarm?.sound !== false
                  ? 'Vibrating & Playing Sound'
                  : alarm?.vibrate !== false
                  ? 'Vibrating'
                  : alarm?.sound !== false
                  ? 'Playing Sound'
                  : 'Alarm Active'}
              </Text>
              <View style={styles.pulsingDot} />
            </View>
          )}

          {/* Distance Bar */}
          <View style={styles.proximityBar}>
            <View style={styles.proximityLeft}>
              {distance == null ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="navigate-outline" size={18} color="#fff" />
              )}
              <Text style={styles.proximityText}>{formatDistance(distance)}</Text>
            </View>
            <View style={styles.proximityRight}>
              <Text style={styles.radiusLabel}>Radius: {alarm?.radius >= 1000 ? `${(alarm.radius / 1000).toFixed(1).replace(/\.0$/, '')}km` : `${alarm?.radius || 500}m`}</Text>
            </View>
          </View>

        </View>

        <View style={{ flex: 1 }} />

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.dismissBtn} onPress={handleDismiss} activeOpacity={0.85}>
            <Ionicons name="close" size={26} color={arrived ? Colors.secondary : Colors.primary} />
            <Text style={[styles.dismissText, { color: arrived ? Colors.secondary : Colors.primary }]}>
              {arrived ? 'Stop & Dismiss Alarm' : 'Dismiss Alarm'}
            </Text>
          </TouchableOpacity>

          {arrived && (
            <TouchableOpacity style={styles.snoozeBtn} onPress={handleSnooze} activeOpacity={0.85}>
              <Ionicons name="moon-outline" size={20} color="#fff" />
              <View>
                <Text style={styles.snoozeBtnText}>Snooze</Text>
                <Text style={styles.snoozeSubText}>Re-alerts when you leave & come back</Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.navBtn} activeOpacity={0.85} onPress={() => {
            if (alarm && Platform.OS !== 'web') {
              // Open Google Maps with directions (map view, not auto-start navigation)
              const url = Platform.OS === 'ios'
                ? `https://maps.google.com/maps?daddr=${alarm.latitude},${alarm.longitude}`
                : `https://www.google.com/maps/dir/?api=1&destination=${alarm.latitude},${alarm.longitude}`;
              import('react-native').then(({ Linking }) => Linking.openURL(url).catch(() => {}));
            }
          }}>
            <Ionicons name="map-outline" size={18} color="#fff" />
            <Text style={styles.navBtnText}>Open in Google Maps</Text>
          </TouchableOpacity>
        </View>

        {/* Status */}
        <View style={styles.bottomStatus}>
          <Ionicons name="pulse-outline" size={16} color="rgba(255,255,255,0.6)" />
          <Text style={styles.statusText}>
            {arrived ? 'Alarm will continue until dismissed' : 'Monitoring location...'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  decorBlur1: {
    position: 'absolute', bottom: -60, left: -60,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(164, 60, 18, 0.3)',
  },
  decorBlur2: {
    position: 'absolute', top: -60, right: -60,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(0, 64, 161, 0.2)',
  },
  content: {
    flex: 1, zIndex: 20, alignItems: 'center',
    justifyContent: 'flex-start', paddingHorizontal: Spacing.xl,
  },
  topBrand: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: Spacing.xxl, opacity: 0.9,
  },
  brandText: { fontSize: 18, fontWeight: '800', color: '#fff' },
  alarmCard: {
    width: '100%', backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.xxl, padding: Spacing.xl, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  pulseContainer: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl },
  pulseRing: {
    position: 'absolute', width: 80, height: 80, borderRadius: 40,
    borderWidth: 2, borderColor: 'rgba(0,64,161,0.4)',
  },
  pulseRingArrived: { borderColor: 'rgba(254,126,79,0.5)' },
  locationCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 6,
  },
  destinationInfo: { alignItems: 'center', gap: 4 },
  arrivedLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 2 },
  arrivedTitle: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.5, textAlign: 'center' },
  addressText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  timeText: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.7)' },
  alarmActiveIndicator: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    marginTop: Spacing.lg,
  },
  alarmActiveText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  pulsingDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#ff4444',
  },
  proximityBar: {
    marginTop: Spacing.xl, width: '100%', backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  proximityLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  proximityText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  proximityRight: {},
  radiusLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  progressBarContainer: { width: '100%', marginTop: Spacing.md },
  progressBarTrack: { height: 6, width: '100%', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#fff', borderRadius: 3 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  progressLabelText: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  actions: { width: '100%', gap: Spacing.md },
  dismissBtn: {
    width: '100%', height: 64, backgroundColor: '#fff',
    borderRadius: BorderRadius.full, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },
  dismissText: { fontSize: 18, fontWeight: '800' },
  snoozeBtn: {
    width: '100%', height: 56, borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  snoozeBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  snoozeSubText: { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.7)' },
  navBtn: {
    width: '100%', height: 52, borderRadius: BorderRadius.full,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
  },
  navBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  bottomStatus: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: Spacing.xl, opacity: 0.6,
  },
  statusText: { fontSize: 12, color: '#fff' },
});
