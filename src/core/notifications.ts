import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';
import { parseDay } from './dates';
import type { Deliverable, DeliverableStep, Settings } from './types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldPlaySound: false, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
});

/** Reprograma el recordatorio diario. Devuelve false si el usuario negó el permiso. */
export async function applyReminder(r: Settings['reminder']): Promise<boolean> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const oldDailyReminders = scheduled.filter((item) => item.content.data?.kind === 'daily-reminder' || item.content.title === 'Tu diario');
  await Promise.all(oldDailyReminders.map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)));
  if (!r.enabled) return true;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('recordatorio', { name: 'Recordatorio diario', importance: AndroidImportance.DEFAULT });
  }
  const perm = await Notifications.requestPermissionsAsync();
  if (!perm.granted) return false;
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Tu diario', body: '¿Cómo te sientes? Registra un momento o cierra tu día.', data: { kind: 'daily-reminder' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: r.hour, minute: r.minute, channelId: 'recordatorio' },
  });
  return true;
}

async function notificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('entregas', { name: 'Pasos del plan', importance: AndroidImportance.DEFAULT });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

function reminderDate(deliverable: Deliverable, step: DeliverableStep): Date {
  const date = parseDay(step.dueDate);
  date.setHours(deliverable.reminderHour, 0, 0, 0);
  return date;
}

export async function scheduleDeliverableReminders(deliverable: Deliverable): Promise<{ deliverable: Deliverable; granted: boolean }> {
  if (!deliverable.remindersEnabled) return { deliverable, granted: true };
  const needsReminder = deliverable.steps.some((step) => !step.completedAt && !step.notificationId && reminderDate(deliverable, step).getTime() > Date.now());
  if (!needsReminder) return { deliverable, granted: true };
  const granted = await notificationPermission();
  if (!granted) return { deliverable, granted: false };

  const results = await Promise.all(deliverable.steps.map(async (step) => {
    const date = reminderDate(deliverable, step);
    if (step.completedAt || step.notificationId || date.getTime() <= Date.now()) return { step, success: true };
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Un paso para ${deliverable.title}`,
          body: step.title,
          data: { kind: 'deliverable-step', url: `/entrega/${deliverable.id}` },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: 'entregas' },
      });
      return { step: { ...step, notificationId }, success: true };
    } catch {
      return { step, success: false };
    }
  }));
  return { deliverable: { ...deliverable, steps: results.map((result) => result.step) }, granted: results.every((result) => result.success) };
}

export async function cancelDeliverableReminders(deliverable: Deliverable): Promise<void> {
  await Promise.allSettled(deliverable.steps.filter((step) => step.notificationId).map((step) =>
    Notifications.cancelScheduledNotificationAsync(step.notificationId as string),
  ));
}

export async function cancelStepReminder(notificationId: string): Promise<void> {
  try { await Notifications.cancelScheduledNotificationAsync(notificationId); } catch {}
}
