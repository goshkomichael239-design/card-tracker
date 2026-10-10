import React from 'react';

import type { CardKind, CardPalette } from '../../app/cardTheme';

export interface DraftKindStepProps {
  selectedKind: CardKind | null;
  palette: CardPalette;
  onSelectKind: (kind: CardKind) => void;
}

const OPTIONS: Array<{ kind: CardKind; title: string; hint: string }> = [
  { kind: 'single', title: 'Одна задача', hint: 'название и срок' },
  { kind: 'series', title: 'Серия', hint: 'название и цель' },
  { kind: 'list', title: 'Список', hint: 'пункты по одному' },
];

const drawDelay = (ms: number): React.CSSProperties =>
  ({ ['--draw-delay' as string]: `${ms}ms` }) as React.CSSProperties;

/**
 * The first thing on a new card: what it will be. Three slots pressed into
 * the paper, like the actions of a finished card, each with a short hint.
 */
export function DraftKindStep({
  selectedKind,
  palette,
  onSelectKind,
}: DraftKindStepProps) {
  const glowStyle = {
    ['--etched-glow' as string]: palette.glow,
  } as React.CSSProperties;

  return (
    <div className="flex flex-col">
      <p
        className="draw-in shrink-0 font-semibold leading-[1.15]"
        style={{
          ...drawDelay(60),
          fontSize: 22,
          color: 'rgba(40,35,29,0.62)',
          letterSpacing: '-0.015em',
        }}
      >
        Что создаём?
      </p>

      <div className="mt-5 flex flex-col gap-3">
        {OPTIONS.map((option, index) => (
          <button
            key={option.kind}
            type="button"
            onClick={() => onSelectKind(option.kind)}
            onTouchStart={() => undefined}
            className={`etched-action etched-action--stacked draw-in${selectedKind === option.kind ? ' etched-action--selected' : ''}`}
            style={{ ...drawDelay(140 + index * 55), ...glowStyle }}
          >
            <span className="etched-action__text">{option.title}</span>
            <span className="etched-action__hint">{option.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
