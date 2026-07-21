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

const CHANNEL_TIP    = 'mbb_daily_tip';
const CHANNEL_PAYDAY = 'mbb_payday';

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

// ── Cancel helpers ─────────────────────────────────────────────────────────────

async function cancelByIdentifier(id: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {}
}

// ── Weekly tip ────────────────────────────────────────────────────────────────
// Fires every Monday — matches the weekly tip rotation in useWeeklyTip(), so
// the reminder always points to genuinely new content, not a repeat of
// what fired yesterday.

export async function scheduleWeeklyTip(hour = 8, minute = 0): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await cancelByIdentifier(CHANNEL_TIP);
    await Notifications.scheduleNotificationAsync({
      identifier: CHANNEL_TIP,
      content: {
        title: '💰 This Week\'s Finance Tip',
        body: 'Your new military finance tip for the week is ready. Tap to read.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 2, // Monday (1 = Sunday)
        hour,
        minute,
      },
    });
  } catch {}
}

export async function cancelWeeklyTip(): Promise<void> {
  if (Platform.OS === 'web') return;
  await cancelByIdentifier(CHANNEL_TIP);
}

// ── Pay day reminders ─────────────────────────────────────────────────────────

/**
 * Returns the adjusted pay day — if the 1st or 15th falls on a weekend, pay
 * moves to the prior Friday.
 */
function adjustedPayDay(year: number, month: number, day: number): Date {
  const d = new Date(year, month, day);
  const dow = d.getDay(); // 0=Sun, 6=Sat
  if (dow === 0) d.setDate(d.getDate() - 2);
  else if (dow === 6) d.setDate(d.getDate() - 1);
  return d;
}

/**
 * Schedules "tomorrow is pay day" reminders for the next 6 months,
 * sent at 18:00 the evening before each pay day.
 * Uses a unique identifier per date so they coexist with the daily tip.
 */
export async function schedulePayDayReminders(netPay?: number): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    // Cancel any previously scheduled pay day notifications
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      if (n.identifier.startsWith(CHANNEL_PAYDAY)) {
        await cancelByIdentifier(n.identifier);
      }
    }

    const today = new Date();
    const payBody = netPay && netPay > 0
      ? `Est. take-home: $${Math.round(netPay).toLocaleString()}. Check your LES in myPay.`
      : 'Check your LES in myPay to confirm your deposit.';

    // Schedule reminders for next 6 months
    for (let m = 0; m < 6; m++) {
      const month = (today.getMonth() + m) % 12;
      const year  = today.getFullYear() + Math.floor((today.getMonth() + m) / 12);

      for (const day of [1, 15]) {
        const payDate = adjustedPayDay(year, month, day);
        // Reminder fires the evening before at 18:00
        const reminderDate = new Date(payDate);
        reminderDate.setDate(payDate.getDate() - 1);
        reminderDate.setHours(18, 0, 0, 0);

        // Skip if the reminder time has already passed
        if (reminderDate <= today) continue;

        const label = day === 1 ? '1st' : '15th';
        const id = `${CHANNEL_PAYDAY}_${year}_${month}_${day}`;

        await Notifications.scheduleNotificationAsync({
          identifier: id,
          content: {
            title: `💵 Pay Day Tomorrow (${label})`,
            body: payBody,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: reminderDate,
          },
        });
      }
    }
  } catch {}
}

export async function cancelPayDayReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      if (n.identifier.startsWith(CHANNEL_PAYDAY)) {
        await cancelByIdentifier(n.identifier);
      }
    }
  } catch {}
}

export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}
