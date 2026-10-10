import React from 'react';

interface CouponSpikeProps {
  /** Paper colours of the coupons torn off today, newest first. */
  slipPapers: string[];
  /** Changes every time a coupon lands on the spike; replays the bump. */
  bumpKey: number;
  onOpen: () => void;
  style?: React.CSSProperties;
}

const MAX_SLIPS = 6;
// Each slip sits a little higher on the needle and is skewed its own way.
const SLIP_TILTS = [-12, 9, -5, 14, -9, 6];

/**
 * A receipt spike standing on the table, opposite the waste basket. Every
 * coupon torn off today is speared on it in its card's colour, so the day's
 * work piles up visibly; pressing it opens the archive.
 * `data-coupon-spike` lets the flying coupon aim at it.
 */
export const CouponSpike: React.FC<CouponSpikeProps> = ({
  slipPapers,
  bumpKey,
  onOpen,
  style,
}) => {
  const count = slipPapers.length;
  const slips = slipPapers.slice(0, MAX_SLIPS).reverse();

  return (
    <button
      type="button"
      data-coupon-spike=""
      onClick={onOpen}
      onTouchStart={() => undefined}
      aria-label={
        count > 0
          ? `Сегодня выполнено: ${count}. Открыть архив`
          : 'Сегодня ещё ничего. Открыть архив'
      }
      title="Сделано сегодня"
      className="trash-bin absolute z-30 h-12 w-10 cursor-pointer border-0 bg-transparent p-0 sm:h-[58px] sm:w-12"
      style={style}
    >
      <span
        key={bumpKey}
        className={`block h-full w-full${bumpKey > 0 ? ' trash-bump' : ''}`}
      >
        <svg
          viewBox="0 0 56 66"
          className="h-full w-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="spike-base" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#4a3726" />
              <stop offset="0.5" stopColor="#7b5f43" />
              <stop offset="1" stopColor="#3f2f21" />
            </linearGradient>
          </defs>

          {/* Contact shadow on the table. */}
          <ellipse cx="28" cy="62.5" rx="19" ry="3" fill="rgba(0,0,0,0.42)" />

          {/* Wooden foot. */}
          <path d="M 10 55 L 10 59 Q 28 65 46 59 L 46 55 Z" fill="url(#spike-base)" />
          <ellipse cx="28" cy="55" rx="18" ry="5" fill="#8a6c4e" />
          <ellipse cx="28" cy="55" rx="18" ry="5" fill="none" stroke="rgba(255,240,220,0.25)" />

          {/* Coupons speared on the needle, oldest at the bottom. */}
          {slips.map((paper, index) => {
            const y = 49 - index * 5.5;

            return (
              <g key={`${index}-${paper}`} transform={`rotate(${SLIP_TILTS[index]} 28 ${y})`}>
                <rect
                  x="13"
                  y={y - 4}
                  width="30"
                  height="8"
                  rx="1.5"
                  fill={paper}
                  stroke="rgba(40,30,20,0.35)"
                  strokeWidth="0.6"
                />
                <rect
                  x="14.2"
                  y={y - 2.8}
                  width="27.6"
                  height="5.6"
                  rx="1"
                  fill="none"
                  stroke="rgba(40,30,20,0.4)"
                  strokeWidth="0.5"
                  strokeDasharray="1.6 1.2"
                />
              </g>
            );
          })}

          {/* The needle, piercing everything. */}
          <line x1="28" y1="54" x2="28" y2="9" stroke="#c9c2b6" strokeWidth="2" strokeLinecap="round" />
          <line x1="28.7" y1="53" x2="28.7" y2="11" stroke="rgba(255,255,255,0.55)" strokeWidth="0.6" />
          <path d="M 27 9.5 L 28 5 L 29 9.5 Z" fill="#c9c2b6" />

          {count > 0 && (
            <g>
              <circle cx="46" cy="46" r="7.5" fill="#F7F2E8" stroke="rgba(60,45,30,0.35)" />
              <text
                x="46"
                y="49.2"
                textAnchor="middle"
                fontSize="9"
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
    </button>
  );
};
