import React from 'react';

import type { CardPalette } from '../../app/cardTheme';

interface CardFinishFaceProps {
  title: string;
  done: number;
  target: number;
  palette: CardPalette;
  onConfirm: () => void;
  onCancel: () => void;
}

const drawDelay = (ms: number): React.CSSProperties =>
  ({ ['--draw-delay' as string]: `${ms}ms` }) as React.CSSProperties;

/**
 * "Only N of X are done: finish the series anyway?" Same card, same pressed
 * slots as the actions face. Read top to bottom: what it is, how far it got
 * (big number + a recessed track showing the share the slot will be filled to),
 * the question, and the two answers.
 */
export const CardFinishFace: React.FC<CardFinishFaceProps> = ({
  title,
  done,
  target,
  palette,
  onConfirm,
  onCancel,
}) => {
  const share = target > 0 ? Math.min(1, Math.max(0, done / target)) : 0;
  const glowStyle = {
    ['--etched-glow' as string]: palette.glow,
  } as React.CSSProperties;

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex items-center justify-between">
        <span
          className="rounded-full px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em]"
          style={{
            color: palette.accentDark,
            backgroundColor: `${palette.accent}1d`,
          }}
        >
          Серия
        </span>
      </div>

      <p
        className="draw-in mt-6 shrink-0 truncate font-semibold leading-[1.15]"
        style={{
          ...drawDelay(100),
          fontSize: 20,
          color: 'rgba(40,35,29,0.62)',
          letterSpacing: '-0.015em',
        }}
      >
        {title}
      </p>

      {/* Everything below shares one left edge and sits in the free area under
          the title, centred in it. */}
      <div className="flex min-h-0 flex-1 flex-col justify-center pb-1">
        <p
          className="draw-in font-mono text-[9px] font-bold uppercase tracking-[0.12em]"
          style={{ ...drawDelay(160), color: '#6B6258' }}
        >
          Выполнено только
        </p>

        <p
          className="draw-in mt-1 font-semibold leading-none"
          style={{
            ...drawDelay(200),
            fontSize: 36,
            letterSpacing: '-0.03em',
            color: '#28231D',
            fontVariantNumeric: 'lining-nums tabular-nums',
          }}
        >
          {done}
          <span
            className="mx-2 text-[22px] font-medium"
            style={{ color: 'rgba(40,35,29,0.5)', letterSpacing: 0 }}
          >
            из
          </span>
          {target}
        </p>

        {/* Recessed track; the lit part is the share the slot will be filled to. */}
        <div
          className="draw-in mt-4 h-[14px] overflow-hidden rounded-full"
          style={{
            ...drawDelay(250),
            background: 'rgba(60,45,30,0.09)',
            boxShadow:
              'inset 0 2px 4px rgba(40,28,16,0.26), inset 0 -1px 0 rgba(255,255,255,0.75)',
          }}
          role="img"
          aria-label={`Выполнено ${done} из ${target}`}
        >
          <div
            className="h-full origin-left rounded-full"
            style={{
              transform: `scaleX(${share})`,
              backgroundColor: palette.glow,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
            }}
          />
        </div>

        <p
          className="draw-in mt-5 text-[16px] font-medium leading-[1.3]"
          style={{ ...drawDelay(300), color: 'rgba(40,35,29,0.8)' }}
        >
          Всё равно завершить серию?
        </p>

        <div className="mt-4 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onConfirm}
            onTouchStart={() => undefined}
            className="etched-action etched-action--compact draw-in"
            style={{ ...drawDelay(350), ...glowStyle }}
          >
            <span className="etched-action__text">Завершить</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            onTouchStart={() => undefined}
            className="etched-action etched-action--compact draw-in"
            style={{ ...drawDelay(420), ...glowStyle }}
          >
            <span className="etched-action__text">Вернуться</span>
          </button>
        </div>
      </div>
    </div>
  );
};
