import React, { useMemo, useState } from 'react';

import cardboardTexture from '../../assets/cardboard.avif';
import {
  filterArchive,
  formatArchiveDay,
  groupArchiveByMonth,
  pluralCards,
  type ArchiveKindFilter,
} from '../../app/archiveUtils';
import { getCardPalette, type VisualCard } from '../../app/cardTheme';
import { getSeriesProgress } from '../../app/seriesUtils';

interface ArchiveCatalogProps {
  cards: VisualCard[];
  onOpenCard: (cardId: string) => void;
}

const KIND_FILTERS: Array<{ id: ArchiveKindFilter; label: string }> = [
  { id: 'all', label: 'Все' },
  { id: 'single', label: 'Задачи' },
  { id: 'series', label: 'Серии' },
  { id: 'list', label: 'Списки' },
];

const KRAFT = '#D2BE97';

const kindLabel = (card: VisualCard): string =>
  card.kind === 'series' ? 'Серия' : card.kind === 'list' ? 'Список' : 'Задача';

const anchorId = (monthKey: string) => `archive-month-${monthKey}`;

/**
 * The stub left of a torn-off coupon, in miniature: filled with the card's
 * accent as far as the work got (series), fully for everything else.
 */
const CouponStub: React.FC<{ card: VisualCard }> = ({ card }) => {
  const palette = getCardPalette(card);
  const share = card.series ? getSeriesProgress(card.series) : 1;
  const label = card.series
    ? `${card.series.entries.length}/${card.series.targetCount}`
    : card.list
      ? `${card.list.items.length}/${card.list.items.length}`
      : '✓';

  return (
    <span
      className="relative flex h-[22px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-[5px]"
      style={{
        backgroundColor: palette.paper,
        boxShadow:
          'inset 2px 2px 4px rgba(30,20,10,0.4), inset -1px -1px 2px rgba(255,255,255,0.5)',
        outline: '1px dashed rgba(40,30,20,0.35)',
        outlineOffset: -3,
      }}
      aria-hidden="true"
    >
      <span
        className="absolute bottom-0 left-0 top-0"
        style={{ width: `${share * 100}%`, backgroundColor: palette.glow }}
      />
      <span
        className="relative font-mono text-[11px] font-bold tabular-nums"
        style={{ color: palette.ink }}
      >
        {label}
      </span>
    </span>
  );
};

/** The top edge of a card standing in the catalogue. */
const CardEdge: React.FC<{ card: VisualCard; onOpen: () => void }> = ({
  card,
  onOpen,
}) => {
  const palette = getCardPalette(card);

  return (
    <button
      type="button"
      onClick={onOpen}
      onTouchStart={() => undefined}
      className="archive-edge engraved"
      style={{
        backgroundColor: palette.paper,
        backgroundImage: `url(${cardboardTexture})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundBlendMode: 'multiply',
      }}
      aria-label={`${card.title}, ${kindLabel(card)}, ${formatArchiveDay(card.completedAt)}`}
    >
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: palette.accent }}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1">
        <span
          className="block truncate text-[16px] font-semibold leading-[1.2]"
          style={{ color: '#28231D' }}
        >
          {card.title}
        </span>
        <span
          className="block truncate font-mono text-[11px] uppercase tracking-[0.1em]"
          style={{ color: 'rgba(40,35,29,0.5)' }}
        >
          {kindLabel(card)} · {formatArchiveDay(card.completedAt)}
        </span>
      </span>
      <CouponStub card={card} />
    </button>
  );
};

/**
 * Completed cards filed like an index-card box: they stand on their edge,
 * newest first, behind kraft dividers for every month. A strip of month tabs
 * jumps to a divider; search and the kind tabs narrow the box down.
 */
export const ArchiveCatalog: React.FC<ArchiveCatalogProps> = ({
  cards,
  onOpenCard,
}) => {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<ArchiveKindFilter>('all');
  const months = useMemo(
    () => groupArchiveByMonth(filterArchive(cards, query, kind)),
    [cards, query, kind],
  );
  const isFiltered = query.trim().length > 0 || kind !== 'all';

  const jumpTo = (monthKey: string) => {
    document
      .getElementById(anchorId(monthKey))
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="mt-6 flex w-[min(560px,100%)] shrink-0 flex-col">
      {/* Search strip and kind tabs */}
      <div className="engraved flex flex-col gap-3">
        <label
          className="flex items-center gap-2.5 rounded-[12px] border px-4"
          style={{
            borderColor: 'rgba(82,69,56,0.22)',
            backgroundColor: 'rgba(247,242,232,0.9)',
            backgroundImage: `url(${cardboardTexture})`,
            backgroundSize: 'cover',
            backgroundBlendMode: 'multiply',
            boxShadow:
              'inset 0 2px 4px rgba(40,28,16,0.16), inset 0 -1px 0 rgba(255,255,255,0.8)',
          }}
        >
          <span className="text-[18px]" style={{ color: 'rgba(63,57,50,0.55)' }} aria-hidden="true">
            ⌕
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Найти карточку"
            aria-label="Поиск по архиву"
            className="h-[44px] min-w-0 flex-1 border-0 bg-transparent p-0 text-[16px] outline-none placeholder:text-black/35"
            style={{ color: '#28231D', fontFamily: 'inherit' }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Очистить поиск"
              className="h-8 w-8 cursor-pointer border-0 bg-transparent text-[16px]"
              style={{ color: 'rgba(63,57,50,0.6)' }}
            >
              ✕
            </button>
          )}
        </label>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Тип карточек">
          {KIND_FILTERS.map((filter) => {
            const isActive = kind === filter.id;

            return (
              <button
                key={filter.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setKind(filter.id)}
                onTouchStart={() => undefined}
                className="pill-action"
                style={
                  {
                    padding: '9px 15px',
                    ['--pill-bg' as string]: isActive
                      ? 'rgba(174,143,75,0.32)'
                      : 'rgba(247,242,232,0.85)',
                    ['--pill-ink' as string]: isActive ? '#5a4520' : '#5f554a',
                    ['--pill-glow' as string]: 'rgba(222,196,140,0.75)',
                  } as React.CSSProperties
                }
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Month index: tabs that jump to their divider */}
      {months.length > 1 && (
        <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1" aria-label="Месяцы">
          {months.map((month) => (
            <button
              key={month.key}
              type="button"
              onClick={() => jumpTo(month.key)}
              className="archive-month-tab engraved shrink-0"
              style={{ backgroundColor: KRAFT, backgroundImage: `url(${cardboardTexture})` }}
            >
              {month.label} · {month.cards.length}
            </button>
          ))}
        </div>
      )}

      {/* The box itself */}
      <div
        className="mt-4 rounded-[18px] px-3 pb-4 pt-3 sm:px-4"
        style={{
          backgroundColor: 'rgba(120,96,70,0.22)',
          backgroundImage: `url(${cardboardTexture})`,
          backgroundBlendMode: 'multiply',
          boxShadow:
            'inset 0 6px 14px rgba(40,28,16,0.35), inset 0 -2px 4px rgba(255,255,255,0.35), 0 1px 0 rgba(255,255,255,0.7)',
        }}
      >
        {months.length === 0 ? (
          <div className="engraved flex min-h-[180px] flex-col items-center justify-center px-6 text-center">
            <p className="text-[17px] font-semibold" style={{ color: 'rgba(40,35,29,0.66)' }}>
              {isFiltered ? 'Ничего не нашлось' : 'Здесь пока пусто'}
            </p>
            <p className="mt-2 max-w-[300px] text-[13.5px] leading-[1.4]" style={{ color: 'rgba(63,57,50,0.7)' }}>
              {isFiltered
                ? 'Попробуйте другое слово или другой тип.'
                : 'Оторвите купон на карточке — и она встанет сюда, в картотеку.'}
            </p>
          </div>
        ) : (
          months.map((month) => (
            <section key={month.key} aria-label={month.label}>
              {/* Scroll target that does not stick, unlike the divider. */}
              <span id={anchorId(month.key)} className="block scroll-mt-2" />
              <div
                className="archive-divider engraved"
                style={{ backgroundColor: KRAFT, backgroundImage: `url(${cardboardTexture})` }}
              >
                <span
                  className="archive-divider__tab"
                  style={{ backgroundColor: KRAFT, backgroundImage: `url(${cardboardTexture})` }}
                >
                  {month.label}
                </span>
                <span className="ml-auto font-mono text-[11.5px] font-bold uppercase tracking-[0.1em]" style={{ color: 'rgba(70,52,28,0.7)' }}>
                  {month.cards.length} {pluralCards(month.cards.length)}
                </span>
              </div>
              <div className="archive-edges">
                {month.cards.map((card) => (
                  <CardEdge key={card.id} card={card} onOpen={() => onOpenCard(card.id)} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
};
