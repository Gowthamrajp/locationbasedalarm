import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Spacing } from '../constants/theme';
import BottomTabBar from '../components/BottomTabBar';

const ALARMS = [
  {
    id: '1',
    label: 'Work',
    name: 'Central Office',
    radius: '500m',
    active: true,
    icon: 'briefcase',
    featured: true,
  },
  {
    id: '2',
    label: 'Gym',
    name: 'Iron Temple Fitness',
    radius: '200m',
    alert: 'Vibration',
    active: false,
    icon: 'barbell-outline',
    featured: false,
  },
  {
    id: '3',
    label: 'Home',
    name: 'Sweet Sanctuary',
    radius: '1.2km',
    tags: ['Smart Arrival'],
    active: true,
    icon: 'home',
    featured: false,
  },
];

const RECENT = [
  { id: '1', name: 'Blue Bottle', distance: '450m away', icon: 'cafe-outline', color: Colors.secondaryFixed },
  { id: '2', name: 'Whole Foods', distance: '1.2km away', icon: 'bag-outline', color: Colors.tertiaryFixed },
  { id: '3', name: 'Grand Central', distance: '2.8km away', icon: 'train-outline', color: Colors.primaryFixed },
];

export default function AlarmListScreen({ navigation }) {
  const [alarms, setAlarms] = useState(ALARMS);

  const toggleAlarm = (id) => {
    setAlarms(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };

  return (
    <View style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="menu" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.appTitle}>Vigilant Path</Text>
        <View style={styles.avatar}>
          <Ionicons name="person" size={20} color={Colors.primary} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Editorial Header */}
        <View style={styles.editorialHeader}>
          <Text style={styles.sectionLabel}>Active Monitor</Text>
          <Text style={styles.pageTitle}>Your Alarms</Text>
          <Text style={styles.pageSubtitle}>Safely navigating your daily commutes.</Text>
        </View>

        {/* Alarm Cards */}
        <View style={styles.alarmList}>
          {alarms.map((alarm) => (
            alarm.featured ? (
              <FeaturedAlarmCard key={alarm.id} alarm={alarm} onToggle={toggleAlarm} onPress={() => navigation.navigate('ActiveAlarm')} />
            ) : (
              <AlarmCard key={alarm.id} alarm={alarm} onToggle={toggleAlarm} onEdit={() => navigation.navigate('CreateAlarm')} />
            )
          ))}
        </View>

        {/* Recent Destinations */}
        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>Recent Destinations</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentList}>
            {RECENT.map((item) => (
              <TouchableOpacity key={item.id} style={styles.recentCard}>
                <View style={[styles.recentIcon, { backgroundColor: item.color }]}>
                  <Ionicons name={item.icon} size={20} color={Colors.onSurface} />
                </View>
                <Text style={styles.recentName}>{item.name}</Text>
                <Text style={styles.recentDistance}>{item.distance}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Bottom spacing for nav */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
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

      {/* Bottom Tab Bar */}
      <BottomTabBar activeTab="AlarmList" onTabPress={(tab) => {
        if (tab === 'CreateAlarm') navigation.navigate('CreateAlarm');
      }} />
    </View>
  );
}

function FeaturedAlarmCard({ alarm, onToggle, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <LinearGradient
        colors={[Colors.primaryContainer, '#003fb5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.featuredCard}
      >
        {/* Background watermark */}
        <View style={styles.watermark}>
          <Ionicons name="briefcase" size={80} color="rgba(255,255,255,0.08)" />
        </View>

        <View style={styles.cardTop}>
          <View>
            <View style={styles.cardLabelRow}>
              <Ionicons name="location" size={14} color={Colors.onPrimaryContainer} />
              <Text style={styles.featuredLabel}>{alarm.label}</Text>
            </View>
            <Text style={styles.featuredName}>{alarm.name}</Text>
          </View>
          <Switch
            value={alarm.active}
            onValueChange={() => onToggle(alarm.id)}
            trackColor={{ false: 'rgba(0,0,0,0.2)', true: 'rgba(255,255,255,0.3)' }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.cardBottom}>
          <View>
            <Text style={styles.featuredRadiusLabel}>Geofence Radius</Text>
            <View style={styles.radiusRow}>
              <Ionicons name="disc-outline" size={20} color={Colors.onPrimaryContainer} />
              <Text style={styles.featuredRadius}>{alarm.radius}</Text>
            </View>
          </View>
          <View style={styles.commuteIcon}>
            <Ionicons name="car-outline" size={16} color={Colors.onSurface} />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function AlarmCard({ alarm, onToggle, onEdit }) {
  const isHome = alarm.label === 'Home';
  return (
    <View style={[styles.alarmCard, isHome && styles.alarmCardTonal]}>
      <View style={styles.cardTop}>
        <View>
          <View style={styles.cardLabelRow}>
            <Ionicons
              name={isHome ? 'home' : 'location-outline'}
              size={14}
              color={isHome ? Colors.tertiary : Colors.primary}
            />
            <Text style={styles.cardLabel}>{alarm.label}</Text>
          </View>
          <Text style={styles.cardName}>{alarm.name}</Text>
        </View>
        <Switch
          value={alarm.active}
          onValueChange={() => onToggle(alarm.id)}
          trackColor={{ false: Colors.surfaceContainerHighest, true: Colors.primary }}
          thumbColor="#fff"
        />
      </View>

      <View style={styles.cardInfo}>
        {alarm.alert ? (
          <View style={styles.infoRow}>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Radius</Text>
              <Text style={styles.infoValue}>{alarm.radius}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Alert</Text>
              <Text style={[styles.infoValue, { color: Colors.secondary }]}>{alarm.alert}</Text>
            </View>
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={onEdit} style={styles.editBtn}>
              <Ionicons name="create-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.tagRow}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{alarm.radius} Radius</Text>
            </View>
            {alarm.tags?.map((t, i) => (
              <View key={i} style={[styles.tag, { backgroundColor: Colors.tertiaryFixed }]}>
                <Text style={[styles.tagText, { color: Colors.onTertiaryFixed }]}>{t}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: 56,
    paddingBottom: Spacing.md,
    backgroundColor: 'rgba(250, 248, 255, 0.7)',
  },
  iconBtn: {
    padding: 8,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.3,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primaryFixed,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  editorialHeader: {
    marginBottom: Spacing.xxl,
    marginTop: Spacing.lg,
  },
  sectionLabel: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.onBackground,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 17,
    color: Colors.onSurfaceVariant,
    marginTop: 6,
  },
  alarmList: {
    gap: Spacing.lg,
  },
  // Featured Card
  featuredCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  watermark: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 16,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  featuredLabel: {
    color: Colors.onPrimaryContainer,
    fontWeight: '600',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  featuredName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: Spacing.xxl,
  },
  featuredRadiusLabel: {
    color: 'rgba(204, 216, 255, 0.8)',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featuredRadius: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  commuteIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primaryContainer,
  },
  // Normal Card
  alarmCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 2,
  },
  alarmCardTonal: {
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 214, 0.1)',
  },
  cardLabel: {
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  cardName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  cardInfo: {
    marginTop: Spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  infoBlock: {
    gap: 2,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: Colors.onSurfaceVariant,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  divider: {
    height: 32,
    width: 1,
    backgroundColor: 'rgba(195, 198, 214, 0.3)',
  },
  editBtn: {
    padding: 8,
  },
  tagRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerHighest,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  // Recent
  recentSection: {
    marginTop: Spacing.xxxl,
  },
  recentTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.lg,
    paddingHorizontal: 4,
    color: Colors.onBackground,
  },
  recentList: {
    gap: Spacing.lg,
    paddingRight: Spacing.xl,
  },
  recentCard: {
    width: 140,
    backgroundColor: '#fff',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  recentName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  recentDistance: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  // FAB
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  fabGradient: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
  },
});
