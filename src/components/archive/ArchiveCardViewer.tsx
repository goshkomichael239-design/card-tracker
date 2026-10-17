import React, { useEffect, useState } from 'react';

import { getCardPalette, type VisualCard } from '../../app/cardTheme';
import { formatHumanDate } from '../../app/dateTimeUtils';
import { getCardScale, useViewportSize } from '../../app/viewportScale';
import { TaskCard } from '../task-card/TaskCard';
import { INITIAL_TASK_CARD_V2_CONFIG } from '../task-card/taskCardV2Config';
import { ListItemsSheet } from './ListItemsSheet';
import { ARCHIVE_NAVIGATION_HEIGHT } from './ArchiveNavigation';
import { SeriesHistorySheet } from './SeriesHistorySheet';
import { t } from '../../app/i18n';

interface ArchiveCardViewerProps {
  card: VisualCard;
  /** False while the card's completion is still settling on the table. */
  canReturn: boolean;
  onReturn: () => void;
  onTrash: () => void;
  onClose: () => void;
}

const CONFIRM_TIMEOUT_MS = 3_500;

/**
 * A card pulled out of the catalogue: shown whole, with what can be done with
 * it — put it back on the table or throw it in the bin (second press).
 */
export const ArchiveCardViewer: React.FC<ArchiveCardViewerProps> = ({
  card,
  canReturn,
  onReturn,
  onTrash,
  onClose,
}) => {
  const palette = getCardPalette(card);
  const { width: viewportWidth, height: viewportHeight } = useViewportSize();
  const { width, height } = INITIAL_TASK_CARD_V2_CONFIG;
  const scale = getCardScale(
    viewportWidth - 40,
    // The card, its date line and the buttons all stand above the archive bar.
    viewportHeight - 210 - ARCHIVE_NAVIGATION_HEIGHT,
    width,
    height,
  );
  const [isConfirmingTrash, setIsConfirmingTrash] = useState(false);
  // A series can be turned over to read the log of its steps, a list to read
  // every item (the face only fits the first few).
  const [isShowingHistory, setIsShowingHistory] = useState(false);
  const isList = card.kind === 'list' && Boolean(card.list);
  const hasHistory = (card.kind === 'series' && Boolean(card.series)) || isList;
  const historyLabel = isList ? t('Все пункты') : t('История шагов');

  useEffect(() => {
    if (!isConfirmingTrash) {
      return;
    }

    const timer = window.setTimeout(
      () => setIsConfirmingTrash(false),
      CONFIRM_TIMEOUT_MS,
    );
    return () => window.clearTimeout(timer);
  }, [isConfirmingTrash]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      // text-left: the archive page centres its text, the card must not inherit it.
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 px-4 text-left"
      style={{
        backgroundColor: 'rgba(48,38,26,0.28)',
        paddingBottom: ARCHIVE_NAVIGATION_HEIGHT,
      }}
      role="dialog"
      aria-modal="true"
      aria-label={card.title}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={t('Поставить обратно')}
        className="absolute left-4 top-4 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border text-[26px] font-light leading-none"
        style={{
          color: '#4a3c2c',
          borderColor: 'rgba(74,60,44,0.3)',
          backgroundColor: 'rgba(247,242,232,0.85)',
        }}
      >
        ×
      </button>

      {/* The card, pulled up out of the box. */}
      <div
        key={isShowingHistory ? 'history' : 'card'}
        className="archive-pull-out relative shrink-0"
        style={{ width: width * scale, height: height * scale }}
      >
        <div
          className={`absolute left-0 top-0${isShowingHistory ? '' : ' pointer-events-none'}`}
          style={{
            width,
            height,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {isShowingHistory ? (
            isList ? (
              <ListItemsSheet card={card} />
            ) : (
              <SeriesHistorySheet card={card} />
            )
          ) : (
            <TaskCard card={card} onComplete={() => undefined} isStatic />
          )}
        </div>
      </div>

      <p
        className="-mt-2 text-center text-[11px] uppercase tracking-[0.12em]"
        style={{ color: 'rgba(250,244,226,0.7)' }}
      >{t('Создана · {v}', { v: formatHumanDate(card.createdAt) })}</p>

      <div className="engraved flex flex-wrap items-center justify-center gap-3">
        {hasHistory && (
          <button
            type="button"
            onClick={() => setIsShowingHistory((previous) => !previous)}
            onTouchStart={() => undefined}
            className="pill-action"
            style={
              {
                ['--pill-bg' as string]: 'rgba(247,242,232,0.9)',
                ['--pill-ink' as string]: palette.accentDark,
                ['--pill-glow' as string]: palette.glow,
              } as React.CSSProperties
            }
          >
            {isShowingHistory ? t('Карточка') : historyLabel}
          </button>
        )}
        <button
          type="button"
          disabled={!canReturn}
          onClick={onReturn}
          onTouchStart={() => undefined}
          className="pill-action disabled:cursor-default disabled:opacity-50"
          style={
            {
              ['--pill-bg' as string]: palette.paper,
              ['--pill-ink' as string]: palette.accentDark,
              ['--pill-glow' as string]: palette.glow,
            } as React.CSSProperties
          }
        >{t('Вернуть на стол')}</button>
        <button
          type="button"
          onClick={() => {
            if (isConfirmingTrash) {
              onTrash();
              return;
            }

            setIsConfirmingTrash(true);
          }}
          onTouchStart={() => undefined}
          className="pill-action"
          style={
            {
              ['--pill-bg' as string]: isConfirmingTrash
                ? 'rgba(255,179,163,0.9)'
                : 'rgba(247,242,232,0.9)',
              ['--pill-ink' as string]: isConfirmingTrash ? '#7a2519' : '#5f554a',
              ['--pill-glow' as string]: '#FFC2A6',
            } as React.CSSProperties
          }
        >
          {isConfirmingTrash ? t('Точно в корзину?') : t('В корзину')}
        </button>
      </div>
    </div>
  );
};
