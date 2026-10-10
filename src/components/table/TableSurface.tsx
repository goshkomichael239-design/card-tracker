import React from 'react';

/**
 * The cloth is drawn by the browser itself from two vector noise tiles
 * (SVG turbulence), not from a picture: it is re-drawn at the screen's own
 * density, so it never shows pixels or compression blocks at any scale.
 *
 * - grain: fine, slightly stretched pile, a quiet green with small variation;
 * - mottle: broad, soft, uneven tone laid over it.
 */
const svgUrl = (markup: string): string =>
  `url("data:image/svg+xml,${encodeURIComponent(markup)}")`;

const GRAIN_TILE = 400;
const MOTTLE_TILE = 1100;

const GRAIN = svgUrl(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${GRAIN_TILE}" height="${GRAIN_TILE}">
    <filter id="g" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.1 0.065" numOctaves="4" seed="7" stitchTiles="stitch"/>
      <feColorMatrix type="matrix" values="
        0.08 0 0 0 0.08
        0.095 0 0 0 0.1925
        0.075 0 0 0 0.1525
        0 0 0 0 1"/>
    </filter>
    <rect width="100%" height="100%" filter="url(#g)"/>
  </svg>`,
);

const MOTTLE = svgUrl(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${MOTTLE_TILE}" height="${MOTTLE_TILE}">
    <filter id="m" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.0045" numOctaves="3" seed="21" stitchTiles="stitch"/>
      <feColorMatrix type="matrix" values="
        0 0 0 0 0
        0 0 0 0 0.04
        0 0 0 0 0.02
        0.55 0 0 0 -0.2"/>
    </filter>
    <rect width="100%" height="100%" filter="url(#m)"/>
  </svg>`,
);

const BAIZE_STYLE: React.CSSProperties = {
  backgroundColor: '#1f3e30',
  backgroundImage: `${MOTTLE}, ${GRAIN}`,
  backgroundSize: `${MOTTLE_TILE}px ${MOTTLE_TILE}px, ${GRAIN_TILE}px ${GRAIN_TILE}px`,
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
