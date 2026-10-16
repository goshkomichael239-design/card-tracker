import React from 'react';

import {
  LANGUAGES,
  getLanguage,
  setLanguage,
  t,
  type Language,
} from '../../app/i18n';

// Each language is named in itself: it must be readable whatever is on now.
const NAMES: Record<Language, string> = {
  en: 'English',
  ru: 'Русский',
};

/** The language of the interface; changing it restarts the app. */
export const LanguageSetting: React.FC<{ style?: React.CSSProperties }> = ({
  style,
}) => {
  const current = getLanguage();

  return (
    <div className="lit-in lit-row" style={style}>
      <p className="lit-text text-[19px] font-semibold leading-[1.2]">
        {t('Язык')}
      </p>

      <div
        className="lit-seg mt-2"
        role="radiogroup"
        aria-label="Language"
      >
        {LANGUAGES.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={current === option}
            onClick={() => setLanguage(option)}
            onTouchStart={() => undefined}
            lang={option}
            className={`lit-seg__item${current === option ? ' lit-seg__item--on' : ''}`}
          >
            {NAMES[option]}
          </button>
        ))}
      </div>

      <p className="lit-hint mt-2 text-[13px] leading-[1.35]">
        {t('Меняется сразу, приложение перезапустится')}
      </p>
    </div>
  );
};
