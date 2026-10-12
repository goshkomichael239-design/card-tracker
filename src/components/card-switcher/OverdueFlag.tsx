import React from 'react';

import {
  STAMP_RED,
  STAMP_RED_DARK,
  STAMP_RED_LIGHT,
} from '../../app/stampRed';

interface OverdueFlagProps {
  /** Shown inside the flag; leave out for a flag that only marks. */
  count?: number;
  /** Bigger flags carry a number; small ones only mark a row or a tab. */
  size?: 'small' | 'large';
  className?: string;
  style?: React.CSSProperties;
}

const SIZES = {
  small: { width: 9, height: 13 },
  large: { width: 17, height: 23 },
} as const;

/**
 * A red bookmark ribbon with a notched foot, sticking out of the edge of a row
 * or a deck's tab: something in it is overdue. Light from the top-left: a
 * lighter left edge, a darker right one and a small shadow it throws.
 */
export const OverdueFlag: React.FC<OverdueFlagProps> = ({
  count,
  size = 'small',
  className = '',
  style,
}) => {
  const { width, height } = SIZES[size];
  const notch = Math.round(height * 0.2);
  const text = count === undefined ? '' : count > 99 ? '99+' : String(count);

  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none inline-block shrink-0 ${className}`}
      style={{
        width,
        height,
        position: className.includes('absolute') ? undefined : 'relative',
        ...style,
      }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="absolute left-0 top-0 overflow-visible"
      >
        <defs>
          <linearGradient id={`flag-${size}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={STAMP_RED_LIGHT} />
            <stop offset="0.45" stopColor={STAMP_RED} />
            <stop offset="1" stopColor={STAMP_RED_DARK} />
          </linearGradient>
        </defs>
        <path
          d={`M0 0H${width}V${height}L${width / 2} ${height - notch}L0 ${height}Z`}
          fill="rgba(30,12,8,0.35)"
          transform="translate(0.9 1.3)"
          style={{ filter: 'blur(0.7px)' }}
        />
        <path
          d={`M0 0H${width}V${height}L${width / 2} ${height - notch}L0 ${height}Z`}
          fill={`url(#flag-${size})`}
        />
        <path
          d={`M0.5 0V${height - 0.6}`}
          stroke="rgba(255,225,215,0.55)"
          strokeWidth="0.8"
          fill="none"
        />
      </svg>
      {text && (
        <span
          className="absolute left-0 right-0 top-0 flex items-center justify-center font-bold leading-none tabular-nums"
          style={{
            height: height - notch,
            fontSize: text.length > 2 ? 8 : 10.5,
            color: '#FFF4EC',
            textShadow: '0 1px 0 rgba(60,10,5,0.55)',
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
};
