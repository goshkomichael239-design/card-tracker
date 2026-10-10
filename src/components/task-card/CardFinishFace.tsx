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
 * slots as the actions face. The track shows how full the coupon will be when
 * it tears off.
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
          ...drawDelay(120),
          fontSize: 20,
          color: 'rgba(40,35,29,0.62)',
          letterSpacing: '-0.015em',
        }}
      >
        {title}
      </p>

      <div
        className="absolute left-0 right-0"
        style={{ top: '45%', transform: 'translateY(-50%)' }}
      >
        <p
          className="draw-in text-[15px] leading-[1.45]"
          style={{ ...drawDelay(180), color: 'rgba(40,35,29,0.78)' }}
        >
          Выполнено только{' '}
          <strong className="font-bold" style={{ color: palette.accentDark }}>
            {done} из {target}
          </strong>
          . Всё равно завершить серию?
        </p>

        {/* Recessed track; the lit part is the share the coupon is filled to. */}
        <div
          className="draw-in mt-4 h-[14px] overflow-hidden rounded-full"
          style={{
            ...drawDelay(240),
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

        <div className="mt-5 flex flex-col gap-3">
          <button
            type="button"
            onClick={onConfirm}
            onTouchStart={() => undefined}
            className="etched-action draw-in"
            style={{ ...drawDelay(300), ...glowStyle }}
          >
            <span className="etched-action__text">Завершить</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            onTouchStart={() => undefined}
            className="etched-action draw-in"
            style={{ ...drawDelay(380), ...glowStyle }}
          >
            <span className="etched-action__text">Вернуться</span>
          </button>
        </div>
      </div>
    </div>
  );
};
