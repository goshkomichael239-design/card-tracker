import React from 'react';

import { createDebugCards } from '../app/debugCards';
import type { VisualCard } from '../app/cardTheme';

interface DebugCardsPanelProps {
  disabled?: boolean;
  onAddCards: (cards: VisualCard[]) => void;
  onRemoveDebugCards: () => void;
}

const BUTTON_CLASS =
  'rounded-xl border border-white/10 bg-black/50 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-white/45 backdrop-blur-xl transition hover:bg-black/70 hover:text-white/80 disabled:opacity-40';

/**
 * DEV-only helper for looking at a realistic deck: adds fifteen test cards of
 * every kind and state, or removes the ones it added. Rendered only when
 * `import.meta.env.DEV`, so it never ships in a production build.
 */
export const DebugCardsPanel: React.FC<DebugCardsPanelProps> = ({
  disabled = false,
  onAddCards,
  onRemoveDebugCards,
}) => (
  <div className="fixed bottom-3 left-3 z-[1000] flex gap-1.5">
    <button
      type="button"
      disabled={disabled}
      onClick={() => onAddCards(createDebugCards())}
      className={BUTTON_CLASS}
    >
      + 15 карточек
    </button>
    <button
      type="button"
      disabled={disabled}
      onClick={onRemoveDebugCards}
      className={BUTTON_CLASS}
    >
      Убрать тестовые
    </button>
  </div>
);
