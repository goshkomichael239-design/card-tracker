import React from 'react';

import spikeImage from '../../assets/spike.png';

interface CouponSpikeProps {
  /** Paper colours of the coupons torn off today, newest first. */
  slipPapers: string[];
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
const SLIP_STEP = 21;
const SLIP_WIDTH = 112;
const SLIP_HEIGHT = 30;

/**
 * A brass receipt spike standing on the table, opposite the waste basket.
 * Every coupon torn off today is speared on it in its card's colour, so the
 * day's work piles up visibly. It stands in the archive bar's right end and
 * takes no presses itself: the bar under it opens the archive.
 * `data-coupon-spike` lets the flying coupon aim at it.
 */
export const CouponSpike: React.FC<CouponSpikeProps> = ({
  slipPapers,
  bumpKey,
  pictureHeight,
  style,
}) => {
  const count = slipPapers.length;
  const slips = slipPapers.slice(0, MAX_SLIPS).reverse();

  return (
    <div
      data-coupon-spike=""
      role="img"
      aria-label={
        count > 0 ? `Сегодня выполнено: ${count}` : 'Сегодня ещё ничего'
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
          {/* Contact shadow on the table. */}
          <ellipse cx="112" cy="448" rx="100" ry="14" fill="rgba(0,0,0,0.42)" />

          <image href={spikeImage} x="0" y="0" width="224" height="460" />

          {/* Coupons speared on the needle, oldest at the bottom. */}
          {slips.map((paper, index) => {
            const y = FIRST_SLIP_Y - index * SLIP_STEP;

            return (
              <g
                key={`${index}-${paper}`}
                transform={`rotate(${SLIP_TILTS[index]} ${NEEDLE_X} ${y})`}
              >
                <rect
                  x={NEEDLE_X - SLIP_WIDTH / 2}
                  y={y - SLIP_HEIGHT / 2}
                  width={SLIP_WIDTH}
                  height={SLIP_HEIGHT}
                  rx="5"
                  fill={paper}
                  stroke="rgba(40,30,20,0.4)"
                  strokeWidth="2"
                />
                <rect
                  x={NEEDLE_X - SLIP_WIDTH / 2 + 5}
                  y={y - SLIP_HEIGHT / 2 + 5}
                  width={SLIP_WIDTH - 10}
                  height={SLIP_HEIGHT - 10}
                  rx="3"
                  fill="none"
                  stroke="rgba(40,30,20,0.4)"
                  strokeWidth="1.8"
                  strokeDasharray="6 4.5"
                />
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
