import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Spacing } from '../constants/theme';

const { width, height } = Dimensions.get('window');

export default function ActiveAlarmScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Background Map Layer (simulated blurred) */}
      <View style={styles.mapBg}>
        <View style={styles.mapPattern}>
          {Array.from({ length: 30 }).map((_, row) => (
            <View key={row} style={styles.mapRow}>
              {Array.from({ length: 15 }).map((_, col) => (
                <View
                  key={col}
                  style={[
                    styles.mapCell,
                    (row * col) % 5 === 0 && styles.mapCellDark,
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* Urgent Gradient Overlay */}
      <LinearGradient
        colors={[Colors.secondary, Colors.secondaryContainer]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { opacity: 0.88 }]}
      />

      {/* Decorative Blurs */}
      <View style={styles.decorBlur1} />
      <View style={styles.decorBlur2} />

      {/* Content */}
      <View style={styles.content}>
        {/* Top Logo */}
        <View style={styles.topBrand}>
          <Ionicons name="notifications" size={28} color={Colors.onSecondary} />
          <Text style={styles.brandText}>Vigilant Path</Text>
        </View>

        {/* Main Alarm Card */}
        <View style={styles.alarmCard}>
          {/* Pulsing Location Icon */}
          <View style={styles.pulseContainer}>
            <View style={styles.pulseRing} />
            <View style={styles.locationCircle}>
              <Ionicons name="location" size={40} color={Colors.secondary} />
            </View>
          </View>

          {/* Destination Info */}
          <View style={styles.destinationInfo}>
            <Text style={styles.arrivedLabel}>Arrived at Destination</Text>
            <Text style={styles.arrivedTitle}>Arrived at Work!</Text>
            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.timeText}>Triggered at 08:45 AM</Text>
            </View>
          </View>

          {/* Proximity Info Bar */}
          <View style={styles.proximityBar}>
            <View style={styles.proximityLeft}>
              <Ionicons name="resize-outline" size={20} color={Colors.onSecondary} />
              <Text style={styles.proximityText}>Within 100m</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={styles.progressFill} />
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {/* Dismiss Button */}
          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Ionicons name="close" size={28} color={Colors.secondary} />
            <Text style={styles.dismissText}>Dismiss Alarm</Text>
          </TouchableOpacity>

          {/* Navigate Button */}
          <TouchableOpacity style={styles.navBtn} activeOpacity={0.85}>
            <Ionicons name="navigate-outline" size={20} color={Colors.onSecondary} />
            <Text style={styles.navBtnText}>Open Navigation</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Status */}
        <View style={styles.bottomStatus}>
          <Ionicons name="phone-portrait-outline" size={18} color={Colors.onSecondary} />
          <Text style={styles.statusText}>Vibrating & Audio Active</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    overflow: 'hidden',
  },
  // Background
  mapBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.15,
    transform: [{ scale: 1.1 }],
  },
  mapPattern: {
    flex: 1,
  },
  mapRow: {
    flexDirection: 'row',
    flex: 1,
  },
  mapCell: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    margin: 0.5,
  },
  mapCellDark: {
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  // Decorative
  decorBlur1: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.secondary,
    opacity: 0.3,
  },
  decorBlur2: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: Colors.primary,
    opacity: 0.2,
  },
  // Content
  content: {
    flex: 1,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxxl,
  },
  // Brand
  topBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.xxl,
    opacity: 0.9,
  },
  brandText: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.onSecondary,
    letterSpacing: -0.3,
  },
  // Alarm Card
  alarmCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 10,
    marginBottom: Spacing.xxxl,
  },
  // Pulse
  pulseContainer: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  pulseRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: 'rgba(254, 126, 79, 0.4)',
  },
  locationCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.secondaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 30,
    elevation: 8,
  },
  // Destination Info
  destinationInfo: {
    alignItems: 'center',
    gap: 6,
  },
  arrivedLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  arrivedTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.onSecondary,
    letterSpacing: -1,
    textAlign: 'center',
    lineHeight: 40,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
  },
  // Proximity
  proximityBar: {
    marginTop: Spacing.xxl,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  proximityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  proximityText: {
    color: Colors.onSecondary,
    fontWeight: '500',
    fontSize: 15,
  },
  progressBar: {
    height: 4,
    width: 48,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '100%',
    backgroundColor: Colors.onSecondary,
    borderRadius: 2,
  },
  // Actions
  actions: {
    width: '100%',
    gap: Spacing.lg,
  },
  dismissBtn: {
    width: '100%',
    height: 72,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  dismissText: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.secondary,
  },
  navBtn: {
    width: '100%',
    height: 56,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  navBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSecondary,
  },
  // Bottom
  bottomStatus: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.xxxl,
    opacity: 0.6,
  },
  statusText: {
    fontSize: 12,
    color: Colors.onSecondary,
  },
});
