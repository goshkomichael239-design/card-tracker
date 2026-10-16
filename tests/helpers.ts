import { vi } from 'vitest';

import type { VisualCard } from '../src/app/cardTheme';

/** The interface language for a test (the app reads "?lang=" from the address). */
export const setLang = (language: 'en' | 'ru'): void => {
  vi.stubGlobal('window', { location: { search: `?lang=${language}` } });
};

/** A plain card, with whatever the test needs changed. */
export const makeCard = (changes: Partial<VisualCard> = {}): VisualCard => ({
  id: 'card-1',
  title: 'Test card',
  kind: 'single',
  timeMode: 'none',
  createdAt: '2026-01-01T00:00:00.000Z',
  ...changes,
});

/** A local date (months from 1, as people write them). */
export const at = (
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
): Date => new Date(year, month - 1, day, hour, minute, 0, 0);
