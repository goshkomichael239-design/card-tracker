import { useState, type FormEvent } from 'react';

import cardboardTexture from '../../assets/cardboard.avif';
import { getCardPalette, type VisualCard } from '../../app/cardTheme';
import { getListCompletedCount } from '../../app/listUtils';
import { INITIAL_TASK_CARD_V2_CONFIG } from './taskCardV2Config';
import { TaskListContent } from './TaskListContent';

interface FullListSheetProps {
  card: VisualCard;
  onToggleItem: (itemId: string) => void;
  onAddItem: (cardId: string, text: string) => void;
  onClose: () => void;
}

export function FullListSheet({
  card,
  onToggleItem,
  onAddItem,
  onClose,
}: FullListSheetProps) {
  const [input, setInput] = useState('');
  const list = card.list;
  const palette = getCardPalette(card);
  const config = INITIAL_TASK_CARD_V2_CONFIG;
  const disabled = Boolean(card.completedAt);

  if (!list) {
    return null;
  }

  const completedCount = getListCompletedCount(list);

  const handleAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (disabled || !input.trim()) {
      return;
    }

    onAddItem(card.id, input);
    setInput('');
  };

  return (
    <div
      className="absolute inset-0 z-50 bg-black/25 p-2 sm:p-5"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Полный список"
        className="relative flex h-full w-full flex-col overflow-hidden border"
        style={{
          borderRadius: config.borderRadius,
          padding: 'clamp(20px, 4vw, 34px)',
          backgroundColor: palette.paper,
          backgroundImage: `url(${cardboardTexture})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'multiply',
          borderColor: 'rgba(91,76,59,0.16)',
          boxShadow: `${config.shadowX}px ${config.shadowY}px ${config.shadowBlur}px rgba(20,17,14,${config.shadowOpacity}), inset 0 1px 0 rgba(255,255,255,0.88), inset 0 -1px 2px rgba(79,61,42,0.08)`,
        }}
      >
        <header className="flex shrink-0 items-start justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] border-0 bg-transparent px-0 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: palette.accentDark }}
          >
            ← Назад
          </button>

          <div className="min-w-0 text-center">
            <p
              className="font-mono text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ color: palette.accentDark }}
            >
              Список
            </p>
            <p className="mt-1 font-mono text-[13px] text-[#6B6258]">
              {completedCount} / {list.items.length}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть список"
            className="flex h-10 w-10 items-center justify-center rounded-full border bg-transparent text-[23px] font-light leading-none"
            style={{
              color: palette.accentDark,
              borderColor: `${palette.accent}4d`,
              backgroundColor: `${palette.accent}0d`,
            }}
          >
            ×
          </button>
        </header>

        <div className="mt-5 min-h-0 flex-1">
          <TaskListContent
            list={list}
            palette={palette}
            disabled={disabled}
            onToggle={onToggleItem}
            variant="sheet"
          />
        </div>

        {!disabled && (
          <form
            onSubmit={handleAdd}
            className="mt-4 flex shrink-0 items-center gap-3 border-t pt-4"
            style={{ borderColor: 'rgba(69,57,44,0.12)' }}
          >
            <span
              aria-hidden="true"
              className="h-7 w-7 shrink-0 rounded-full border"
              style={{ borderColor: `${palette.accent}7a` }}
            />
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Добавить пункт…"
              className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[18px] leading-[1.35] outline-none placeholder:text-black/28"
              style={{ color: palette.ink }}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Добавить пункт"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-transparent text-[24px] font-light leading-none disabled:opacity-25"
              style={{
                color: palette.accentDark,
                borderColor: `${palette.accent}5c`,
                backgroundColor: `${palette.accent}10`,
              }}
            >
              +
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
