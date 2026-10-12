import { useSyncExternalStore } from 'react';

import { isHapticsEnabled, setHapticsEnabled } from './haptics';
import { readValue, writeValue } from './storage/kv';

export type SettingId =
  | 'haptics'
  | 'sounds'
  | 'hints'
  | 'lamp'
  | 'overdueCounter';

export interface SettingDefinition {
  id: SettingId;
  label: string;
  hint: string;
  defaultValue: boolean;
}

export const SETTINGS: SettingDefinition[] = [
  {
    id: 'haptics',
    label: 'Вибрация',
    hint: 'Лёгкий отклик при листании, закреплении и отрыве купона',
    defaultValue: true,
  },
  {
    id: 'sounds',
    label: 'Звуки',
    hint: 'Шорох карточек, треск перфорации, штамп',
    defaultValue: true,
  },
  {
    id: 'hints',
    label: 'Подсказки',
    hint: 'Стрелка у загнутого уголка и подсказка про свайп',
    defaultValue: true,
  },
  {
    id: 'lamp',
    label: 'Свет лампы',
    hint: 'Светлое пятно на сукне, как под настольной лампой',
    defaultValue: true,
  },
  {
    id: 'overdueCounter',
    label: 'Метки просроченного',
    hint: 'Красные флажки на язычках колод, на строках и на карточке',
    defaultValue: true,
  },
];

const SETTINGS_KEY = 'card-tracker.settings.v1';

type StoredSettings = Partial<Record<SettingId, boolean>>;

const listeners = new Set<() => void>();
// A new object on every change, so the hook sees it as a new snapshot.
let snapshot: Record<SettingId, boolean> | null = null;

const buildSnapshot = (): Record<SettingId, boolean> => {
  const stored = readValue<StoredSettings>(SETTINGS_KEY) ?? {};
  const result = {} as Record<SettingId, boolean>;

  for (const setting of SETTINGS) {
    result[setting.id] =
      setting.id === 'haptics'
        ? isHapticsEnabled()
        : (stored[setting.id] ?? setting.defaultValue);
  }

  return result;
};

const getSnapshot = () => (snapshot ??= buildSnapshot());

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const setSetting = (id: SettingId, value: boolean): void => {
  if (id === 'haptics') {
    setHapticsEnabled(value);
  } else {
    const stored = readValue<StoredSettings>(SETTINGS_KEY) ?? {};
    writeValue(SETTINGS_KEY, { ...stored, [id]: value });
  }

  snapshot = null;
  listeners.forEach((listener) => listener());
};

/** The settings as {id: on/off}, and a way to flip one. */
export const useSettings = () => {
  const values = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { values, set: setSetting };
};
