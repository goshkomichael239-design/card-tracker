import React, { useState } from 'react';

import type { CardPalette } from '../../app/cardTheme';
import {
  formatPostponeMoment,
  getPostponePresets,
} from '../../app/timeOps';
import { DateTimeEditor } from './CardEditFace';
import { CouponButton } from './CouponButton';
import { INITIAL_TASK_CARD_V2_CONFIG } from './taskCardV2Config';

interface CardPostponeFaceProps {
  title: string;
  palette: CardPalette;
  /** Where a custom date starts: the card's current time, or tomorrow morning. */
  initialCustom: Date;
  onPostpone: (until: Date) => void;
  onBack: () => void;
}

const drawDelay = (ms: number): React.CSSProperties =>
  ({ ['--draw-delay' as string]: `${ms}ms` }) as React.CSSProperties;

/**
 * "Put it off": ready-made moments pressed into the card as slots, each with
 * its exact time, plus a custom date on the same steppers as the edit face.
 */
export const CardPostponeFace: React.FC<CardPostponeFaceProps> = ({
  title,
  palette,
  initialCustom,
  onPostpone,
  onBack,
}) => {
  const config = INITIAL_TASK_CARD_V2_CONFIG;
  const [now] = useState(() => new Date());
  const [presets] = useState(() => getPostponePresets(now));
  const [custom, setCustom] = useState<Date | null>(null);
  const glowStyle = {
    ['--etched-glow' as string]: palette.glow,
  } as React.CSSProperties;

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex items-center justify-between">
        <span
          className="rounded-full px-3 py-1.5 font-mono text-[11.5px] font-bold uppercase tracking-[0.12em]"
          style={{ color: palette.accentDark, backgroundColor: `${palette.accent}1d` }}
        >
          Отложить
        </span>
      </div>

      <p
        className="draw-in mt-6 shrink-0 truncate font-semibold leading-[1.15]"
        style={{
          ...drawDelay(100),
          fontSize: 22,
          color: 'rgba(40,35,29,0.62)',
          letterSpacing: '-0.015em',
        }}
      >
        {title}
      </p>

      {custom ? (
        <>
          <DateTimeEditor
            value={custom}
            label="Отложить до"
            palette={palette}
            onChange={setCustom}
          />
          <div
            className="draw-in absolute left-0 right-0 grid grid-cols-[1fr_2fr] gap-2.5"
            style={{
              ...drawDelay(300),
              bottom: config.couponBottom,
              height: config.couponHeight,
            }}
          >
            <CouponButton
              label="Назад"
              color="rgba(40,35,29,0.7)"
              paperTint={palette.paper}
              height={config.couponHeight}
              onClick={() => setCustom(null)}
            />
            <CouponButton
              label="Отложить"
              color={palette.accentDark}
              paperTint={palette.paper}
              height={config.couponHeight}
              disabled={custom.getTime() <= now.getTime()}
              onClick={() => onPostpone(custom)}
            />
          </div>
        </>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {presets.map((preset, index) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onPostpone(preset.until)}
              onTouchStart={() => undefined}
              className="etched-action etched-action--slim draw-in"
              style={{ ...drawDelay(150 + index * 45), ...glowStyle }}
            >
              <span className="etched-action__text">{preset.label}</span>
              <span className="etched-action__hint">
                {formatPostponeMoment(preset.until, now)}
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCustom(initialCustom)}
            onTouchStart={() => undefined}
            className="etched-action etched-action--slim draw-in"
            style={{ ...drawDelay(150 + presets.length * 45), ...glowStyle }}
          >
            <span className="etched-action__text">Другая дата</span>
            <span className="etched-action__hint">›</span>
          </button>
          <button
            type="button"
            onClick={onBack}
            className="draw-in mt-1 self-start border-0 bg-transparent px-1 py-2 font-mono text-[11.5px] font-bold uppercase tracking-[0.12em]"
            style={{ ...drawDelay(200 + presets.length * 45), color: 'rgba(40,35,29,0.5)' }}
          >
            ‹ Назад
          </button>
        </div>
      )}
    </div>
  );
};
