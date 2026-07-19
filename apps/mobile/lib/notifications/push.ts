import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { apiFetch } from '../api/client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Registers the device for Expo push notifications and stores the token on the
 * backend via the existing notification API. No new backend logic is created —
 * the device token is persisted through the shared REST endpoint.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4F46E5',
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== 'granted') {
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  const tokenResponse = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );
  const token = tokenResponse.data;

  await syncDeviceToken(token);
  return token;
}

/**
 * Persists the device token through the existing notifications backend.
 * Failures are swallowed so a token-registration hiccup never blocks the app.
 */
export async function syncDeviceToken(token: string): Promise<void> {
  try {
    await apiFetch('/notifications/devices', {
      method: 'POST',
      body: {
        token,
        platform: Platform.OS,
        provider: 'EXPO',
      },
    });
  } catch {
    // Non-fatal: backend may reject duplicates or be temporarily unavailable.
  }
}

export function addNotificationListeners(handlers: {
  onReceive?: (notification: Notifications.Notification) => void;
  onRespond?: (response: Notifications.NotificationResponse) => void;
}): () => void {
  const receiveSub = handlers.onReceive
    ? Notifications.addNotificationReceivedListener(handlers.onReceive)
    : null;
  const respondSub = handlers.onRespond
    ? Notifications.addNotificationResponseReceivedListener(handlers.onRespond)
    : null;
  return () => {
    receiveSub?.remove();
    respondSub?.remove();
  };
}
