import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Switch, Alert, Platform, Keyboard,
  ScrollView, Modal, FlatList, ActivityIndicator, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Circle } from 'react-native-maps';
import Slider from '@react-native-community/slider';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, BorderRadius, Spacing } from '../constants/theme';

const STORAGE_KEY = '@vigilant_alarms';

const RINGTONES = [
  { id: 'default', name: 'Default Alarm', icon: 'musical-notes' },
  { id: 'beacon', name: 'Beacon', icon: 'radio-outline' },
  { id: 'chime', name: 'Chime', icon: 'notifications-outline' },
  { id: 'radar', name: 'Radar', icon: 'pulse-outline' },
  { id: 'signal', name: 'Signal', icon: 'megaphone-outline' },
  { id: 'waves', name: 'Waves', icon: 'water-outline' },
  { id: 'ping', name: 'Ping', icon: 'ellipse-outline' },
  { id: 'bell', name: 'Classic Bell', icon: 'notifications-circle-outline' },
  { id: 'digital', name: 'Digital', icon: 'hardware-chip-outline' },
  { id: 'gentle', name: 'Gentle Wake', icon: 'sunny-outline' },
];

export default function CreateAlarmScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const searchTimeout = useRef(null);
  const editAlarm = route.params?.alarm;

  const [label, setLabel] = useState(editAlarm?.label || '');
  const [address, setAddress] = useState(editAlarm?.address || '');
  const [radius, setRadius] = useState(editAlarm?.radius || 500);
  const [radiusInput, setRadiusInput] = useState('');
  const [radiusUnit, setRadiusUnit] = useState('m'); // 'm' or 'km'
  const [showRadiusInput, setShowRadiusInput] = useState(false);
  const [vibrateOn, setVibrateOn] = useState(editAlarm?.vibrate ?? true);
  const [soundOn, setSoundOn] = useState(editAlarm?.sound ?? true);
  const [selectedRingtone, setSelectedRingtone] = useState(editAlarm?.ringtone || 'default');
  const [showRingtonePicker, setShowRingtonePicker] = useState(false);
  // Default to 0,0 - will be immediately replaced by GPS location
  const [region, setRegion] = useState({
    latitude: editAlarm?.latitude || 0,
    longitude: editAlarm?.longitude || 0,
    latitudeDelta: editAlarm ? 0.01 : 0.5,
    longitudeDelta: editAlarm ? 0.01 : 0.5,
  });
  const [mapReady, setMapReady] = useState(!!editAlarm);
  const [markerCoord, setMarkerCoord] = useState(
    editAlarm ? { latitude: editAlarm.latitude, longitude: editAlarm.longitude } : null
  );

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

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

  // Search for locations using geocoding
  const searchLocation = async (query) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    setIsSearching(true);
    setShowSearchResults(true);
    try {
      const results = await Location.geocodeAsync(query);
      if (results.length > 0) {
        // Reverse geocode each result to get readable addresses
        const enrichedResults = await Promise.all(
          results.slice(0, 5).map(async (r) => {
            try {
              const reverseResults = await Location.reverseGeocodeAsync({
                latitude: r.latitude,
                longitude: r.longitude,
              });
              const addr = reverseResults[0];
              const parts = [addr?.name, addr?.street, addr?.city, addr?.region, addr?.country].filter(Boolean);
              return {
                ...r,
                displayAddress: parts.join(', '),
              };
            } catch {
              return {
                ...r,
                displayAddress: `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}`,
              };
            }
          })
        );
        setSearchResults(enrichedResults);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchLocation(text), 600);
  };

  const handleSelectSearchResult = (result) => {
    const coord = { latitude: result.latitude, longitude: result.longitude };
    setMarkerCoord(coord);
    setAddress(result.displayName ? `${result.displayName}\n${result.displayAddress}` : result.displayAddress);
    // Auto-fill the alarm label with the search query if label is empty
    if (!label.trim() && searchQuery.trim()) {
      setLabel(searchQuery.trim());
    }
    setSearchQuery('');
    setShowSearchResults(false);
    setSearchResults([]);
    Keyboard.dismiss();

    const newRegion = {
      ...coord,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    mapRef.current?.animateToRegion(newRegion, 800);
  };

  const handleMapPress = async (e) => {
    Keyboard.dismiss();
    setShowSearchResults(false);
    const coord = e.nativeEvent.coordinate;
    setMarkerCoord(coord);

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

  const handleRadiusInputSubmit = () => {
    let value = parseFloat(radiusInput);
    if (isNaN(value) || value <= 0) {
      setShowRadiusInput(false);
      setRadiusInput('');
      return;
    }
    if (radiusUnit === 'km') {
      value = value * 1000;
    }
    // Clamp between 50 and 50000 meters
    value = Math.max(50, Math.min(50000, Math.round(value)));
    setRadius(value);
    setShowRadiusInput(false);
    setRadiusInput('');
  };

  const getDisplayRadius = () => {
    if (radius >= 1000) {
      return { value: (radius / 1000).toFixed(1).replace(/\.0$/, ''), unit: 'km' };
    }
    return { value: radius.toString(), unit: 'm' };
  };

  const getRingtoneName = (id) => {
    return RINGTONES.find(r => r.id === id)?.name || 'Default Alarm';
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
      sound: soundOn,
      ringtone: selectedRingtone,
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

  const displayRadius = getDisplayRadius();

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
        <View style={styles.topBarRow}>
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

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={Colors.outline} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a place or address..."
              placeholderTextColor={Colors.outline}
              value={searchQuery}
              onChangeText={handleSearchChange}
              returnKeyType="search"
              onSubmitEditing={() => searchLocation(searchQuery)}
              onFocus={() => { if (searchResults.length > 0) setShowSearchResults(true); }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
                setShowSearchResults(false);
              }}>
                 <Ionicons name="close-circle" size={18} color={Colors.outline} />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Results Dropdown */}
          {showSearchResults && (
            <View style={styles.searchResultsContainer}>
              {isSearching ? (
                <View style={styles.searchLoadingRow}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.searchLoadingText}>Searching...</Text>
                </View>
              ) : searchResults.length === 0 ? (
                <View style={styles.searchLoadingRow}>
                  <Ionicons name="alert-circle-outline" size={18} color={Colors.outline} />
                  <Text style={styles.searchLoadingText}>No results found</Text>
                </View>
              ) : (
                searchResults.map((result, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.searchResultItem, index < searchResults.length - 1 && styles.searchResultBorder]}
                    onPress={() => handleSelectSearchResult(result)}
                  >
                    <Ionicons name="location" size={18} color={Colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.searchResultName} numberOfLines={1}>{searchQuery}</Text>
                      <Text style={styles.searchResultAddress} numberOfLines={1}>{result.displayAddress}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>
      </View>

      {/* My Location Button */}
      <TouchableOpacity
        style={[styles.myLocBtn, { top: insets.top + 130 }]}
        onPress={async () => {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const coord = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          const newRegion = { ...coord, latitudeDelta: 0.01, longitudeDelta: 0.01 };
          // Place marker at current location
          setMarkerCoord(coord);
          mapRef.current?.animateToRegion(newRegion, 800);
          // Reverse geocode current location
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
        }}
      >
        <Ionicons name="locate" size={22} color={Colors.primary} />
      </TouchableOpacity>

      {/* Bottom Config Card */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.configCardWrapper}
        pointerEvents="box-none"
      >
        <View style={[styles.configCard, { paddingBottom: insets.bottom + 16 }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            style={{ maxHeight: 260 }}
          >
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

            {/* Radius Section */}
            <View style={styles.radiusSection}>
              <View style={styles.radiusHeader}>
                <Text style={styles.sectionTitle}>Radius</Text>
                <TouchableOpacity
                  style={styles.radiusBadge}
                  onPress={() => {
                    const dr = getDisplayRadius();
                    setRadiusInput(dr.value);
                    setRadiusUnit(dr.unit);
                    setShowRadiusInput(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.radiusValue}>{displayRadius.value}</Text>
                  <Text style={styles.radiusUnit}>{displayRadius.unit}</Text>
                  <Ionicons name="pencil" size={10} color={Colors.primary} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>

              {/* Actual Slider */}
              <Slider
                style={styles.slider}
                minimumValue={50}
                maximumValue={10000}
                step={50}
                value={radius}
                onValueChange={(val) => setRadius(val)}
                minimumTrackTintColor={Colors.primary}
                maximumTrackTintColor={Colors.surfaceContainerHighest}
                thumbTintColor={Colors.primary}
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>50m</Text>
                <Text style={styles.sliderLabel}>5km</Text>
                <Text style={styles.sliderLabel}>10km</Text>
              </View>

            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Vibrate Toggle */}
            <View style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, { backgroundColor: Colors.primaryFixed }]}>
                  <Ionicons name="phone-portrait-outline" size={18} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.optionTitle}>Vibrate on Arrival</Text>
                  <Text style={styles.optionSubtitle}>Phone will vibrate when you're near</Text>
                </View>
              </View>
              <Switch
                value={vibrateOn}
                onValueChange={setVibrateOn}
                trackColor={{ false: Colors.surfaceContainerHighest, true: Colors.primary }}
                thumbColor="#fff"
              />
            </View>

            {/* Sound Toggle */}
            <View style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, { backgroundColor: Colors.secondaryFixed }]}>
                  <Ionicons name="volume-high-outline" size={18} color={Colors.secondary} />
                </View>
                <View>
                  <Text style={styles.optionTitle}>Sound Alarm</Text>
                  <Text style={styles.optionSubtitle}>Play an alarm sound on arrival</Text>
                </View>
              </View>
              <Switch
                value={soundOn}
                onValueChange={setSoundOn}
                trackColor={{ false: Colors.surfaceContainerHighest, true: Colors.secondary }}
                thumbColor="#fff"
              />
            </View>

            {/* Ringtone Picker (only shown when sound is on) */}
            {soundOn && (
              <TouchableOpacity
                style={styles.ringtoneRow}
                onPress={() => setShowRingtonePicker(true)}
                activeOpacity={0.7}
              >
                <View style={styles.optionLeft}>
                  <View style={[styles.optionIcon, { backgroundColor: Colors.tertiaryFixed }]}>
                    <Ionicons name="musical-notes" size={18} color={Colors.tertiary} />
                  </View>
                  <View>
                    <Text style={styles.optionTitle}>Ringtone</Text>
                    <Text style={styles.optionSubtitle}>{getRingtoneName(selectedRingtone)}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.outline} />
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Radius Input Modal */}
      <Modal
        visible={showRadiusInput}
        animationType="fade"
        transparent={true}
        onRequestClose={() => { setShowRadiusInput(false); setRadiusInput(''); }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.radiusModalOverlay}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => { setShowRadiusInput(false); setRadiusInput(''); }}
          />
          <View style={styles.radiusModalContent}>
            <View style={styles.radiusModalHandle} />
            <Text style={styles.radiusModalTitle}>Enter Custom Radius</Text>
            <Text style={styles.radiusModalSubtitle}>Set the geofence distance in meters or kilometers</Text>

            <View style={styles.radiusModalInputRow}>
              <TextInput
                style={styles.radiusModalInput}
                value={radiusInput}
                onChangeText={setRadiusInput}
                keyboardType="numeric"
                placeholder="Enter distance"
                placeholderTextColor={Colors.outline}
                autoFocus
                selectTextOnFocus
                onSubmitEditing={handleRadiusInputSubmit}
              />
            </View>

            <View style={styles.radiusModalUnitRow}>
              <TouchableOpacity
                style={[styles.radiusModalUnitBtn, radiusUnit === 'm' && styles.radiusModalUnitBtnActive]}
                onPress={() => {
                  if (radiusUnit === 'km') {
                    const val = parseFloat(radiusInput);
                    if (!isNaN(val)) setRadiusInput((val * 1000).toString());
                  }
                  setRadiusUnit('m');
                }}
              >
                <Text style={[styles.radiusModalUnitText, radiusUnit === 'm' && styles.radiusModalUnitTextActive]}>Meters (m)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.radiusModalUnitBtn, radiusUnit === 'km' && styles.radiusModalUnitBtnActive]}
                onPress={() => {
                  if (radiusUnit === 'm') {
                    const val = parseFloat(radiusInput);
                    if (!isNaN(val)) setRadiusInput((val / 1000).toString());
                  }
                  setRadiusUnit('km');
                }}
              >
                <Text style={[styles.radiusModalUnitText, radiusUnit === 'km' && styles.radiusModalUnitTextActive]}>Kilometers (km)</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.radiusModalActions}>
              <TouchableOpacity
                style={styles.radiusModalCancelBtn}
                onPress={() => { setShowRadiusInput(false); setRadiusInput(''); }}
              >
                <Text style={styles.radiusModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radiusModalApplyBtn}
                onPress={handleRadiusInputSubmit}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryContainer]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.radiusModalApplyGradient}
                >
                  <Text style={styles.radiusModalApplyText}>Apply</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Ringtone Picker Modal */}
      <Modal
        visible={showRingtonePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRingtonePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Ringtone</Text>
              <TouchableOpacity onPress={() => setShowRingtonePicker(false)}>
                <Ionicons name="close-circle" size={28} color={Colors.outline} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={RINGTONES}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.ringtoneItem,
                    selectedRingtone === item.id && styles.ringtoneItemActive,
                  ]}
                  onPress={() => {
                    setSelectedRingtone(item.id);
                    setShowRingtonePicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.ringtoneIconContainer,
                    selectedRingtone === item.id && styles.ringtoneIconContainerActive,
                  ]}>
                    <Ionicons
                      name={item.icon}
                      size={22}
                      color={selectedRingtone === item.id ? Colors.primary : Colors.onSurfaceVariant}
                    />
                  </View>
                  <Text style={[
                    styles.ringtoneItemText,
                    selectedRingtone === item.id && styles.ringtoneItemTextActive,
                  ]}>
                    {item.name}
                  </Text>
                  {selectedRingtone === item.id && (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  // Top Bar - transparent over map
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50,
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm,
  },
  topBarRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  iconBtn: {
    padding: 8, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  topBarTitle: {
    fontSize: 18, fontWeight: '800', color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: BorderRadius.full },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  // Search
  searchContainer: { marginTop: Spacing.sm, zIndex: 100 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: '#fff', borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg, paddingVertical: Platform.OS === 'ios' ? 12 : 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.onSurface },
  searchResultsContainer: {
    backgroundColor: '#fff', borderRadius: BorderRadius.lg,
    marginTop: 4, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 5,
    maxHeight: 250,
  },
  searchResultItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  searchResultBorder: {
    borderBottomWidth: 1, borderBottomColor: Colors.surfaceContainerHigh,
  },
  searchResultText: { flex: 1, fontSize: 13, color: Colors.onSurface, fontWeight: '500' },
  searchResultName: { fontSize: 14, fontWeight: '700', color: Colors.onSurface },
  searchResultAddress: { fontSize: 11, color: Colors.outline, marginTop: 1 },
  searchLoadingRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg,
  },
  searchLoadingText: { fontSize: 13, color: Colors.outline },
  // My Location
  myLocBtn: {
    position: 'absolute', right: 16, zIndex: 40,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  // Config Card
  configCardWrapper: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  configCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    shadowColor: '#000', shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08, shadowRadius: 24, elevation: 8,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surfaceContainerHigh, borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg, paddingVertical: Platform.OS === 'ios' ? 14 : 4,
    marginBottom: Spacing.md,
  },
  input: { flex: 1, fontSize: 15, color: Colors.onSurface },
  addressRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: 4, marginBottom: Spacing.lg,
  },
  addressText: { flex: 1, fontSize: 13, color: Colors.onSurfaceVariant, fontWeight: '500' },
  hintText: { fontSize: 13, color: Colors.outline, paddingHorizontal: 4, marginBottom: Spacing.lg },
  // Radius
  radiusSection: { marginBottom: Spacing.md },
  radiusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.onSurface },
  radiusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: Colors.primaryFixed, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: BorderRadius.xl,
  },
  radiusValue: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  radiusUnit: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  slider: {
    width: '100%', height: 40,
  },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -4 },
  sliderLabel: { fontSize: 9, fontWeight: '700', color: Colors.outline, textTransform: 'uppercase', letterSpacing: 1 },
  // Manual Radius
  manualRadiusContainer: { marginTop: Spacing.sm },
  manualRadiusInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
  },
  manualRadiusInput: {
    flex: 1, backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    fontSize: 15, color: Colors.onSurface, fontWeight: '600',
  },
  unitToggle: {
    flexDirection: 'row', backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: BorderRadius.lg, overflow: 'hidden',
  },
  unitBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
  },
  unitBtnActive: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
  },
  unitBtnText: { fontSize: 13, fontWeight: '700', color: Colors.onSurfaceVariant },
  unitBtnTextActive: { color: '#fff' },
  manualRadiusApply: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  manualRadiusCancel: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  // Divider
  divider: {
    height: 1, backgroundColor: Colors.surfaceContainerHigh,
    marginVertical: Spacing.md,
  },
  // Options
  optionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  optionIcon: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  optionTitle: { fontSize: 14, fontWeight: '600', color: Colors.onSurface },
  optionSubtitle: { fontSize: 11, color: Colors.outline, marginTop: 1 },
  // Ringtone Row
  ringtoneRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    marginTop: 2,
  },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.xl, maxHeight: '60%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
    alignSelf: 'center', marginBottom: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.onSurface },
  ringtoneItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.lg,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg, marginBottom: 2,
  },
  ringtoneItemActive: {
    backgroundColor: Colors.primaryFixed,
  },
  ringtoneIconContainer: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  ringtoneIconContainerActive: {
    backgroundColor: 'rgba(0, 64, 161, 0.15)',
  },
  ringtoneItemText: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.onSurface },
  ringtoneItemTextActive: { color: Colors.primary },
  // Radius Modal
  radiusModalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  radiusModalContent: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xxl, padding: Spacing.xl,
    width: '100%', maxWidth: 400,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 24, elevation: 12,
  },
  radiusModalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
    alignSelf: 'center', marginBottom: Spacing.lg,
  },
  radiusModalTitle: {
    fontSize: 20, fontWeight: '800', color: Colors.onSurface, textAlign: 'center',
  },
  radiusModalSubtitle: {
    fontSize: 13, color: Colors.outline, textAlign: 'center', marginTop: 4, marginBottom: Spacing.xl,
  },
  radiusModalInputRow: {
    marginBottom: Spacing.lg,
  },
  radiusModalInput: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.xl,
    paddingVertical: Platform.OS === 'ios' ? 16 : 12,
    fontSize: 24, color: Colors.onSurface, fontWeight: '800',
    textAlign: 'center',
  },
  radiusModalUnitRow: {
    flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl,
  },
  radiusModalUnitBtn: {
    flex: 1, paddingVertical: 12, borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
  },
  radiusModalUnitBtnActive: {
    backgroundColor: Colors.primaryFixed,
  },
  radiusModalUnitText: {
    fontSize: 14, fontWeight: '700', color: Colors.onSurfaceVariant,
  },
  radiusModalUnitTextActive: {
    color: Colors.primary,
  },
  radiusModalActions: {
    flexDirection: 'row', gap: Spacing.md,
  },
  radiusModalCancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  radiusModalCancelText: {
    fontSize: 15, fontWeight: '700', color: Colors.onSurfaceVariant,
  },
  radiusModalApplyBtn: {
    flex: 1, borderRadius: BorderRadius.full, overflow: 'hidden',
  },
  radiusModalApplyGradient: {
    paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
  },
  radiusModalApplyText: {
    fontSize: 15, fontWeight: '700', color: '#fff',
  },
});
