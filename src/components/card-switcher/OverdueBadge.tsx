import React from 'react';

interface OverdueBadgeProps {
  count: number;
  /** A word after the number, so the dot says what it counts. */
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A red wax dot with a number: how many cards on the table are overdue.
 * It only tells, it does nothing when pressed.
 */
export const OverdueBadge: React.FC<OverdueBadgeProps> = ({
  count,
  label,
  className = '',
  style,
}) => {
  if (count <= 0) {
    return null;
  }

  const description = `Просрочено: ${count}`;

  return (
    <span
      role="img"
      aria-label={description}
      title={description}
      className={`pointer-events-none flex h-[22px] min-w-[22px] items-center justify-center whitespace-nowrap rounded-full font-mono font-bold leading-none tabular-nums ${label ? 'gap-1 px-2.5 text-[11px] uppercase tracking-[0.08em]' : 'px-1.5 text-[12px]'} ${className}`}
      style={{
        color: '#FFF4EC',
        background:
          'radial-gradient(circle at 32% 28%, #E0705F 0%, #B8483A 52%, #8F3025 100%)',
        boxShadow:
          '0 2px 4px rgba(40,12,8,0.45), inset 0 1px 1px rgba(255,200,185,0.6), inset 0 -1px 2px rgba(60,10,5,0.4)',
        textShadow: '0 1px 0 rgba(60,10,5,0.5)',
        ...style,
      }}
    >
      {count}
      {label && <span className="font-semibold">{label}</span>}
    </span>
  );
};
