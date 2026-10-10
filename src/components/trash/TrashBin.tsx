import React from 'react';

interface TrashBinProps {
  count: number;
  /** Changes every time a card lands in the bin; replays the little bump. */
  bumpKey: number;
  onOpen: () => void;
  style?: React.CSSProperties;
}

// Crumpled paper balls peeking over the rim, up to three of them.
const BALLS = [
  { cx: 21, cy: 11, r: 7 },
  { cx: 34, cy: 9.5, r: 7.5 },
  { cx: 27.5, cy: 5.5, r: 5.5 },
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
    className="trash-bin absolute z-30 h-11 w-10 cursor-pointer border-0 bg-transparent p-0 sm:h-[52px] sm:w-12"
    style={style}
  >
    <span
      key={bumpKey}
      className={`block h-full w-full${bumpKey > 0 ? ' trash-bump' : ''}`}
    >
      <svg
        viewBox="0 0 56 62"
        className="h-full w-full overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="trash-body" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#3b2e22" />
            <stop offset="0.45" stopColor="#6e5843" />
            <stop offset="1" stopColor="#34291f" />
          </linearGradient>
        </defs>

        {/* Contact shadow on the table. */}
        <ellipse cx="28" cy="58.5" rx="20" ry="3" fill="rgba(0,0,0,0.42)" />

        {/* Inside of the basket. */}
        <ellipse cx="28" cy="13" rx="23" ry="5.5" fill="#1f1812" />

        {BALLS.slice(0, Math.min(count, BALLS.length)).map((ball) => (
          <g key={`${ball.cx}-${ball.cy}`}>
            <circle
              cx={ball.cx}
              cy={ball.cy}
              r={ball.r}
              fill="#EFE6D6"
              stroke="rgba(90,70,50,0.35)"
              strokeWidth="0.8"
            />
            <path
              d={`M ${ball.cx - ball.r * 0.6} ${ball.cy - 1} l ${ball.r * 0.5} ${ball.r * 0.4} l ${ball.r * 0.3} -${ball.r * 0.7} l ${ball.r * 0.5} ${ball.r * 0.5}`}
              fill="none"
              stroke="rgba(90,70,50,0.4)"
              strokeWidth="0.8"
              strokeLinejoin="round"
            />
          </g>
        ))}

        {/* Woven body, narrowing towards the floor. */}
        <path d="M 5 13 L 51 13 L 45 55 Q 28 58.5 11 55 Z" fill="url(#trash-body)" />
        {[10, 16, 22, 28, 34, 40, 46].map((x) => (
          <line
            key={x}
            x1={x}
            y1="14"
            x2={28 + (x - 28) * 0.74}
            y2="56"
            stroke="rgba(0,0,0,0.28)"
            strokeWidth="1"
          />
        ))}
        <path
          d="M 7.5 30 Q 28 33 48.5 30 M 9.5 44 Q 28 47 46.5 44"
          fill="none"
          stroke="rgba(255,240,220,0.12)"
          strokeWidth="1.2"
        />

        {/* Front lip of the rim catching the light. */}
        <path
          d="M 5 13 Q 28 21 51 13"
          fill="none"
          stroke="#9a8065"
          strokeWidth="2.4"
          strokeLinecap="round"
        />

        {count > 0 && (
          <g>
            <circle cx="47" cy="47" r="7.5" fill="#F7F2E8" stroke="rgba(60,45,30,0.35)" />
            <text
              x="47"
              y="50.2"
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
