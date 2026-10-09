import type { CardPalette, TaskListData } from '../../app/cardTheme';
interface TaskListContentProps {
  list: TaskListData;
  palette: CardPalette;
  disabled: boolean;
  onToggle: (itemId: string) => void;
  maxItems?: number;
  onOpenList?: () => void;
  variant?: 'card' | 'sheet';
}

export function TaskListContent({
  list,
  palette,
  disabled,
  onToggle,
  maxItems,
  onOpenList,
  variant = 'card',
}: TaskListContentProps) {
  const visibleItems = maxItems
    ? list.items.slice(0, maxItems)
    : list.items;
  const hasHiddenItems = visibleItems.length < list.items.length;
  const isSheet = variant === 'sheet';

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div
        className="min-h-0 flex-1 overflow-y-auto pr-1"
        style={{ overscrollBehavior: 'contain' }}
      >
        {list.items.length === 0 ? (
          <p className="text-[15px] text-black/40">Нет пунктов</p>
        ) : (
          visibleItems.map((item) => {
            const completed = Boolean(item.completedAt);

            return (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                onClick={() => onToggle(item.id)}
                aria-pressed={completed}
                className="flex w-full items-start gap-3 border-b py-3 text-left disabled:cursor-default"
                style={{
                  minHeight: isSheet ? 62 : 48,
                  borderColor: isSheet
                    ? 'rgba(69,57,44,0.075)'
                    : 'rgba(69,57,44,0.045)',
                  color: completed ? 'rgba(40,35,29,0.56)' : '#28231D',
                }}
              >
                <span
                  className="mt-[1px] flex shrink-0 items-center justify-center rounded-full border font-mono font-bold"
                  style={{
                    width: isSheet ? 28 : 26,
                    height: isSheet ? 28 : 26,
                    fontSize: isSheet ? 15 : 14,
                    borderColor: completed
                      ? palette.accent
                      : 'rgba(69,57,44,0.32)',
                    backgroundColor: completed
                      ? palette.accent
                      : 'transparent',
                    color: 'white',
                  }}
                >
                  {completed ? '✓' : ''}
                </span>
                <span
                  className="min-w-0 flex-1 break-words leading-[1.38]"
                  style={{
                    fontSize: isSheet ? 18 : 17,
                    textDecoration: completed ? 'line-through' : 'none',
                    textDecorationColor: `${palette.accent}8f`,
                    textDecorationThickness: '1px',
                  }}
                >
                  {item.text}
                </span>
              </button>
            );
          })
        )}
        {onOpenList && !disabled && (
          <button
            type="button"
            onClick={onOpenList}
            className="mt-2 flex min-h-[34px] items-center border-0 bg-transparent px-0 text-left font-mono text-[10px] uppercase tracking-[0.1em]"
            style={{ color: palette.accentDark }}
          >
            {hasHiddenItems
              ? `Показать все · ${list.items.length} →`
              : '+ Добавить пункт'}
          </button>
        )}
      </div>
    </section>
  );
}
