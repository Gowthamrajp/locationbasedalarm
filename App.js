import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

// Import GeofenceService to register the background task at module level
import { setupNotifications, startGeofenceMonitoring } from './src/services/GeofenceService';
import { checkForUpdates, showForceUpdateAlert, showOptionalUpdateAlert } from './src/services/UpdateService';

import OnboardingScreen from './src/screens/OnboardingScreen';
import AlarmListScreen from './src/screens/AlarmListScreen';
import CreateAlarmScreen from './src/screens/CreateAlarmScreen';
import ActiveAlarmScreen from './src/screens/ActiveAlarmScreen';

const Stack = createNativeStackNavigator();
const ONBOARDING_KEY = '@vigilant_onboarding_done';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const navigationRef = useRef(null);
  const notificationListener = useRef(null);
  const responseListener = useRef(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then(value => {
      const onboarded = value === 'true';
      setHasOnboarded(onboarded);
      setIsLoading(false);

      // Only setup services if user has already completed onboarding
      // This prevents permission prompts before the onboarding screen
      if (onboarded) {
        setupNotifications().catch(() => {});
        startGeofenceMonitoring().catch(() => {});
      }
    }).catch(() => setIsLoading(false));

    // Check for app updates
    checkForUpdates().then(config => {
      if (config) {
        if (config.needsForceUpdate) {
          showForceUpdateAlert(config);
        } else if (config.isUpdateAvailable) {
          showOptionalUpdateAlert(config);
        }
      }
    });

    // Listen for notification taps - navigate to ActiveAlarm
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.alarm && navigationRef.current) {
        navigationRef.current.navigate('ActiveAlarm', { alarm: data.alarm });
      }
    });

    // Listen for incoming notifications while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(async notification => {
      const data = notification.request.content.data;
      if (data?.alarm && navigationRef.current) {
        // Auto-navigate to alarm screen when triggered in foreground
        navigationRef.current.navigate('ActiveAlarm', { alarm: data.alarm });
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  if (isLoading) return null;

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <StatusBar style="dark" />
        <Stack.Navigator
          initialRouteName={hasOnboarded ? 'AlarmList' : 'Onboarding'}
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: '#faf8ff' },
          }}
        >
          <Stack.Screen name="Onboarding">
            {(props) => (
              <OnboardingScreen
                {...props}
                onComplete={async () => {
                  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
                  props.navigation.replace('AlarmList');
                }}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="AlarmList" component={AlarmListScreen} />
          <Stack.Screen
            name="CreateAlarm"
            component={CreateAlarmScreen}
            options={{ animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="ActiveAlarm"
            component={ActiveAlarmScreen}
            options={{ animation: 'fade', presentation: 'fullScreenModal' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
