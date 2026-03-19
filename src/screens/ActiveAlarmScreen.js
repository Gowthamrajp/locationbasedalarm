import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Colors, BorderRadius, Spacing } from '../constants/theme';

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

export default function ActiveAlarmScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const alarm = route.params?.alarm;
  const [distance, setDistance] = useState(null);
  const [arrived, setArrived] = useState(false);
  const [triggeredTime, setTriggeredTime] = useState(null);

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

          if (dist <= (alarm.radius || 500) && !arrived) {
            setArrived(true);
            setTriggeredTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            if (alarm.vibrate !== false) {
              Vibration.vibrate([0, 500, 200, 500, 200, 500], false);
            }
          }
        }
      );
    };

    startTracking();
    return () => subscription?.remove();
  }, [alarm]);

  const handleDismiss = () => {
    Vibration.cancel();
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
                name="location"
                size={36}
                color={arrived ? Colors.secondary : Colors.primary}
              />
            </View>
          </View>

          <View style={styles.destinationInfo}>
            <Text style={styles.arrivedLabel}>
              {arrived ? 'Arrived at Destination' : 'Approaching Destination'}
            </Text>
            <Text style={styles.arrivedTitle}>
              {arrived ? `Arrived at ${alarm?.label || 'destination'}!` : alarm?.label || 'Destination'}
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

          {/* Distance Bar */}
          <View style={styles.proximityBar}>
            <View style={styles.proximityLeft}>
              <Ionicons name="navigate-outline" size={18} color="#fff" />
              <Text style={styles.proximityText}>{formatDistance(distance)}</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercent * 100}%` }]} />
            </View>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.dismissBtn} onPress={handleDismiss} activeOpacity={0.85}>
            <Ionicons name="close" size={26} color={arrived ? Colors.secondary : Colors.primary} />
            <Text style={[styles.dismissText, { color: arrived ? Colors.secondary : Colors.primary }]}>
              Dismiss Alarm
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navBtn} activeOpacity={0.85} onPress={() => {
            if (alarm && Platform.OS !== 'web') {
              const url = Platform.OS === 'ios'
                ? `maps:?daddr=${alarm.latitude},${alarm.longitude}`
                : `google.navigation:q=${alarm.latitude},${alarm.longitude}`;
              import('react-native').then(({ Linking }) => Linking.openURL(url).catch(() => {}));
            }
          }}>
            <Ionicons name="navigate-outline" size={18} color="#fff" />
            <Text style={styles.navBtnText}>Open Navigation</Text>
          </TouchableOpacity>
        </View>

        {/* Status */}
        <View style={styles.bottomStatus}>
          <Ionicons name="pulse-outline" size={16} color="rgba(255,255,255,0.6)" />
          <Text style={styles.statusText}>
            {arrived ? 'Vibrating • Audio Active' : 'Monitoring location...'}
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
  proximityBar: {
    marginTop: Spacing.xl, width: '100%', backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  proximityLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  proximityText: { color: '#fff', fontWeight: '500', fontSize: 14 },
  progressBar: { height: 4, width: 48, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
  actions: { width: '100%', gap: Spacing.md },
  dismissBtn: {
    width: '100%', height: 64, backgroundColor: '#fff',
    borderRadius: BorderRadius.full, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },
  dismissText: { fontSize: 18, fontWeight: '800' },
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
