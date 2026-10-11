import React from 'react';

import binImage from '../../assets/bin.png';

interface TrashBinProps {
  count: number;
  /** Changes every time a card lands in the bin; replays the little bump. */
  bumpKey: number;
  onOpen: () => void;
  style?: React.CSSProperties;
}

// The picture is 243 x 300 units. Crumpled paper balls peek out of the mouth,
// above the front rim, up to three of them.
const BALLS = [
  { cx: 92, cy: 48, r: 21 },
  { cx: 150, cy: 44, r: 22 },
  { cx: 121, cy: 30, r: 17 },
];

/**
 * The waste-paper basket standing on the table. Thrown-away cards fly into it
 * and it fills with crumpled paper; pressing it opens what is inside.
 * `data-trash-bin` lets the throw animation aim at it.
 */
export const TrashBin: React.FC<TrashBinProps> = ({
  count,
  bumpKey,
  onOpen,
  style,
}) => (
  <button
    type="button"
    data-trash-bin=""
    onClick={onOpen}
    onTouchStart={() => undefined}
    aria-label={count > 0 ? `Корзина: ${count}` : 'Корзина пуста'}
    title="Корзина"
    className="trash-bin absolute z-30 h-[68px] w-[55px] cursor-pointer border-0 bg-transparent p-0 sm:h-[78px] sm:w-[63px]"
    style={style}
  >
    <span
      key={bumpKey}
      className={`block h-full w-full${bumpKey > 0 ? ' trash-bump' : ''}`}
    >
      <svg
        viewBox="0 0 243 300"
        className="h-full w-full overflow-visible"
        aria-hidden="true"
      >
        {/* Contact shadow on the table. */}
        <ellipse cx="121" cy="292" rx="88" ry="12" fill="rgba(0,0,0,0.4)" />

        <image href={binImage} x="0" y="0" width="243" height="300" />

        {BALLS.slice(0, Math.min(count, BALLS.length)).map((ball) => (
          <g key={`${ball.cx}-${ball.cy}`}>
            <circle
              cx={ball.cx}
              cy={ball.cy}
              r={ball.r}
              fill="#EFE6D6"
              stroke="rgba(90,70,50,0.4)"
              strokeWidth="2.4"
            />
            <path
              d={`M ${ball.cx - ball.r * 0.6} ${ball.cy - 3} l ${ball.r * 0.5} ${ball.r * 0.4} l ${ball.r * 0.3} -${ball.r * 0.7} l ${ball.r * 0.5} ${ball.r * 0.5}`}
              fill="none"
              stroke="rgba(90,70,50,0.45)"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
          </g>
        ))}

        {count > 0 && (
          <g>
            <circle cx="205" cy="246" r="34" fill="#F7F2E8" stroke="rgba(60,45,30,0.4)" strokeWidth="2.5" />
            <text
              x="205"
              y="259"
              textAnchor="middle"
              fontSize="38"
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
