import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius } from '../constants/theme';

const tabs = [
  { key: 'AlarmList', label: 'Alarms', icon: 'alarm-outline', iconFilled: 'alarm' },
  { key: 'CreateAlarm', label: 'Explore', icon: 'map-outline', iconFilled: 'map' },
  { key: 'Settings', label: 'Settings', icon: 'settings-outline', iconFilled: 'settings' },
];

export default function BottomTabBar({ activeTab, onTabPress }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.inner}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onTabPress(tab.key)}
              style={[styles.tab, isActive && styles.activeTab]}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isActive ? tab.iconFilled : tab.icon}
                size={22}
                color={isActive ? Colors.primary : Colors.outline}
              />
              <Text style={[styles.label, isActive && styles.activeLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(250, 248, 255, 0.95)',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 10,
  },
  inner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  activeTab: {
    backgroundColor: Colors.primaryFixed,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.outline,
    marginTop: 2,
  },
  activeLabel: {
    color: Colors.primary,
  },
});
