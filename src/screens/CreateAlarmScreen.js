import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Switch, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Spacing } from '../constants/theme';
import BottomTabBar from '../components/BottomTabBar';

const { width, height } = Dimensions.get('window');

export default function CreateAlarmScreen({ navigation }) {
  const [radius, setRadius] = useState(800);
  const [selectedSound, setSelectedSound] = useState('morning');
  const [vibrateOn, setVibrateOn] = useState(true);
  const [searchText, setSearchText] = useState('Millennium Park, Chicago');

  const radiusPercent = ((radius - 100) / (5000 - 100)) * 100;

  return (
    <View style={styles.container}>
      {/* Map Background */}
      <View style={styles.mapBackground}>
        {/* Grid pattern to simulate map */}
        <View style={styles.mapGrid}>
          {Array.from({ length: 20 }).map((_, row) => (
            <View key={row} style={styles.mapRow}>
              {Array.from({ length: 10 }).map((_, col) => (
                <View
                  key={col}
                  style={[
                    styles.mapCell,
                    (row + col) % 3 === 0 && styles.mapCellHighlight,
                    (row + col) % 7 === 0 && styles.mapCellRoad,
                  ]}
                />
              ))}
            </View>
          ))}
        </View>

        {/* Map Overlay Gradient */}
        <LinearGradient
          colors={['rgba(250,248,255,0.2)', 'transparent', 'rgba(250,248,255,0.4)']}
          style={StyleSheet.absoluteFill}
        />

        {/* Map Pin Marker */}
        <View style={styles.markerContainer}>
          <View style={styles.pulseOuter} />
          <View style={styles.pulseInner} />
          <View style={styles.markerPin}>
            <Ionicons name="location" size={24} color="#fff" />
          </View>
        </View>
      </View>

      {/* Top App Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Set Arrival Alarm</Text>
        </View>
        <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.goBack()}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryContainer]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.saveBtn}
          >
            <Text style={styles.saveBtnText}>Save</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Floating UI Overlays */}
      <View style={styles.overlayContainer} pointerEvents="box-none">
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.primary} style={{ marginLeft: 12 }} />
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search for your destination..."
            placeholderTextColor={Colors.outline}
          />
          <TouchableOpacity style={{ padding: 12 }}>
            <Ionicons name="locate" size={20} color={Colors.outlineVariant} />
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }} />

        {/* Config Card */}
        <View style={styles.configCard}>
          {/* Proximity Radius */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Proximity Radius</Text>
                <Text style={styles.sectionSubtitle}>Wake me up when I'm within...</Text>
              </View>
              <View style={styles.radiusBadge}>
                <Text style={styles.radiusValue}>{radius}</Text>
                <Text style={styles.radiusUnit}>meters</Text>
              </View>
            </View>

            {/* Slider Track */}
            <View style={styles.sliderContainer}>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: `${radiusPercent}%` }]} />
              </View>
              <View style={[styles.sliderThumb, { left: `${radiusPercent}%` }]} />
              {/* Touch area for slider */}
              <TouchableOpacity
                style={styles.sliderTouchArea}
                onPress={() => setRadius(prev => prev >= 5000 ? 100 : prev + 200)}
              />
            </View>

            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>100m</Text>
              <Text style={styles.sliderLabel}>2.5km</Text>
              <Text style={styles.sliderLabel}>5km</Text>
            </View>
          </View>

          {/* Sound Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notification Sound</Text>
            <View style={styles.soundGrid}>
              <TouchableOpacity
                style={[styles.soundOption, selectedSound === 'morning' && styles.soundOptionActive]}
                onPress={() => setSelectedSound('morning')}
              >
                <View style={[styles.soundIcon, selectedSound === 'morning' && styles.soundIconActive]}>
                  <Ionicons
                    name="musical-note"
                    size={16}
                    color={selectedSound === 'morning' ? Colors.onPrimary : Colors.onSurfaceVariant}
                  />
                </View>
                <View>
                  <Text style={[styles.soundName, selectedSound === 'morning' && styles.soundNameActive]}>Morning Dew</Text>
                  <Text style={[styles.soundStatus, selectedSound === 'morning' && styles.soundStatusActive]}>
                    {selectedSound === 'morning' ? 'ACTIVE' : 'Gentle'}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.soundOption, selectedSound === 'city' && styles.soundOptionActive]}
                onPress={() => setSelectedSound('city')}
              >
                <View style={[styles.soundIcon, selectedSound === 'city' && styles.soundIconActive]}>
                  <Ionicons
                    name="notifications-outline"
                    size={16}
                    color={selectedSound === 'city' ? Colors.onPrimary : Colors.onSurfaceVariant}
                  />
                </View>
                <View>
                  <Text style={[styles.soundName, selectedSound === 'city' && styles.soundNameActive]}>City Pulse</Text>
                  <Text style={[styles.soundStatus, selectedSound === 'city' && styles.soundStatusActive]}>
                    {selectedSound === 'city' ? 'ACTIVE' : 'Ambient'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Vibrate Toggle */}
          <View style={styles.vibrateRow}>
            <View style={styles.vibrateLeft}>
              <View style={styles.vibrateIcon}>
                <Ionicons name="phone-portrait-outline" size={20} color={Colors.onTertiaryFixed} />
              </View>
              <Text style={styles.vibrateText}>Vibrate on Arrival</Text>
            </View>
            <Switch
              value={vibrateOn}
              onValueChange={setVibrateOn}
              trackColor={{ false: Colors.surfaceContainerHighest, true: Colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </View>

      {/* Bottom Tab Bar */}
      <BottomTabBar activeTab="CreateAlarm" onTabPress={(tab) => {
        if (tab === 'AlarmList') navigation.navigate('AlarmList');
      }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  // Map Background
  mapBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.surfaceContainer,
  },
  mapGrid: {
    flex: 1,
    opacity: 0.6,
  },
  mapRow: {
    flexDirection: 'row',
    flex: 1,
  },
  mapCell: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
    margin: 0.5,
  },
  mapCellHighlight: {
    backgroundColor: Colors.surfaceContainerHigh,
  },
  mapCellRoad: {
    backgroundColor: Colors.surfaceContainerHighest,
  },
  markerContainer: {
    position: 'absolute',
    top: '38%',
    left: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -48 }, { translateY: -48 }],
  },
  pulseOuter: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(0, 64, 161, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(0, 64, 161, 0.2)',
  },
  pulseInner: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 64, 161, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(0, 64, 161, 0.4)',
  },
  markerPin: {
    backgroundColor: Colors.secondary,
    padding: 12,
    borderRadius: BorderRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 4,
    borderColor: Colors.surface,
  },
  // Top Bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: 56,
    paddingBottom: Spacing.md,
    backgroundColor: 'rgba(250, 248, 255, 0.7)',
    zIndex: 50,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  iconBtn: {
    padding: 8,
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.3,
  },
  saveBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
  },
  saveBtnText: {
    color: Colors.onPrimary,
    fontWeight: '600',
    fontSize: 15,
  },
  // Overlays
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    padding: Spacing.xl,
    paddingTop: 110,
    paddingBottom: 90,
    justifyContent: 'space-between',
  },
  // Search Bar
  searchBar: {
    backgroundColor: 'rgba(250, 248, 255, 0.7)',
    borderRadius: BorderRadius.lg + 4,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 15,
    color: Colors.onSurfaceVariant,
  },
  // Config Card
  configCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    gap: Spacing.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.06,
    shadowRadius: 40,
    elevation: 6,
  },
  section: {
    gap: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    marginTop: 4,
  },
  radiusBadge: {
    backgroundColor: Colors.primaryFixed,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  radiusValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  radiusUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  // Slider
  sliderContainer: {
    height: 24,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  sliderTrack: {
    height: 8,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 4,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  sliderThumb: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginLeft: -12,
  },
  sliderTouchArea: {
    ...StyleSheet.absoluteFillObject,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sliderLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.outline,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // Sound
  soundGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  soundOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg + 4,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  soundOptionActive: {
    backgroundColor: Colors.primaryFixed,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  soundIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundIconActive: {
    backgroundColor: Colors.primary,
  },
  soundName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  soundNameActive: {
    color: Colors.onPrimaryFixed,
  },
  soundStatus: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: Colors.outline,
    marginTop: 1,
  },
  soundStatusActive: {
    color: Colors.onPrimaryFixedVariant,
  },
  // Vibrate
  vibrateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceContainerHigh,
  },
  vibrateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  vibrateIcon: {
    backgroundColor: Colors.tertiaryFixed,
    padding: 8,
    borderRadius: BorderRadius.full,
  },
  vibrateText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.onSurface,
  },
});
