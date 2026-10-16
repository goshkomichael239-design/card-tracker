import { EN } from './en';
import { flushNow, readValue, writeValue } from './storage/kv';

/**
 * The language of the interface. The texts in the code are written in Russian
 * and stand as the keys: in Russian they are shown as they are, in English they
 * are looked up in the English dictionary (see \`en.ts\`). \`{name}\` in a text is
 * filled from the second argument.
 *
 * The language is chosen in the settings; until it is chosen, the phone's own
 * language is used (Russian phones get Russian, everything else English). The
 * app starts again after the language is changed, so no text has to follow the
 * change while it is on screen.
 */
export type Language = 'en' | 'ru';

export const LANGUAGES: Language[] = ['en', 'ru'];

const LANGUAGE_KEY = 'card-tracker.language.v1';

const isLanguage = (value: unknown): value is Language =>
  value === 'en' || value === 'ru';

/** The language of the device, as far as the app can tell. */
export const getSystemLanguage = (): Language => {
  try {
    const preferred =
      typeof navigator !== 'undefined'
        ? [...(navigator.languages ?? []), navigator.language]
        : [];

    return preferred.some((tag) => /^ru\b/i.test(tag ?? '')) ? 'ru' : 'en';
  } catch {
    return 'en';
  }
};

export const getLanguage = (): Language => {
  // "?lang=en" shows a language for this visit only (to look at it or test it).
  try {
    const asked = new URLSearchParams(window.location.search).get('lang');

    if (isLanguage(asked)) {
      return asked;
    }
  } catch {
    // No address to read: use what is stored.
  }

  const stored = readValue<string>(LANGUAGE_KEY);

  return isLanguage(stored) ? stored : getSystemLanguage();
};

/** The locale for dates and numbers. */
export const getLocale = (): string =>
  getLanguage() === 'ru' ? 'ru-RU' : 'en-US';

/** Chooses the language and starts the app again to show it. */
export const setLanguage = (language: Language): void => {
  const isSame = language === getLanguage();

  writeValue(LANGUAGE_KEY, language);

  if (isSame) {
    return;
  }

  void flushNow().then(() => window.location.reload());
};

type Params = Record<string, string | number>;

const fill = (text: string, params?: Params): string =>
  params
    ? text.replace(/\{(\w+)\}/g, (match, name: string) =>
        name in params ? String(params[name]) : match,
      )
    : text;

/** A text of the interface in the language that is on. */
export const t = (source: string, params?: Params): string => {
  if (getLanguage() === 'ru') {
    return fill(source, params);
  }

  return fill(EN[source] ?? source, params);
};
