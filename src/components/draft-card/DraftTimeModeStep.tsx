import React from 'react';

import type { CardPalette, TimeMode } from '../../app/cardTheme';
import { t } from '../../app/i18n';

export interface DraftTimeModeStepProps {
  timeMode: TimeMode | null;
  /** True once "Регулярно" was chosen (a repeating card is a reminder). */
  isRepeating: boolean;
  palette: CardPalette;
  onSelectTimeMode: (mode: TimeMode) => void;
  onSelectRepeat: () => void;
}

const drawDelay = (ms: number): React.CSSProperties =>
  ({ ['--draw-delay' as string]: `${ms}ms` }) as React.CSSProperties;

/**
 * When the card is due: four slots pressed into the paper, a word on the
 * left and a quiet hint on the right, like the choices of "put off".
 */
export function DraftTimeModeStep({
  timeMode,
  isRepeating,
  palette,
  onSelectTimeMode,
  onSelectRepeat,
}: DraftTimeModeStepProps) {
  const glowStyle = {
    ['--etched-glow' as string]: palette.glow,
  } as React.CSSProperties;
  const options: Array<{
    id: string;
    title: string;
    hint: string;
    selected: boolean;
    onPick: () => void;
  }> = [
    {
      id: 'none',
      title: t('Без времени'),
      hint: t('просто дело'),
      selected: timeMode === 'none',
      onPick: () => onSelectTimeMode('none'),
    },
    {
      id: 'deadline',
      title: t('Выполнить до'),
      hint: t('срок'),
      selected: timeMode === 'deadline',
      onPick: () => onSelectTimeMode('deadline'),
    },
    {
      id: 'reminder',
      title: t('Напоминание'),
      hint: t('в нужный час'),
      selected: timeMode === 'reminder' && !isRepeating,
      onPick: () => onSelectTimeMode('reminder'),
    },
    {
      id: 'repeat',
      title: t('Регулярно'),
      hint: t('по расписанию'),
      selected: isRepeating,
      onPick: onSelectRepeat,
    },
  ];

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
      >{t('Когда?')}</p>

      <div className="mt-4 flex flex-col gap-2.5">
        {options.map((option, index) => (
          <button
            key={option.id}
            type="button"
            onClick={option.onPick}
            onTouchStart={() => undefined}
            className={`etched-action etched-action--slim etched-action--roomy draw-in${option.selected ? ' etched-action--selected' : ''}`}
            style={{ ...drawDelay(120 + index * 50), ...glowStyle }}
          >
            <span className="etched-action__text">{option.title}</span>
            <span className="etched-action__hint">{option.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
