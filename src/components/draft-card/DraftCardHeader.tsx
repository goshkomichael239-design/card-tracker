import React from 'react';

import type { CardKind, CardPalette } from '../../app/cardTheme';
import { t } from '../../app/i18n';

interface DraftCardHeaderProps {
  palette: CardPalette;
  selectedKind: CardKind | null;
}

const KIND_LABEL: Record<CardKind, string> = {
  single: t('Одна задача'),
  series: t('Серия'),
  list: t('Список'),
};

/**
 * The same kind chip as on a finished card, in the colour the card will have.
 * Until the kind is chosen it just says what this is.
 */
export const DraftCardHeader: React.FC<DraftCardHeaderProps> = ({
  palette,
  selectedKind,
}) => (
  <div className="flex shrink-0 items-center">
    <span
      className="rounded-full px-3 py-1.5 font-mono text-[11.5px] font-bold uppercase tracking-[0.12em]"
      style={{
        color: palette.accentDark,
        backgroundColor: `${palette.accent}1d`,
      }}
    >
      {selectedKind ? KIND_LABEL[selectedKind] : t('Новая карта')}
    </span>
  </div>
);
