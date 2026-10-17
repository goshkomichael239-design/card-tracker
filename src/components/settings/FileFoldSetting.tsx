import React from 'react';

import {
  FILE_FOLD_MODES,
  setFileFoldMode,
  useFileFoldMode,
  type FileFoldMode,
} from '../../app/fileFold';
import { t } from '../../app/i18n';

const LABELS: Record<FileFoldMode, string> = {
  auto: t('Сама'),
  never: t('Никогда'),
};

const HINTS: Record<FileFoldMode, string> = {
  auto: t('Пока вы правите или листаете карточки, картотека задвигается в ящик; нажмите на неё или потяните вниз, чтобы выдвинуть'),
  never: t('Картотека всегда выдвинута'),
};

/** Whether the card file at the top pushes itself back into its box. */
export const FileFoldSetting: React.FC<{ style?: React.CSSProperties }> = ({
  style,
}) => {
  const current = useFileFoldMode();

  return (
    <div className="lit-in lit-row" style={style}>
      <p className="lit-text text-[19px] font-semibold leading-[1.2]">{t('Картотека задвигается')}</p>

      <div
        className="lit-seg mt-2"
        role="radiogroup"
        aria-label={t('Картотека задвигается')}
      >
        {FILE_FOLD_MODES.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={current === option}
            onClick={() => setFileFoldMode(option)}
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
