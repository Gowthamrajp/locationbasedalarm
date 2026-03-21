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
import { startGeofenceMonitoring, stopGeofenceMonitoring, clearTriggeredAlarm } from '../services/GeofenceService';

const STORAGE_KEY = '@vigilant_alarms';

export default function AlarmListScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [alarms, setAlarms] = useState([]);
  const [monitoring, setMonitoring] = useState(false);

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

  // Start/stop monitoring based on active alarms
  const updateMonitoring = async (alarmList) => {
    const hasActive = alarmList.some(a => a.active);
    if (hasActive) {
      const started = await startGeofenceMonitoring();
      setMonitoring(started);
    } else {
      await stopGeofenceMonitoring();
      setMonitoring(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAlarms().then(() => {});
    }, [])
  );

  // When alarms change, update monitoring
  useEffect(() => {
    if (alarms.length > 0) {
      updateMonitoring(alarms);
    }

    // Check if any alarm was triggered in the background
    const checkTriggered = async () => {
      try {
        const triggerData = await AsyncStorage.getItem('@vigilant_current_trigger');
        if (triggerData) {
          const trigger = JSON.parse(triggerData);
          const alarm = alarms.find(a => a.id === trigger.alarmId);
          if (alarm) {
            // Auto-navigate to the active alarm screen
            await AsyncStorage.removeItem('@vigilant_current_trigger');
            navigation.navigate('ActiveAlarm', { alarm });
          }
        }
      } catch (e) {
        console.log('Error checking triggers:', e);
      }
    };

    if (alarms.length > 0) {
      checkTriggered();
    }
  }, [alarms]);

  const toggleAlarm = async (id) => {
    const alarm = alarms.find(a => a.id === id);
    const isEnabling = alarm && !alarm.active;
    const updated = alarms.map(a => a.id === id ? { ...a, active: !a.active } : a);
    setAlarms(updated);
    await saveAlarms(updated);

    // When re-enabling an alarm, clear its triggered state so it can fire again
    if (isEnabling) {
      await clearTriggeredAlarm(id);
    }

    await updateMonitoring(updated);
  };

  const deleteAlarm = (id) => {
    Alert.alert('Delete Alarm', 'Are you sure you want to delete this alarm?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = alarms.filter(a => a.id !== id);
          setAlarms(updated);
          await saveAlarms(updated);
          await updateMonitoring(updated);
        },
      },
    ]);
  };

  const getDisplayRadius = (radiusMeters) => {
    const r = radiusMeters || 500;
    if (r >= 1000) {
      return (r / 1000).toFixed(1).replace(/\.0$/, '') + ' km';
    }
    return r + 'm';
  };

  const activeCount = alarms.filter(a => a.active).length;

  return (
    <View style={styles.container}>
      {/* Top App Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.appTitle}>Vigilant Path</Text>
        <View style={styles.topBarRight}>
          {monitoring && activeCount > 0 && (
            <View style={styles.monitoringBadge}>
              <View style={styles.monitoringDot} />
              <Text style={styles.monitoringText}>Monitoring</Text>
            </View>
          )}
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color={Colors.primary} />
          </View>
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
          {alarms.length === 0 ? (
            <Text style={styles.pageSubtitle}>Tap + to create your first location alarm.</Text>
          ) : (
            <View style={styles.statsRow}>
              <View style={styles.statChip}>
                <Ionicons name="alarm" size={14} color={Colors.primary} />
                <Text style={styles.statText}>{alarms.length} Alarm{alarms.length > 1 ? 's' : ''}</Text>
              </View>
              <View style={[styles.statChip, { backgroundColor: '#dcfce7' }]}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' }} />
                <Text style={[styles.statText, { color: '#15803d' }]}>{activeCount} Active</Text>
              </View>
              {monitoring && (
                <View style={[styles.statChip, { backgroundColor: Colors.primaryFixed }]}>
                  <Ionicons name="radio" size={14} color={Colors.primary} />
                  <Text style={[styles.statText, { color: Colors.primary }]}>Monitoring</Text>
                </View>
              )}
            </View>
          )}
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
          {alarms.map((alarm) => (
            <AlarmCard
              key={alarm.id}
              alarm={alarm}
              displayRadius={getDisplayRadius(alarm.radius)}
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

function AlarmCard({ alarm, displayRadius, onToggle, onEdit, onDelete, onPress }) {
  return (
    <TouchableOpacity
      style={styles.alarmCard}
      activeOpacity={0.85}
      onPress={onPress}
      onLongPress={onDelete}
    >
      {/* Top section: icon + label + switch */}
      <View style={styles.cardTop}>
        <View style={[
          styles.cardIconContainer,
          alarm.active ? styles.cardIconActive : styles.cardIconInactive,
        ]}>
          <Ionicons
            name="location"
            size={20}
            color={alarm.active ? Colors.primary : Colors.outline}
          />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardLabel}>{alarm.label || 'Alarm'}</Text>
          <Text style={styles.cardAddress} numberOfLines={1}>{alarm.address || 'Destination'}</Text>
        </View>
        <Switch
          value={alarm.active}
          onValueChange={onToggle}
          trackColor={{ false: Colors.surfaceContainerHighest, true: Colors.primary }}
          thumbColor="#fff"
        />
      </View>

      {/* Bottom section: tags + edit button */}
      <View style={styles.cardBottom}>
        <View style={styles.tagRow}>
          <View style={styles.tag}>
            <Ionicons name="disc-outline" size={12} color={Colors.onSurfaceVariant} />
            <Text style={styles.tagText}>{displayRadius}</Text>
          </View>
          {alarm.vibrate && (
            <View style={[styles.tag, alarm.active && { backgroundColor: Colors.primaryFixed }]}>
              <Ionicons name="phone-portrait-outline" size={12} color={alarm.active ? Colors.primary : Colors.onSurfaceVariant} />
              <Text style={[styles.tagText, alarm.active && { color: Colors.primary }]}>Vibrate</Text>
            </View>
          )}
          {alarm.sound && (
            <View style={[styles.tag, alarm.active && { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="volume-medium" size={12} color={alarm.active ? '#d97706' : Colors.onSurfaceVariant} />
              <Text style={[styles.tagText, alarm.active && { color: '#92400e' }]}>Sound</Text>
            </View>
          )}
          <View style={[
            styles.statusTag,
            alarm.active ? styles.statusTagActive : styles.statusTagInactive,
          ]}>
            <View style={[
              styles.statusDot,
              { backgroundColor: alarm.active ? '#22c55e' : Colors.outline },
            ]} />
            <Text style={[
              styles.statusTagText,
              alarm.active && styles.statusTagTextActive,
            ]}>
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
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  monitoringBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  monitoringDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
  monitoringText: { fontSize: 10, fontWeight: '700', color: '#15803d' },
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
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md, flexWrap: 'wrap' },
  statChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  statText: { fontSize: 12, fontWeight: '700', color: Colors.onSurfaceVariant },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 18, fontWeight: '700', color: Colors.onSurfaceVariant },
  emptySubtext: { fontSize: 14, color: Colors.outline, textAlign: 'center', paddingHorizontal: 40 },
  alarmList: { gap: Spacing.md },
  alarmCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cardIconContainer: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  cardIconActive: { backgroundColor: Colors.primaryFixed },
  cardIconInactive: { backgroundColor: Colors.surfaceContainerHighest },
  cardContent: { flex: 1 },
  cardLabel: { fontSize: 16, fontWeight: '700', color: Colors.onSurface },
  cardAddress: { fontSize: 13, color: Colors.onSurfaceVariant, fontWeight: '500', marginTop: 2 },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceContainerHigh,
  },
  tagRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', flex: 1 },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: BorderRadius.full, backgroundColor: Colors.surfaceContainerHigh,
  },
  tagText: { fontSize: 11, fontWeight: '600', color: Colors.onSurfaceVariant },
  statusTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.full,
  },
  statusTagActive: { backgroundColor: '#dcfce7' },
  statusTagInactive: { backgroundColor: Colors.surfaceContainerHigh },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusTagText: { fontSize: 11, fontWeight: '700', color: Colors.onSurfaceVariant },
  statusTagTextActive: { color: '#15803d' },
  editBtn: { padding: 8, marginLeft: Spacing.sm },
  fab: {
    position: 'absolute', right: 24, borderRadius: 32, overflow: 'hidden',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  fabGradient: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', borderRadius: 32 },
});
