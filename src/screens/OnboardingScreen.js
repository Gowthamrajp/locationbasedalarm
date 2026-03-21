import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Colors, BorderRadius, Spacing } from '../constants/theme';

const STEPS = [
  {
    key: 'welcome',
    icon: 'notifications',
    iconBg: Colors.secondaryContainer,
    iconColor: Colors.onSecondaryContainer,
    title: 'Vigilant Path',
    subtitle: 'Never miss your stop again.',
    description: 'Set location-based alarms that automatically alert you with sound and vibration when you arrive at your destination.',
    features: [
      { icon: 'location', text: 'GPS Geofencing' },
      { icon: 'volume-high', text: 'Alarm Sound' },
      { icon: 'phone-portrait', text: 'Vibration' },
      { icon: 'moon', text: 'Snooze & Re-trigger' },
    ],
    buttonText: 'Get Started',
  },
  {
    key: 'location',
    icon: 'location',
    iconBg: Colors.primaryFixed,
    iconColor: Colors.primary,
    title: 'Location Access',
    subtitle: 'Required for alarms to work',
    description: 'We need your location to detect when you\'re approaching your destination and trigger the alarm automatically.',
    details: [
      { icon: 'shield-checkmark', text: 'Your location data stays on your device only' },
      { icon: 'cloud-offline', text: 'No location data is sent to any server' },
      { icon: 'battery-charging', text: 'Smart battery optimization - uses GPS only when needed' },
    ],
    buttonText: 'Allow Location Access',
  },
  {
    key: 'background',
    icon: 'navigate-circle',
    iconBg: '#fef3c7',
    iconColor: '#d97706',
    title: '"Allow All The Time"',
    subtitle: 'Essential for background monitoring',
    description: 'For alarms to work when the app is in the background or your phone is locked, you MUST select "Allow all the time" in the next prompt.',
    details: [
      { icon: 'alert-circle', text: 'Choose "Allow all the time" — NOT "While using the app"', bold: true },
      { icon: 'alarm', text: 'Without this, alarms won\'t trigger when the screen is off' },
      { icon: 'information-circle', text: 'You can change this later in Settings → Apps → Vigilant Path' },
    ],
    buttonText: 'Grant Background Access',
    warningText: '⚠️ Select "Allow all the time" on the next screen',
  },
  {
    key: 'notifications',
    icon: 'notifications-circle',
    iconBg: Colors.tertiaryFixed,
    iconColor: Colors.tertiary,
    title: 'Notifications',
    subtitle: 'Get alerted when you arrive',
    description: 'We\'ll send you a notification when you enter your alarm\'s geofence, so you\'ll be alerted even if the app is in the background.',
    details: [
      { icon: 'megaphone', text: 'Alarm trigger notifications' },
      { icon: 'pulse', text: 'Background monitoring status' },
    ],
    buttonText: 'Allow Notifications',
  },
];

export default function OnboardingScreen({ navigation, onComplete }) {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = async () => {
    const step = STEPS[currentStep];

    if (step.key === 'welcome') {
      setCurrentStep(1);
      return;
    }

    if (step.key === 'location') {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Required',
          'Location access is essential for this app to work. Please grant location permission.',
          [
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
            { text: 'Try Again', onPress: () => handleNext() },
          ]
        );
        return;
      }
      setCurrentStep(2);
      return;
    }

    if (step.key === 'background') {
      const { status } = await Location.requestBackgroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          '⚠️ "Allow All The Time" Required',
          'You need to select "Allow all the time" for alarms to work in the background.\n\nPlease go to Settings and change the location permission to "Allow all the time".',
          [
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
            {
              text: 'Try Again',
              onPress: async () => {
                // Check again after returning from settings
                const recheck = await Location.getBackgroundPermissionsAsync();
                if (recheck.status === 'granted') {
                  setCurrentStep(3);
                } else {
                  Alert.alert(
                    'Still Not Granted',
                    'Background location is still not set to "Allow all the time". Alarms may not work properly in the background.\n\nYou can change this later in phone Settings.',
                    [
                      { text: 'Continue Anyway', onPress: () => setCurrentStep(3) },
                      { text: 'Open Settings', onPress: () => Linking.openSettings() },
                    ]
                  );
                }
              },
            },
          ]
        );
        return;
      }
      setCurrentStep(3);
      return;
    }

    if (step.key === 'notifications') {
      await Notifications.requestPermissionsAsync();
      // Complete onboarding regardless of notification permission
      onComplete();
      return;
    }
  };

  const step = STEPS[currentStep];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      {/* Progress dots */}
      <View style={styles.progressRow}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              i === currentStep && styles.progressDotActive,
              i < currentStep && styles.progressDotDone,
            ]}
          />
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Icon */}
        <View style={styles.heroSection}>
          <View style={[styles.iconCircle, { backgroundColor: step.iconBg }]}>
            <Ionicons name={step.icon} size={48} color={step.iconColor} />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.subtitle}>{step.subtitle}</Text>
        <Text style={styles.description}>{step.description}</Text>

        {/* Features (welcome screen) */}
        {step.features && (
          <View style={styles.featuresGrid}>
            {step.features.map((f, i) => (
              <View key={i} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name={f.icon} size={20} color={Colors.primary} />
                </View>
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Details list (permission screens) */}
        {step.details && (
          <View style={styles.detailsList}>
            {step.details.map((d, i) => (
              <View key={i} style={styles.detailItem}>
                <Ionicons name={d.icon} size={20} color={d.bold ? '#d97706' : Colors.primary} />
                <Text style={[styles.detailText, d.bold && styles.detailTextBold]}>{d.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Warning text */}
        {step.warningText && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>{step.warningText}</Text>
          </View>
        )}
      </ScrollView>

      {/* CTA Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleNext}
        style={styles.ctaWrapper}
      >
        <LinearGradient
          colors={[Colors.primary, Colors.primaryContainer]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ctaButton}
        >
          <Text style={styles.ctaText}>{step.buttonText}</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Skip option (only on notification step) */}
      {step.key === 'notifications' && (
        <TouchableOpacity onPress={onComplete} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: Spacing.xl,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: Spacing.xl,
  },
  progressDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.surfaceContainerHighest,
  },
  progressDotActive: {
    width: 28, backgroundColor: Colors.primary,
  },
  progressDotDone: {
    backgroundColor: Colors.primaryFixedDim,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  iconCircle: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 6,
  },
  title: {
    fontSize: 32, fontWeight: '800', color: Colors.onSurface,
    letterSpacing: -0.5, textAlign: 'center',
  },
  subtitle: {
    fontSize: 15, fontWeight: '600', color: Colors.primary,
    textAlign: 'center', marginTop: 4,
  },
  description: {
    fontSize: 15, color: Colors.onSurfaceVariant,
    lineHeight: 22, textAlign: 'center',
    marginTop: Spacing.lg, marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  featuresGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  featureItem: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primaryFixed,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: BorderRadius.full,
  },
  featureIcon: {},
  featureText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  detailsList: {
    gap: Spacing.md, marginBottom: Spacing.xl,
  },
  detailItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    backgroundColor: Colors.surfaceContainerHigh,
    padding: Spacing.lg, borderRadius: BorderRadius.xl,
  },
  detailText: {
    flex: 1, fontSize: 14, color: Colors.onSurfaceVariant, lineHeight: 20,
  },
  detailTextBold: {
    fontWeight: '700', color: '#92400e',
  },
  warningBox: {
    backgroundColor: '#fef3c7', padding: Spacing.lg,
    borderRadius: BorderRadius.xl, borderWidth: 1,
    borderColor: '#fbbf24', marginBottom: Spacing.lg,
  },
  warningText: {
    fontSize: 14, fontWeight: '700', color: '#92400e', textAlign: 'center',
  },
  ctaWrapper: {
    borderRadius: BorderRadius.full, overflow: 'hidden',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 24, elevation: 8,
    marginTop: Spacing.lg,
  },
  ctaButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: 18, borderRadius: BorderRadius.full,
  },
  ctaText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  skipBtn: {
    alignItems: 'center', paddingVertical: Spacing.md, marginTop: Spacing.sm,
  },
  skipText: { fontSize: 14, color: Colors.outline, fontWeight: '600' },
});
