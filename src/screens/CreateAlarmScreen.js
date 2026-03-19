import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Switch, Alert, Platform, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, BorderRadius, Spacing } from '../constants/theme';

const STORAGE_KEY = '@vigilant_alarms';

export default function CreateAlarmScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const editAlarm = route.params?.alarm;

  const [label, setLabel] = useState(editAlarm?.label || '');
  const [address, setAddress] = useState(editAlarm?.address || '');
  const [radius, setRadius] = useState(editAlarm?.radius || 500);
  const [vibrateOn, setVibrateOn] = useState(editAlarm?.vibrate ?? true);
  const [region, setRegion] = useState({
    latitude: editAlarm?.latitude || 12.9716,
    longitude: editAlarm?.longitude || 77.5946,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [markerCoord, setMarkerCoord] = useState(
    editAlarm ? { latitude: editAlarm.latitude, longitude: editAlarm.longitude } : null
  );

  useEffect(() => {
    if (!editAlarm) {
      (async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const newRegion = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          setRegion(newRegion);
          mapRef.current?.animateToRegion(newRegion, 1000);
        }
      })();
    }
  }, []);

  const handleMapPress = async (e) => {
    const coord = e.nativeEvent.coordinate;
    setMarkerCoord(coord);

    // Reverse geocode
    try {
      const results = await Location.reverseGeocodeAsync(coord);
      if (results.length > 0) {
        const r = results[0];
        const parts = [r.name, r.street, r.city, r.region].filter(Boolean);
        setAddress(parts.join(', '));
      }
    } catch (err) {
      setAddress(`${coord.latitude.toFixed(5)}, ${coord.longitude.toFixed(5)}`);
    }
  };

  const handleSave = async () => {
    if (!markerCoord) {
      Alert.alert('No location', 'Tap on the map to set a destination.');
      return;
    }
    if (!label.trim()) {
      Alert.alert('No label', 'Please enter a name for this alarm.');
      return;
    }

    const alarmData = {
      id: editAlarm?.id || Date.now().toString(),
      label: label.trim(),
      address: address || 'Custom Location',
      latitude: markerCoord.latitude,
      longitude: markerCoord.longitude,
      radius,
      vibrate: vibrateOn,
      active: editAlarm?.active ?? true,
      createdAt: editAlarm?.createdAt || new Date().toISOString(),
    };

    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      let alarms = data ? JSON.parse(data) : [];

      if (editAlarm) {
        alarms = alarms.map(a => a.id === editAlarm.id ? alarmData : a);
      } else {
        alarms.unshift(alarmData);
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to save alarm.');
    }
  };

  const radiusPercent = ((radius - 100) / (5000 - 100)) * 100;

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        onPress={handleMapPress}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {markerCoord && (
          <>
            <Marker coordinate={markerCoord} pinColor={Colors.secondary} />
            <Circle
              center={markerCoord}
              radius={radius}
              fillColor="rgba(0, 64, 161, 0.1)"
              strokeColor="rgba(0, 64, 161, 0.3)"
              strokeWidth={2}
            />
          </>
        )}
      </MapView>

      {/* Top App Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>{editAlarm ? 'Edit Alarm' : 'New Alarm'}</Text>
        </View>
        <TouchableOpacity activeOpacity={0.85} onPress={handleSave}>
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

      {/* My Location Button */}
      <TouchableOpacity
        style={[styles.myLocBtn, { top: insets.top + 70 }]}
        onPress={async () => {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const newRegion = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          mapRef.current?.animateToRegion(newRegion, 800);
        }}
      >
        <Ionicons name="locate" size={22} color={Colors.primary} />
      </TouchableOpacity>

      {/* Bottom Config Card */}
      <View style={[styles.configCard, { paddingBottom: insets.bottom + 16 }]}>
        {/* Label Input */}
        <View style={styles.inputRow}>
          <Ionicons name="bookmark-outline" size={20} color={Colors.primary} />
          <TextInput
            style={styles.input}
            placeholder="Alarm name (e.g. Work, Home)"
            placeholderTextColor={Colors.outline}
            value={label}
            onChangeText={setLabel}
          />
        </View>

        {/* Address Display */}
        {address ? (
          <View style={styles.addressRow}>
            <Ionicons name="location" size={16} color={Colors.secondary} />
            <Text style={styles.addressText} numberOfLines={1}>{address}</Text>
          </View>
        ) : (
          <Text style={styles.hintText}>Tap on the map to select destination</Text>
        )}

        {/* Radius */}
        <View style={styles.radiusSection}>
          <View style={styles.radiusHeader}>
            <Text style={styles.sectionTitle}>Radius</Text>
            <View style={styles.radiusBadge}>
              <Text style={styles.radiusValue}>{radius}</Text>
              <Text style={styles.radiusUnit}>m</Text>
            </View>
          </View>
          <View style={styles.sliderContainer}>
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderFill, { width: `${radiusPercent}%` }]} />
            </View>
            {/* Simple increment on tap */}
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={() => setRadius(prev => {
                const next = prev + 100;
                return next > 5000 ? 100 : next;
              })}
            />
          </View>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>100m</Text>
            <Text style={styles.sliderLabel}>2.5km</Text>
            <Text style={styles.sliderLabel}>5km</Text>
          </View>
        </View>

        {/* Vibrate */}
        <View style={styles.vibrateRow}>
          <View style={styles.vibrateLeft}>
            <Ionicons name="phone-portrait-outline" size={18} color={Colors.onTertiaryFixed} />
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  // Top Bar
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm,
    backgroundColor: 'rgba(250, 248, 255, 0.85)',
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  iconBtn: { padding: 8 },
  topBarTitle: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: BorderRadius.full },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  // My Location
  myLocBtn: {
    position: 'absolute', right: 16, zIndex: 40,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  // Config Card
  configCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.xl, gap: Spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08, shadowRadius: 24, elevation: 8,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surfaceContainerHigh, borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg, paddingVertical: Platform.OS === 'ios' ? 14 : 4,
  },
  input: { flex: 1, fontSize: 15, color: Colors.onSurface },
  addressRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: 4,
  },
  addressText: { flex: 1, fontSize: 13, color: Colors.onSurfaceVariant, fontWeight: '500' },
  hintText: { fontSize: 13, color: Colors.outline, paddingHorizontal: 4 },
  // Radius
  radiusSection: { gap: Spacing.md },
  radiusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.onSurface },
  radiusBadge: {
    flexDirection: 'row', alignItems: 'baseline', gap: 2,
    backgroundColor: Colors.primaryFixed, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: BorderRadius.xl,
  },
  radiusValue: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  radiusUnit: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  sliderContainer: { height: 20, justifyContent: 'center' },
  sliderTrack: { height: 6, backgroundColor: Colors.surfaceContainerHighest, borderRadius: 3, overflow: 'hidden' },
  sliderFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderLabel: { fontSize: 9, fontWeight: '700', color: Colors.outline, textTransform: 'uppercase', letterSpacing: 1 },
  // Vibrate
  vibrateRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.surfaceContainerHigh,
  },
  vibrateLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  vibrateText: { fontSize: 14, fontWeight: '600', color: Colors.onSurface },
});
