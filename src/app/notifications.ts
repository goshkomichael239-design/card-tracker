import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

import type { VisualCard } from './cardTheme';
import { getCardTargetAt } from './timeOps';
import { t } from './i18n';

/**
 * Reminders as notifications of the phone. They exist only inside the Android
 * app (the Capacitor shell): the phone itself wakes up at the time, the app
 * need not be open. Every start, and every change of the cards, the pending
 * ones are cancelled and made again from the cards, so they always follow the
 * deck (a card put off, done, deleted or repeated has its own time).
 */

const HOUR_MS = 60 * 60 * 1000;
// A phone keeps only so many alarms: the nearest ones are enough.
const MAX_SCHEDULED = 60;

export const isNotificationsAvailable = (): boolean => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

/** Asks the person (once the system allows it) and says whether we may notify. */
export const ensureNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationsAvailable()) {
    return false;
  }

  try {
    const current = await LocalNotifications.checkPermissions();

    if (current.display === 'granted') {
      return true;
    }

    const asked = await LocalNotifications.requestPermissions();

    return asked.display === 'granted';
  } catch {
    return false;
  }
};

/** A stable whole number for a card (the phone wants numeric ids). */
const numericId = (text: string): number => {
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) % 2_000_000_000;
};

interface Planned {
  id: number;
  title: string;
  body: string;
  at: Date;
}

/** What should be on the phone's alarm clock for these cards. */
export const planReminders = (
  cards: VisualCard[],
  now: number = Date.now(),
): Planned[] => {
  const planned: Planned[] = [];

  for (const card of cards) {
    if (card.completedAt || card.timeMode === 'none') {
      continue;
    }

    const target = getCardTargetAt(card);
    const time = target ? new Date(target).getTime() : NaN;

    if (!Number.isFinite(time)) {
      continue;
    }

    const title = card.title || t('Карточка');

    if (card.timeMode === 'deadline') {
      // An hour before, and at the deadline itself.
      if (time - HOUR_MS > now) {
        planned.push({
          id: numericId(`${card.id}:pre`),
          title,
          body: t('Срок через час'),
          at: new Date(time - HOUR_MS),
        });
      }

      if (time > now) {
        planned.push({
          id: numericId(`${card.id}:due`),
          title,
          body: t('Срок вышел'),
          at: new Date(time),
        });
      }
    } else if (time > now) {
      planned.push({
        id: numericId(`${card.id}:rem`),
        title,
        body: t('Напоминание'),
        at: new Date(time),
      });
    }
  }

  return planned.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, MAX_SCHEDULED);
};

/** Makes the phone's pending notifications match the cards (or none at all). */
export const syncReminders = async (
  cards: VisualCard[],
  isEnabled: boolean,
): Promise<void> => {
  if (!isNotificationsAvailable()) {
    return;
  }

  try {
    const pending = await LocalNotifications.getPending();

    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }

    if (!isEnabled || !(await ensureNotificationPermission())) {
      return;
    }

    const planned = planReminders(cards);

    if (planned.length === 0) {
      return;
    }

    await LocalNotifications.schedule({
      notifications: planned.map((item) => ({
        id: item.id,
        title: item.title,
        body: item.body,
        schedule: { at: item.at, allowWhileIdle: true },
      })),
    });
  } catch {
    // Notifications are a help; a failure must never break the app.
  }
};
