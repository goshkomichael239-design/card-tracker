import type { KeyboardEvent } from 'react';

import type { CardPalette, TaskListItem } from '../../app/cardTheme';

interface DraftListItemsStepProps {
  items: TaskListItem[];
  input: string;
  disabled: boolean;
  palette: CardPalette;
  onInputChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

export function DraftListItemsStep({
  items,
  input,
  disabled,
  palette,
  onInputChange,
  onAdd,
  onRemove,
}: DraftListItemsStepProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onAdd();
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col pt-1">
      <p
        className="font-mono text-[12.5px] font-bold uppercase tracking-[0.16em]"
        style={{ color: palette.accentDark }}
      >
        Список
      </p>

      <div
        className="mt-5 flex min-h-[48px] items-center gap-3 border-b pb-2"
        style={{ borderColor: 'rgba(69,57,44,0.12)' }}
      >
        <span
          aria-hidden="true"
          className="h-6 w-6 shrink-0 rounded-full border"
          style={{ borderColor: `${palette.accent}7a` }}
        />
        <input
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Добавить пункт…"
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[19px] leading-[1.35] outline-none placeholder:text-black/28"
          style={{ color: palette.ink }}
        />
        <button
          type="button"
          onClick={onAdd}
          disabled={disabled || !input.trim()}
          aria-label="Добавить пункт"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-transparent text-[24px] font-light leading-none transition-opacity disabled:opacity-25"
          style={{
            color: palette.accentDark,
            borderColor: `${palette.accent}5c`,
            backgroundColor: `${palette.accent}10`,
          }}
        >
          +
        </button>
      </div>

      <div
        className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1"
        style={{ overscrollBehavior: 'contain' }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="group flex min-h-[48px] items-center gap-3 border-b py-2"
            style={{
              borderColor: 'rgba(69,57,44,0.08)',
              color: palette.ink,
            }}
          >
            <span
              aria-hidden="true"
              className="h-6 w-6 shrink-0 rounded-full border"
              style={{ borderColor: 'rgba(69,57,44,0.28)' }}
            />
            <span className="min-w-0 flex-1 break-words text-[18px] leading-[1.35]">
              {item.text}
            </span>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              disabled={disabled}
              aria-label={`Удалить ${item.text}`}
              className="flex h-9 w-9 shrink-0 items-center justify-center border-0 bg-transparent text-[20px] text-black/30 opacity-50 transition-opacity hover:opacity-80 focus-visible:opacity-80 disabled:opacity-20 sm:opacity-25 sm:group-hover:opacity-70"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
