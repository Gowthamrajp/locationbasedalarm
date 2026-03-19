import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Spacing } from '../constants/theme';
import GradientButton from '../components/GradientButton';

const { width } = Dimensions.get('window');

export default function OnboardingScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.accentLine} />
        <Text style={styles.title}>Vigilant Path</Text>
        <Text style={styles.subtitle}>
          Your atmospheric guardian. We ensure you never miss your stop, wherever the journey takes you.
        </Text>
      </View>

      {/* Illustration Hero */}
      <View style={styles.heroContainer}>
        {/* Decorative Background */}
        <View style={styles.heroBgDecor} />
        {/* Main Card */}
        <View style={styles.heroCard}>
          {/* Dot Pattern Background */}
          <View style={styles.dotPattern}>
            {Array.from({ length: 80 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    left: `${(i % 10) * 10 + 2}%`,
                    top: `${Math.floor(i / 10) * 12 + 2}%`,
                  },
                ]}
              />
            ))}
          </View>

          {/* Central Icon */}
          <View style={styles.centralIcon}>
            <View style={styles.iconCircle}>
              <Ionicons name="notifications" size={48} color={Colors.onSecondaryContainer} />
            </View>
            <View style={styles.proximityBadge}>
              <Text style={styles.proximityText}>Proximity Alert</Text>
            </View>
          </View>

          {/* Floating Pin */}
          <View style={styles.floatingPin}>
            <Ionicons name="location" size={20} color={Colors.secondary} />
            <Text style={styles.pinText}>500m Away</Text>
          </View>
        </View>
      </View>

      {/* Permission Explainers */}
      <View style={styles.permissionsSection}>
        <View style={styles.permissionRow}>
          <View style={styles.permissionIcon}>
            <Ionicons name="compass-outline" size={24} color={Colors.primary} />
          </View>
          <View style={styles.permissionText}>
            <Text style={styles.permissionTitle}>Precision Proximity</Text>
            <Text style={styles.permissionDesc}>
              We use your background location to calculate the exact moment to wake you up before your destination.
            </Text>
          </View>
        </View>

        <View style={styles.permissionRow}>
          <View style={styles.permissionIcon}>
            <Ionicons name="radio-outline" size={24} color={Colors.primary} />
          </View>
          <View style={styles.permissionText}>
            <Text style={styles.permissionTitle}>Critical Alerts</Text>
            <Text style={styles.permissionDesc}>
              Notification access ensures our alarms can bypass silence modes during critical travel updates.
            </Text>
          </View>
        </View>
      </View>

      {/* CTA Buttons */}
      <View style={styles.ctaSection}>
        <GradientButton
          title="Grant Permissions"
          onPress={() => navigation.replace('AlarmList')}
        />
        <TouchableOpacity
          style={styles.laterButton}
          onPress={() => navigation.replace('AlarmList')}
        >
          <Text style={styles.laterText}>Maybe Later</Text>
        </TouchableOpacity>
      </View>

      {/* Privacy Text */}
      <Text style={styles.privacyText}>
        Vigilant Path processes your location data locally and only for the duration of active alarms. We never share your movement history.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: Spacing.xxl,
  },
  accentLine: {
    width: 64,
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 42,
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
  heroContainer: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 280,
    marginBottom: Spacing.xxl,
    alignSelf: 'center',
  },
  heroBgDecor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primaryFixed,
    borderRadius: 40,
    transform: [{ rotate: '3deg' }, { scale: 0.95 }],
    opacity: 0.5,
  },
  heroCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 36,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  dotPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
  },
  dot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.primary,
  },
  centralIcon: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  proximityBadge: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primaryContainer,
    borderRadius: BorderRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  proximityText: {
    color: Colors.onPrimaryContainer,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  floatingPin: {
    position: 'absolute',
    top: 40,
    right: 30,
    backgroundColor: 'rgba(250, 248, 255, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  pinText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  permissionsSection: {
    gap: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  permissionRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    alignItems: 'flex-start',
  },
  permissionIcon: {
    padding: 12,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius.xl,
  },
  permissionText: {
    flex: 1,
    gap: 4,
  },
  permissionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  permissionDesc: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
  },
  ctaSection: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  laterButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: BorderRadius.full,
  },
  laterText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  privacyText: {
    textAlign: 'center',
    fontSize: 10,
    color: Colors.outline,
    lineHeight: 15,
    paddingHorizontal: 32,
  },
});
