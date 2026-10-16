import React from 'react';

import spikeImage from '../../assets/spike.png';
import {
  buildCouponEdge,
  piecePath,
  tearLinesPath,
} from '../../app/couponEdge';
import { t } from '../../app/i18n';

export interface SpikeSlip {
  /** The paper colour of the card it was torn from. */
  paper: string;
  /** What its torn edge is drawn from (the same as the coupon's own). */
  seed: string;
}

interface CouponSpikeProps {
  /** The coupons torn off today, newest first. */
  slips: SpikeSlip[];
  /** Changes every time a coupon lands on the spike; replays the bump. */
  bumpKey: number;
  /** Height of the picture in px. */
  pictureHeight: number;
  style?: React.CSSProperties;
}

const MAX_SLIPS = 6;
// Each slip sits a little higher on the needle and is skewed its own way.
const SLIP_TILTS = [-9, 7, -4, 10, -7, 5];

// The picture is 224 x 460 units; the needle stands at x = 112 and its stand
// (the brass foot) tops out near y = 268.
const NEEDLE_X = 112;
const FIRST_SLIP_Y = 252;
const SLIP_STEP = 24;
const SLIP_WIDTH = 150;
const SLIP_HEIGHT = 36;
// A slip's perforation, in the picture's units (bigger than on the card, so it
// reads when the whole picture is small).
const SLIP_HOLE = 6.2;
const SLIP_PITCH = 13;
const SLIP_CORNER = 5;
// The middle of the stand's foot (a disc seen at a slant: its lower edge is an
// arc reaching to the bottom of the picture), and how deep its reflection in
// the stone reaches. Shadow and reflection belong to the whole disc.
const FOOT_Y = 436;
const REFLECTION_DEPTH = 120;

/**
 * A brass receipt spike standing on the table, opposite the waste basket.
 * Every coupon torn off today is speared on it in its card's colour, so the
 * day's work piles up visibly. It stands in the archive bar's right end and
 * takes no presses itself: the bar under it opens the archive.
 * `data-coupon-spike` lets the flying coupon aim at it.
 */
export const CouponSpike: React.FC<CouponSpikeProps> = ({
  slips: allSlips,
  bumpKey,
  pictureHeight,
  style,
}) => {
  const count = allSlips.length;
  const slips = allSlips.slice(0, MAX_SLIPS).reverse();

  return (
    <div
      data-coupon-spike=""
      role="img"
      aria-label={
        count > 0 ? t('Сегодня выполнено: {count}', { count }) : t('Сегодня ещё ничего')
      }
      className="trash-bin pointer-events-none absolute z-[35]"
      style={{
        height: pictureHeight,
        width: (pictureHeight * 224) / 460,
        ...style,
      }}
    >
      <span
        key={bumpKey}
        className={`block h-full w-full${bumpKey > 0 ? ' trash-bump' : ''}`}
      >
        <svg
          viewBox="0 0 224 460"
          className="h-full w-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <filter id="spike-soft" x="-30%" y="-200%" width="160%" height="500%">
              <feGaussianBlur stdDeviation="9" />
            </filter>
            <filter id="spike-tight" x="-30%" y="-300%" width="160%" height="700%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
            <linearGradient id="spike-fade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <mask id="spike-reflection-mask">
              <rect
                x="-20"
                y={FOOT_Y}
                width="264"
                height={REFLECTION_DEPTH}
                fill="url(#spike-fade)"
              />
            </mask>
          </defs>

          {/* Cast shadow: long, soft, falling to the right. */}
          <ellipse
            cx="164"
            cy={FOOT_Y + 8}
            rx="134"
            ry="24"
            fill="rgba(40,30,20,0.3)"
            filter="url(#spike-soft)"
          />

          {/* Reflection in the polished stone. */}
          <g mask="url(#spike-reflection-mask)" opacity="0.3">
            <g transform={`translate(0 ${FOOT_Y * 2}) scale(1 -1)`}>
              <image href={spikeImage} x="0" y="0" width="224" height="460" />
            </g>
          </g>

          {/* Contact shadow: dark and tight under the wooden foot. */}
          <ellipse
            cx="112"
            cy={FOOT_Y + 3}
            rx="124"
            ry="29"
            fill="rgba(10,6,2,0.62)"
            filter="url(#spike-tight)"
          />

          <image href={spikeImage} x="0" y="0" width="224" height="460" />

          {/* Coupons speared on the needle, oldest at the bottom. */}
          {slips.map(({ paper, seed }, index) => {
            const y = FIRST_SLIP_Y - index * SLIP_STEP;
            const edge = buildCouponEdge({
              width: SLIP_WIDTH,
              height: SLIP_HEIGHT,
              radius: SLIP_CORNER,
              hole: SLIP_HOLE,
              pitch: SLIP_PITCH,
              seed,
            });

            return (
              <g
                key={`${index}-${seed}`}
                transform={`rotate(${SLIP_TILTS[index]} ${NEEDLE_X} ${y})`}
              >
                <g
                  transform={`translate(${NEEDLE_X - SLIP_WIDTH / 2} ${y - SLIP_HEIGHT / 2})`}
                >
                  {/* the slip: a piece of the sheet with its torn rim */}
                  <path
                    d={piecePath(edge)}
                    fill={paper}
                    stroke="rgba(40,30,20,0.45)"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />
                  <path
                    d={tearLinesPath(edge)}
                    fill="none"
                    stroke="rgba(255,251,238,0.9)"
                    strokeWidth="1.1"
                    strokeLinecap="round"
                  />
                </g>
              </g>
            );
          })}

          {count > 0 && (
            <g>
              <circle cx="176" cy="392" r="58" fill="#F7F2E8" stroke="rgba(60,45,30,0.4)" strokeWidth="2.5" />
              <text
                x="176"
                y="414"
                textAnchor="middle"
                fontSize="72"
                fontWeight="700"
                fill="#3F3932"
                fontFamily="Lora, Georgia, serif"
              >
                {count > 99 ? '99' : count}
              </text>
            </g>
          )}
        </svg>
      </span>
    </div>
  );
};
