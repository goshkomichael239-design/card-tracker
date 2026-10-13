import React, { useEffect, useMemo, useRef, useState } from 'react';

import type { CardPalette, TaskListData, TaskListItem } from '../../app/cardTheme';
import { getListCompletedCount } from '../../app/listUtils';
import { TaskListContent } from './TaskListContent';
import { EmbossedArrow } from '../shared/EmbossedArrow';

interface CardListFaceProps {
  list: TaskListData;
  palette: CardPalette;
  onToggle: (itemId: string) => void;
  onAdd: (text: string) => void;
  onBack: () => void;
}

// Row geometry of TaskListContent's "card" variant: at least 48px, a further
// ~23px for every extra line of text (about 32 characters to a line).
const ROW_MIN_HEIGHT = 48;
const ROW_LINE_HEIGHT = 23.5;
const CHARS_PER_LINE = 32;
const FALLBACK_AREA_HEIGHT = 240;

const estimateRowHeight = (item: TaskListItem): number => {
  const lines = Math.max(1, Math.ceil(item.text.length / CHARS_PER_LINE));
  return ROW_MIN_HEIGHT + (lines - 1) * ROW_LINE_HEIGHT;
};

/** Packs the items into pages that each fit `height` pixels. */
const paginateItems = (items: TaskListItem[], height: number): TaskListItem[][] => {
  const pages: TaskListItem[][] = [];
  let page: TaskListItem[] = [];
  let used = 0;

  for (const item of items) {
    const rowHeight = estimateRowHeight(item);

    if (page.length > 0 && used + rowHeight > height) {
      pages.push(page);
      page = [];
      used = 0;
    }

    page.push(item);
    used += rowHeight;
  }

  if (page.length > 0) {
    pages.push(page);
  }

  return pages.length > 0 ? pages : [[]];
};

/**
 * The whole list on the card itself: the same card, the same rows, as many as
 * fit, with page arrows under them. Replaces the old full-screen sheet.
 */
export const CardListFace: React.FC<CardListFaceProps> = ({
  list,
  palette,
  onToggle,
  onAdd,
  onBack,
}) => {
  const [page, setPage] = useState(0);
  const [areaHeight, setAreaHeight] = useState(FALLBACK_AREA_HEIGHT);
  const [input, setInput] = useState('');
  const areaRef = useRef<HTMLDivElement | null>(null);
  const pages = useMemo(
    () => paginateItems(list.items, areaHeight),
    [list.items, areaHeight],
  );
  const currentPage = Math.min(page, pages.length - 1);
  const completedCount = getListCompletedCount(list);

  useEffect(() => {
    const area = areaRef.current;

    if (!area) {
      return;
    }

    const observer = new ResizeObserver(() => {
      // A little less than the box: the last row must not touch the pager.
      setAreaHeight(Math.max(96, Math.floor(area.clientHeight) - 4));
    });
    observer.observe(area);

    return () => observer.disconnect();
  }, []);

  // ← / → turn the page, unless the add field has the keys.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') ||
        (event.target as HTMLElement | null)?.tagName === 'INPUT'
      ) {
        return;
      }

      setPage((previous) =>
        Math.min(
          Math.max(0, Math.min(previous, pages.length - 1) + (event.key === 'ArrowRight' ? 1 : -1)),
          pages.length - 1,
        ),
      );
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pages.length]);

  const handleAdd = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!input.trim()) {
      return;
    }

    onAdd(input);
    setInput('');
    // The new item lands at the end: show the last page.
    setPage(Number.MAX_SAFE_INTEGER);
  };

  const arrowStyle = {
    padding: '9px 20px',
    fontSize: 22,
    lineHeight: 1,
    ['--pill-bg' as string]: `${palette.accent}2e`,
    ['--pill-ink' as string]: palette.accentDark,
    ['--pill-glow' as string]: palette.glow,
  } as React.CSSProperties;

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between">
        <span
          className="rounded-full px-3 py-1.5 font-mono text-[11.5px] font-bold uppercase tracking-[0.12em]"
          style={{
            color: palette.accentDark,
            backgroundColor: `${palette.accent}1d`,
          }}
        >
          Список · {completedCount} / {list.items.length}
        </span>
      </div>

      <div ref={areaRef} className="mt-3 flex min-h-0 flex-1 flex-col">
        <TaskListContent
          key={currentPage}
          list={{ ...list, items: pages[currentPage] ?? [] }}
          palette={palette}
          disabled={false}
          onToggle={onToggle}
        />
      </div>

      <form
        onSubmit={handleAdd}
        className="mt-2 flex h-[46px] shrink-0 items-center gap-3 border-t pt-2"
        style={{ borderColor: 'rgba(69,57,44,0.12)' }}
      >
        <span
          aria-hidden="true"
          className="h-[22px] w-[22px] shrink-0 rounded-[6px]"
          style={{ border: `1.5px dashed ${palette.accent}7a` }}
        />
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Добавить пункт…"
          aria-label="Новый пункт"
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[17px] leading-[1.35] outline-none placeholder:text-black/28"
          style={{ color: palette.ink }}
        />
        <button
          type="submit"
          disabled={!input.trim()}
          aria-label="Добавить пункт"
          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border bg-transparent text-[22px] font-light leading-none disabled:cursor-default disabled:opacity-25"
          style={{
            color: palette.accentDark,
            borderColor: `${palette.accent}5c`,
            backgroundColor: `${palette.accent}10`,
          }}
        >
          +
        </button>
      </form>

      <div className="mt-2 flex h-[46px] shrink-0 items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          onTouchStart={() => undefined}
          className="cursor-pointer border-0 bg-transparent px-0 font-mono text-[12px] font-bold uppercase tracking-[0.12em]"
          style={{ color: palette.accentDark }}
        >
          <EmbossedArrow direction="left" size="1.1em" /> К карточке
        </button>

        {pages.length > 1 && (
          <div className="flex items-center gap-2" role="group" aria-label="Страницы списка">
            <button
              type="button"
              onClick={() => setPage(Math.max(0, currentPage - 1))}
              onTouchStart={() => undefined}
              disabled={currentPage === 0}
              aria-label="Предыдущая страница"
              className="pill-action disabled:cursor-default disabled:opacity-35"
              style={arrowStyle}
            >
              <EmbossedArrow direction="left" size={20} />
            </button>
            <span
              className="min-w-[42px] text-center font-mono text-[12.5px] font-bold tabular-nums"
              style={{ color: palette.accentDark }}
              aria-live="polite"
            >
              {currentPage + 1} / {pages.length}
            </span>
            <button
              type="button"
              onClick={() => setPage(Math.min(pages.length - 1, currentPage + 1))}
              onTouchStart={() => undefined}
              disabled={currentPage >= pages.length - 1}
              aria-label="Следующая страница"
              className="pill-action disabled:cursor-default disabled:opacity-35"
              style={arrowStyle}
            >
              <EmbossedArrow direction="right" size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
