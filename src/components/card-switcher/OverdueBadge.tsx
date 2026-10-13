import React from 'react';

import { STAMP_RED } from '../../app/stampRed';

interface OverdueBadgeProps {
  count: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * The count of what is overdue, as a flat red capsule with a white number in
 * the corner of a deck's tab (the badge every phone user already reads).
 */
export const OverdueBadge: React.FC<OverdueBadgeProps> = ({
  count,
  className = '',
  style,
}) => {
  if (count <= 0) {
    return null;
  }

  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-full px-[5px] font-bold leading-none tabular-nums ${className}`}
      style={{
        backgroundColor: STAMP_RED,
        color: '#FFFFFF',
        fontSize: 11,
        letterSpacing: '0.01em',
        boxShadow:
          '0 0 0 1.5px rgba(255,250,240,0.9), 0 1px 3px rgba(40,12,8,0.4)',
        ...style,
      }}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};
