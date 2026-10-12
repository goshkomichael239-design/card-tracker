import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import cardboardTexture from '../../assets/cardboard.avif';
import {
  filterArchive,
  formatArchiveDay,
  groupArchiveByMonth,
  paginateArchive,
  pluralCards,
  type ArchiveKindFilter,
} from '../../app/archiveUtils';
import { getCardPalette, type VisualCard } from '../../app/cardTheme';
import { getListCompletedCount, getListProgress } from '../../app/listUtils';
import { getSeriesProgress } from '../../app/seriesUtils';

interface ArchiveCatalogProps {
  /** The search box starts with this text. */
  initialQuery?: string;
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

// Room under the box that is not for cards: the pager, and the page's own
// bottom padding (the archive scroll area keeps 110px free for the nav bar).
const PAGER_RESERVE = 62;
const BOX_PADDING = 26;
const SCROLL_BOTTOM_RESERVE = 110;
const FALLBACK_BUDGET = 360;

/**
 * The stub left of a torn-off coupon, in miniature: filled with the card's
 * accent as far as the work got (series, list), fully for a single task.
 */
const CouponStub: React.FC<{ card: VisualCard }> = ({ card }) => {
  const palette = getCardPalette(card);
  const share = card.series
    ? getSeriesProgress(card.series)
    : card.list
      ? getListProgress(card.list)
      : 1;
  const label = card.series
    ? `${card.series.entries.length}/${card.series.targetCount}`
    : card.list
      ? `${getListCompletedCount(card.list)}/${card.list.items.length}`
      : '✓';

  return (
    <span
      className="relative flex h-[20px] w-[47px] shrink-0 items-center justify-center overflow-hidden rounded-[5px]"
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
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: palette.accent }}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1">
        <span
          className="block truncate text-[14.5px] font-semibold leading-[1.2]"
          style={{ color: '#28231D' }}
        >
          {card.title}
        </span>
        <span
          className="block truncate font-mono text-[10px] uppercase tracking-[0.1em]"
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
  initialQuery = '',
  onOpenCard,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [kind, setKind] = useState<ArchiveKindFilter>('all');
  const [page, setPage] = useState(0);
  const [budget, setBudget] = useState(FALLBACK_BUDGET);
  // Which way the last page turn went, for the direction of the slide.
  const [direction, setDirection] = useState<1 | -1>(1);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const months = useMemo(
    () => groupArchiveByMonth(filterArchive(cards, query, kind)),
    [cards, query, kind],
  );
  const pages = useMemo(
    () => paginateArchive(months, budget),
    [months, budget],
  );
  const pageCount = Math.max(1, pages.length);
  const currentPage = Math.min(page, pageCount - 1);
  const pageMonths = pages[currentPage] ?? [];
  const isFiltered = query.trim().length > 0 || kind !== 'all';
  const totalCards = months.reduce((sum, month) => sum + month.cards.length, 0);

  // The page holds as many cards as fit under the box without scrolling: what
  // is left of the window below the box's top edge, minus the pager.
  useEffect(() => {
    const root = rootRef.current;
    const scroller = root?.closest<HTMLElement>('.overflow-y-auto');

    if (!root || !scroller) {
      return;
    }

    const measure = () => {
      const box = boxRef.current;

      if (!box) {
        return;
      }

      const top =
        box.getBoundingClientRect().top -
        scroller.getBoundingClientRect().top +
        scroller.scrollTop;
      // What follows the catalogue (the backup strip) keeps its own room.
      const after = root.nextElementSibling as HTMLElement | null;
      const afterHeight = after
        ? after.getBoundingClientRect().height +
          parseFloat(getComputedStyle(after).marginTop || '0')
        : 0;
      const available =
        scroller.clientHeight -
        top -
        PAGER_RESERVE -
        BOX_PADDING -
        afterHeight -
        SCROLL_BOTTOM_RESERVE;

      setBudget(Math.max(160, Math.round(available)));
    };
    const observer = new ResizeObserver(measure);

    // Everything above the box moves it: the window, the title block, the
    // summary lines — so every block of the page is watched.
    observer.observe(scroller);
    for (const child of Array.from(scroller.children)) {
      observer.observe(child);
    }
    for (const child of Array.from(root.parentElement?.children ?? [])) {
      observer.observe(child);
    }
    void document.fonts?.ready.then(measure);

    return () => observer.disconnect();
  }, []);

  const turnTo = (next: number) => {
    const clamped = Math.min(Math.max(0, next), pageCount - 1);

    if (clamped === currentPage) {
      return;
    }

    setDirection(clamped > currentPage ? 1 : -1);
    setPage(clamped);
  };

  // ← / → turn the page, unless a card is open or a field has the keys.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      if (
        (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') ||
        target?.tagName === 'INPUT' ||
        document.querySelector('[role="dialog"]')
      ) {
        return;
      }

      const next = currentPage + (event.key === 'ArrowRight' ? 1 : -1);
      const clamped = Math.min(Math.max(0, next), pageCount - 1);

      if (clamped !== currentPage) {
        setDirection(clamped > currentPage ? 1 : -1);
        setPage(clamped);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, pageCount]);

  const jumpTo = (monthKey: string) => {
    const index = pages.findIndex((entries) =>
      entries.some((month) => month.key === monthKey),
    );

    if (index >= 0) {
      turnTo(index);
    }
  };

  return (
    <div ref={rootRef} className="mt-3 flex w-[min(560px,100%)] shrink-0 flex-col">
      {/* Search strip and kind tabs */}
      <div className="engraved flex flex-col gap-3 sm:flex-row sm:items-center">
        <label
          className="flex items-center gap-2.5 rounded-[12px] border px-4 sm:min-w-0 sm:flex-1"
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
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
            placeholder="Найти карточку"
            aria-label="Поиск по архиву"
            className="h-[40px] min-w-0 flex-1 border-0 bg-transparent p-0 text-[16px] outline-none placeholder:text-black/35"
            style={{ color: '#28231D', fontFamily: 'inherit' }}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setPage(0);
              }}
              aria-label="Очистить поиск"
              className="h-8 w-8 cursor-pointer border-0 bg-transparent text-[16px]"
              style={{ color: 'rgba(63,57,50,0.6)' }}
            >
              ✕
            </button>
          )}
        </label>

        <div className="flex flex-wrap gap-2 sm:shrink-0 sm:flex-nowrap" role="tablist" aria-label="Тип карточек">
          {KIND_FILTERS.map((filter) => {
            const isActive = kind === filter.id;

            return (
              <button
                key={filter.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setKind(filter.id);
                  setPage(0);
                }}
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
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1" aria-label="Месяцы">
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
        ref={boxRef}
        className="mt-3 overflow-hidden rounded-[18px] px-3 pb-3 pt-3 sm:px-4"
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
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={currentPage}
              custom={direction}
              variants={{
                enter: (dir: number) => ({ opacity: 0, x: dir * 36, rotate: dir * 1.4 }),
                center: { opacity: 1, x: 0, rotate: 0 },
                exit: (dir: number) => ({ opacity: 0, x: dir * -36, rotate: dir * -1.4 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
              style={{ transformOrigin: '50% 100%' }}
            >
              {pageMonths.map((month) => (
                <section key={month.key} aria-label={month.label}>
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
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Pager: thumb through the box, a page of cards at a time. */}
      {pageCount > 1 && (
        <nav
          className="engraved mt-3 flex items-center justify-center gap-3"
          aria-label="Страницы архива"
        >
          <button
            type="button"
            onClick={() => turnTo(currentPage - 1)}
            onTouchStart={() => undefined}
            disabled={currentPage === 0}
            aria-label="Предыдущая страница"
            className="pill-action disabled:cursor-default disabled:opacity-40"
            style={
              {
                padding: '11px 30px',
                fontSize: 26,
                lineHeight: 1,
                boxShadow:
                  'inset 0 2px 0 rgba(255,255,255,0.7), inset 0 -2px 3px rgba(90,60,20,0.18), 0 2px 5px rgba(40,28,16,0.28)',
                ['--pill-bg' as string]: 'rgba(222,196,140,0.6)',
                ['--pill-ink' as string]: '#5a4520',
                ['--pill-glow' as string]: 'rgba(222,196,140,0.75)',
              } as React.CSSProperties
            }
          >
            ←
          </button>
          <span
            className="min-w-[140px] text-center font-mono text-[13px] font-bold uppercase tracking-[0.12em]"
            style={{ color: 'rgba(70,52,28,0.75)' }}
            aria-live="polite"
          >
            Лист {currentPage + 1} из {pageCount}
            <span className="block text-[10.5px] font-semibold opacity-70">
              {totalCards} {pluralCards(totalCards)}
            </span>
          </span>
          <button
            type="button"
            onClick={() => turnTo(currentPage + 1)}
            onTouchStart={() => undefined}
            disabled={currentPage >= pageCount - 1}
            aria-label="Следующая страница"
            className="pill-action disabled:cursor-default disabled:opacity-40"
            style={
              {
                padding: '11px 30px',
                fontSize: 26,
                lineHeight: 1,
                boxShadow:
                  'inset 0 2px 0 rgba(255,255,255,0.7), inset 0 -2px 3px rgba(90,60,20,0.18), 0 2px 5px rgba(40,28,16,0.28)',
                ['--pill-bg' as string]: 'rgba(222,196,140,0.6)',
                ['--pill-ink' as string]: '#5a4520',
                ['--pill-glow' as string]: 'rgba(222,196,140,0.75)',
              } as React.CSSProperties
            }
          >
            →
          </button>
        </nav>
      )}
    </div>
  );
};
