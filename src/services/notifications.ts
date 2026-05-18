import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const existing = await Notifications.getPermissionsAsync();
    if ((existing as any).granted ?? (existing as any).status === 'granted') return true;
    const result = await Notifications.requestPermissionsAsync();
    return (result as any).granted ?? (result as any).status === 'granted';
  } catch {
    return false;
  }
}

export async function scheduleDailyTip(hour = 8, minute = 0): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💰 Daily Finance Tip',
        body: "Your military finance tip for today is ready. Tap to read.",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  } catch {
    // Notifications may not be supported in all environments
  }
}

export async function cancelDailyTip(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}
