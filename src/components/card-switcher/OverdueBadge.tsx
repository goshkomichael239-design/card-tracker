import React from 'react';

interface OverdueBadgeProps {
  count: number;
  /** A word after the number, so the dot says what it counts. */
  label?: string;
  className?: string;
  style?: React.CSSProperties;
  /** When given, the dot is a button (for instance: go to the next one). */
  onPress?: () => void;
}

/**
 * A red wax dot with a number: how many cards on the table are overdue.
 * Without `onPress` it only tells; with it, pressing the dot acts.
 */
export const OverdueBadge: React.FC<OverdueBadgeProps> = ({
  count,
  label,
  className = '',
  style,
  onPress,
}) => {
  if (count <= 0) {
    return null;
  }

  const description = `Просрочено: ${count}`;
  const Tag = onPress ? 'button' : 'span';

  return (
    <Tag
      {...(onPress
        ? {
            type: 'button' as const,
            onClick: onPress,
            onTouchStart: () => undefined,
          }
        : { role: 'img' })}
      aria-label={onPress ? `${description}. К следующей просроченной` : description}
      title={description}
      className={`${onPress ? 'pointer-events-auto cursor-pointer active:translate-y-px' : 'pointer-events-none'} flex h-[22px] min-w-[22px] items-center justify-center whitespace-nowrap rounded-full font-mono font-bold leading-none tabular-nums ${label ? 'gap-1 px-2.5 text-[11px] uppercase tracking-[0.08em]' : 'px-1.5 text-[12px]'} ${className}`}
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
    </Tag>
  );
};
