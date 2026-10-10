import React from 'react';

import baizeTexture from '../../assets/baize.webp';

/** The cloth itself: a seamless tile drawn at twice its size (1024 px shown at 512), so it stays fine-grained on dense screens. */
const BAIZE_STYLE: React.CSSProperties = {
  backgroundColor: '#1f3e30',
  backgroundImage: `url(${baizeTexture})`,
  backgroundSize: '512px 512px',
  backgroundRepeat: 'repeat',
};

interface TableSurfaceProps {
  /** Lamp light, a darker corner fall-off and a thin leather rim. */
  isFull?: boolean;
}

/**
 * The table: dark green baize, uneven and not too even, a little lighter
 * under the lamp in the middle and darker toward the edges, with a barely
 * visible leather rim at the edge of the screen.
 */
export const TableSurface: React.FC<TableSurfaceProps> = ({
  isFull = true,
}) => (
  <>
    <div className="absolute inset-0" style={BAIZE_STYLE} />

    {isFull ? (
      <>
        {/* The pool of light under the stack, and the edges falling away. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              radial-gradient(
                ellipse 60% 52% at 50% 46%,
                rgba(176,222,190,0.16) 0%,
                rgba(176,222,190,0.05) 55%,
                transparent 80%
              ),
              radial-gradient(
                ellipse 100% 90% at 50% 48%,
                transparent 42%,
                rgba(0,12,6,0.6) 100%
              ),
              rgba(0,10,5,0.2)
            `,
          }}
        />

        {/* A thin leather rim along the screen edge. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            border: 'clamp(3px, 0.55vw, 6px) solid #2b1d14',
            boxShadow:
              'inset 0 0 0 1px rgba(255,226,190,0.07), inset 0 0 26px rgba(0,0,0,0.5)',
          }}
          aria-hidden="true"
        />
      </>
    ) : (
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundColor: 'rgba(0,12,6,0.32)' }}
      />
    )}
  </>
);
