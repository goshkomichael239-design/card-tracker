import type { TaskCard } from '../types/card';

const STORAGE_KEY = 'card-tracker.cards.v1';

function isTaskCardArray(value: unknown): value is TaskCard[] {
  return Array.isArray(value);
}

export function loadCards(): TaskCard[] {
  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);

    if (!rawValue) {
      return [];
    }

    const parsedValue: unknown = JSON.parse(rawValue);

    if (!isTaskCardArray(parsedValue)) {
      console.warn('Card Tracker: сохранённые данные имеют неверный формат.');
      return [];
    }

    return parsedValue;
  } catch (error) {
    console.error('Card Tracker: не удалось загрузить карточки.', error);
    return [];
  }
}

export function saveCards(cards: TaskCard[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch (error) {
    console.error('Card Tracker: не удалось сохранить карточки.', error);
  }
}