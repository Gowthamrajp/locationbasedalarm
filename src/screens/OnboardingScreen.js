import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Spacing } from '../constants/theme';

export default function OnboardingScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.accentLine} />
        <Text style={styles.title}>Vigilant Path</Text>
        <Text style={styles.subtitle}>
          Never miss your stop. Set location-based alarms that wake you when you arrive.
        </Text>
      </View>

      {/* Icon Hero */}
      <View style={styles.heroSection}>
        <View style={styles.iconCircle}>
          <Ionicons name="notifications" size={48} color={Colors.onSecondaryContainer} />
        </View>
        <View style={styles.featureRow}>
          <View style={styles.featureChip}>
            <Ionicons name="location" size={14} color={Colors.primary} />
            <Text style={styles.featureText}>GPS Geofencing</Text>
          </View>
          <View style={styles.featureChip}>
            <Ionicons name="map" size={14} color={Colors.primary} />
            <Text style={styles.featureText}>Google Maps</Text>
          </View>
        </View>
      </View>

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* Permissions info */}
      <View style={styles.permissionRow}>
        <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primary} />
        <Text style={styles.permissionText}>
          We need location access to trigger alarms near your destinations. Data stays on your device.
        </Text>
      </View>

      {/* CTA */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.replace('AlarmList')}
        style={styles.ctaWrapper}
      >
        <LinearGradient
          colors={[Colors.primary, Colors.primaryContainer]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ctaButton}
        >
          <Text style={styles.ctaText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.xxl,
  },
  accentLine: {
    width: 48,
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -1,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.onSurfaceVariant,
    lineHeight: 24,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  featureRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.primaryFixed,
    borderRadius: BorderRadius.full,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: Colors.surfaceContainerHighest,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xl,
  },
  permissionText: {
    flex: 1,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
  },
  ctaWrapper: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 18,
    borderRadius: BorderRadius.full,
  },
  ctaText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
