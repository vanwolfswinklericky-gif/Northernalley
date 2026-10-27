// src/lib/notifications.ts

import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://northernalley.vercel.app';

// Configure how notifications appear when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(
  privyUserId: string
): Promise<string | null> {
  // Physical device required — simulators cannot receive push notifications
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  // Android requires a notification channel before requesting permission
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366F1',
    });
  }

  // Request permission
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission denied');
    return null;
  }

  // Get the EAS project ID — required for Expo Push
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    console.warn('Missing EAS projectId — cannot register for push');
    return null;
  }

  // Get the Expo push token
  let token: string;
  try {
    const result = await Notifications.getExpoPushTokenAsync({ projectId });
    token = result.data;
  } catch (error: any) {
    console.warn('Failed to get push token:', error.message);
    return null;
  }

  // Save the token to the backend
  try {
    const response = await fetch(`${API_URL}/api/register-push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ privyUserId, pushToken: token }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.warn('Failed to save push token:', error);
      return null;
    }

    console.log('Push token registered successfully');
    return token;
  } catch (error: any) {
    console.warn('Network error saving push token:', error.message);
    return null;
  }
}