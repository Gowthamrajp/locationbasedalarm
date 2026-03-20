import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, BorderRadius, Spacing } from '../constants/theme';
import BottomTabBar from '../components/BottomTabBar';

const STORAGE_KEY = '@vigilant_alarms';

export default function AlarmListScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [alarms, setAlarms] = useState([]);

  const loadAlarms = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) setAlarms(JSON.parse(data));
    } catch (e) {
      console.log('Error loading alarms', e);
    }
  };

  const saveAlarms = async (newAlarms) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newAlarms));
    } catch (e) {
      console.log('Error saving alarms', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAlarms();
    }, [])
  );

  const toggleAlarm = (id) => {
    const updated = alarms.map(a => a.id === id ? { ...a, active: !a.active } : a);
    setAlarms(updated);
    saveAlarms(updated);
  };

  const deleteAlarm = (id) => {
    Alert.alert('Delete Alarm', 'Are you sure you want to delete this alarm?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updated = alarms.filter(a => a.id !== id);
          setAlarms(updated);
          saveAlarms(updated);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Top App Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.appTitle}>Vigilant Path</Text>
        <View style={styles.avatar}>
          <Ionicons name="person" size={20} color={Colors.primary} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.editorialHeader}>
          <Text style={styles.sectionLabel}>Active Monitor</Text>
          <Text style={styles.pageTitle}>Your Alarms</Text>
          <Text style={styles.pageSubtitle}>
            {alarms.length === 0
              ? 'Tap + to create your first location alarm.'
              : `${alarms.filter(a => a.active).length} active of ${alarms.length} alarms.`}
          </Text>
        </View>

        {/* Empty State */}
        {alarms.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={48} color={Colors.outlineVariant} />
            <Text style={styles.emptyText}>No alarms yet</Text>
            <Text style={styles.emptySubtext}>Create an alarm to get notified when you reach a destination</Text>
          </View>
        )}

        {/* Alarm Cards */}
        <View style={styles.alarmList}>
          {alarms.map((alarm, idx) => (
            <AlarmCard
              key={alarm.id}
              alarm={alarm}
              featured={idx === 0 && alarm.active}
              onToggle={() => toggleAlarm(alarm.id)}
              onEdit={() => navigation.navigate('CreateAlarm', { alarm })}
              onDelete={() => deleteAlarm(alarm.id)}
              onPress={() => {
                if (alarm.active) {
                  navigation.navigate('ActiveAlarm', { alarm });
                }
              }}
            />
          ))}
        </View>

        <View style={{ height: insets.bottom + 120 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 80 }]}
        onPress={() => navigation.navigate('CreateAlarm')}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[Colors.primary, Colors.primaryContainer]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      <BottomTabBar activeTab="AlarmList" onTabPress={(tab) => {
        if (tab === 'CreateAlarm') navigation.navigate('CreateAlarm');
        if (tab === 'Settings') Alert.alert('Settings', 'Settings page coming soon!');
      }} />
    </View>
  );
}

function AlarmCard({ alarm, featured, onToggle, onEdit, onDelete, onPress }) {
  if (featured) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} onLongPress={onDelete}>
        <LinearGradient
          colors={[Colors.primaryContainer, '#003fb5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.featuredCard}
        >
          <View style={styles.cardTop}>
            <View style={{ flex: 1 }}>
              <View style={styles.cardLabelRow}>
                <Ionicons name="location" size={14} color={Colors.onPrimaryContainer} />
                <Text style={styles.featuredLabel}>{alarm.label || 'Alarm'}</Text>
              </View>
              <Text style={styles.featuredName} numberOfLines={1}>{alarm.address || 'Destination'}</Text>
            </View>
            <Switch
              value={alarm.active}
              onValueChange={onToggle}
              trackColor={{ false: 'rgba(0,0,0,0.2)', true: 'rgba(255,255,255,0.3)' }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.cardBottom}>
            <View>
              <Text style={styles.featuredRadiusLabel}>Geofence Radius</Text>
              <View style={styles.radiusRow}>
                <Ionicons name="disc-outline" size={18} color={Colors.onPrimaryContainer} />
                <Text style={styles.featuredRadius}>{alarm.radius || 500}m</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onEdit} style={styles.editBtnFeatured}>
              <Ionicons name="create-outline" size={18} color={Colors.onPrimaryContainer} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.alarmCard}
      activeOpacity={0.85}
      onPress={onPress}
      onLongPress={onDelete}
    >
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <View style={styles.cardLabelRow}>
            <Ionicons name="location-outline" size={14} color={Colors.primary} />
            <Text style={styles.cardLabel}>{alarm.label || 'Alarm'}</Text>
          </View>
          <Text style={styles.cardName} numberOfLines={1}>{alarm.address || 'Destination'}</Text>
        </View>
        <Switch
          value={alarm.active}
          onValueChange={onToggle}
          trackColor={{ false: Colors.surfaceContainerHighest, true: Colors.primary }}
          thumbColor="#fff"
        />
      </View>
      <View style={styles.cardInfo}>
        <View style={styles.tagRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{alarm.radius || 500}m Radius</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: alarm.active ? Colors.primaryFixed : Colors.surfaceContainerHighest }]}>
            <Text style={[styles.tagText, alarm.active && { color: Colors.primary }]}>
              {alarm.active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onEdit} style={styles.editBtn}>
          <Ionicons name="create-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  appTitle: { fontSize: 20, fontWeight: '800', color: Colors.primary, letterSpacing: -0.3 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.xl },
  editorialHeader: { marginBottom: Spacing.xxl, marginTop: Spacing.lg },
  sectionLabel: { color: Colors.primary, fontWeight: '600', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 },
  pageTitle: { fontSize: 34, fontWeight: '800', color: Colors.onBackground, letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 15, color: Colors.onSurfaceVariant, marginTop: 6 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 18, fontWeight: '700', color: Colors.onSurfaceVariant },
  emptySubtext: { fontSize: 14, color: Colors.outline, textAlign: 'center', paddingHorizontal: 40 },
  alarmList: { gap: Spacing.lg },
  // Featured Card
  featuredCard: { padding: Spacing.xl, borderRadius: BorderRadius.xl, overflow: 'hidden' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  featuredLabel: { color: Colors.onPrimaryContainer, fontWeight: '600', fontSize: 13 },
  featuredName: { fontSize: 22, fontWeight: '700', color: '#ffffff' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: Spacing.xl },
  featuredRadiusLabel: { color: 'rgba(204,216,255,0.8)', fontSize: 11, fontWeight: '500', marginBottom: 4 },
  radiusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featuredRadius: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  editBtnFeatured: { padding: 8 },
  // Normal Card
  alarmCard: {
    backgroundColor: Colors.surfaceContainerLowest, padding: Spacing.xl,
    borderRadius: BorderRadius.xl, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 2,
  },
  cardLabel: { color: Colors.onSurfaceVariant, fontWeight: '600', fontSize: 13 },
  cardName: { fontSize: 20, fontWeight: '700', color: Colors.onSurface },
  cardInfo: { marginTop: Spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tagRow: { flexDirection: 'row', gap: Spacing.sm },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full, backgroundColor: Colors.surfaceContainerHighest },
  tagText: { fontSize: 11, fontWeight: '700', color: Colors.onSurfaceVariant },
  editBtn: { padding: 8 },
  // FAB
  fab: {
    position: 'absolute', right: 24, borderRadius: 32, overflow: 'hidden',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  fabGradient: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', borderRadius: 32 },
});
