import React from 'react';

import cardboardTexture from '../../assets/cardboard.avif';
import type { DueBucket } from '../../app/timeOps';

export type DeckFilter = 'all' | DueBucket;

interface DeckTabsProps {
  counts: Record<DueBucket, number>;
  active: DeckFilter;
  onSelect: (filter: DeckFilter) => void;
}

const TABS: Array<{ id: DueBucket; label: string; ink: string }> = [
  { id: 'overdue', label: 'Просрочено', ink: '#8F3025' },
  { id: 'today', label: 'Сегодня', ink: '#5a4520' },
  { id: 'soon', label: 'Скоро', ink: '#3f4f5c' },
];

/**
 * Paper index tabs hanging from the card list: what is overdue, due today
 * and coming soon. Pressing one keeps only those cards in the list and the
 * deck; pressing it again brings the whole deck back.
 */
export const DeckTabs: React.FC<DeckTabsProps> = ({ counts, active, onSelect }) => (
  <div className="flex justify-start gap-1.5 px-3" role="tablist" aria-label="Обзор по срокам">
    {TABS.map((tab) => {
      const count = counts[tab.id];
      const isActive = active === tab.id;

      return (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={isActive}
          disabled={count === 0 && !isActive}
          onClick={() => onSelect(isActive ? 'all' : tab.id)}
          onTouchStart={() => undefined}
          className={`deck-tab engraved${isActive ? ' deck-tab--active' : ''}`}
          style={{
            color: tab.ink,
            backgroundImage: `url(${cardboardTexture})`,
          }}
        >
          {tab.label}
          <span className="deck-tab__count">{count}</span>
        </button>
      );
    })}
  </div>
);
