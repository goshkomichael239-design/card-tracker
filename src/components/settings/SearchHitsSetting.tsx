import React from 'react';

import {
  SEARCH_HITS_STYLES,
  setSearchHitsStyle,
  useSearchHitsStyle,
  type SearchHitsStyle,
} from '../../app/searchHitsStyle';
import { t } from '../../app/i18n';

const LABELS: Record<SearchHitsStyle, string> = {
  buttons: t('Кнопками'),
  tabs: t('На язычках'),
};

const HINTS: Record<SearchHitsStyle, string> = {
  buttons: t('Под списком кнопки «Найдено в «Работа» · 2»'),
  tabs: t('На язычках колод числа, у колод без совпадений язычок притушен'),
};

/** Where the search shows what it found in the other decks. */
export const SearchHitsSetting: React.FC<{ style?: React.CSSProperties }> = ({
  style,
}) => {
  const current = useSearchHitsStyle();

  return (
    <div className="lit-in lit-row" style={style}>
      <p className="lit-text text-[19px] font-semibold leading-[1.2]">{t('Найденное в других колодах')}</p>

      <div
        className="lit-seg mt-2"
        role="radiogroup"
        aria-label={t('Найденное в других колодах')}
      >
        {SEARCH_HITS_STYLES.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={current === option}
            onClick={() => setSearchHitsStyle(option)}
            onTouchStart={() => undefined}
            className={`lit-seg__item${current === option ? ' lit-seg__item--on' : ''}`}
          >
            {LABELS[option]}
          </button>
        ))}
      </div>

      <p className="lit-hint mt-2 text-[13px] leading-[1.35]">
        {HINTS[current]}
      </p>
    </div>
  );
};
