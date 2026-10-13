import React from 'react';

interface EmbossedArrowProps {
  direction: 'left' | 'right';
  /** Height of the arrow: a CSS size, by default a little more than the text. */
  size?: number | string;
  /**
   * `pressed`: pressed into paper like the lettering (a light edge below, a
   * dark one above); `lit`: lit lettering on the cloth, with a warm glow.
   */
  tone?: 'pressed' | 'lit';
  className?: string;
}

/**
 * The one arrow of the app ("back", "forward", pages, steppers). It is drawn
 * like the lettering that stands next to it, so it takes the colour of the
 * text it is in (`currentColor`) and is pressed into the paper under the same
 * lamp: a light edge on the lower side, a dark one above.
 */
export const EmbossedArrow: React.FC<EmbossedArrowProps> = ({
  direction,
  size = '1.05em',
  tone = 'pressed',
  className = '',
}) => {
  const shape = 'M3.5 8H20M14.2 2.4L20 8l-5.8 5.6';
  const mirror = direction === 'left' ? 'translate(24 0) scale(-1 1)' : undefined;

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 16"
      className={`inline-block shrink-0 ${className}`}
      style={{
        height: size,
        width: `calc(${typeof size === 'number' ? `${size}px` : size} * 1.5)`,
        verticalAlign: '-0.16em',
        overflow: 'visible',
        filter:
          tone === 'lit'
            ? 'drop-shadow(0 0 3px rgba(255,214,120,0.75))'
            : undefined,
      }}
    >
      <g transform={mirror}>
        {tone === 'pressed' && (
          <>
            <path
              d={shape}
              transform="translate(0 0.9)"
              fill="none"
              stroke="rgba(255,255,255,0.85)"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={shape}
              transform="translate(0 -0.7)"
              fill="none"
              stroke="rgba(30,20,10,0.5)"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}
        <path
          d={shape}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={tone === 'pressed' ? 0.78 : 1}
        />
      </g>
    </svg>
  );
};
