import React from 'react';

import { useSettings } from '../../app/settings';

/**
 * The table: clean emerald cloth, lighter under the lamp in the middle and
 * darker toward the edges, with a very fine tooth so the surface does not read
 * as a flat colour. Everything is a gradient or vector noise drawn by the
 * browser at the screen's own density: nothing to blur or pixelate.
 */

// One octave of fine noise, centred on mid-grey so that "soft-light" leaves the
// colour where it is on average and only adds a hair of tooth.
const TOOTH = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
    <filter id="t" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="11" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
    <rect width="100%" height="100%" filter="url(#t)"/>
  </svg>`,
)}")`;

/**
 * The cloth colour, from the lit patch out to the shadowed edge. The lamp
 * hangs up and to the left, so it lights the upper left more, and every
 * object's shadow on the table falls to the lower right.
 */
const CLOTH = `
  radial-gradient(
    ellipse 86% 78% at 42% 34%,
    #0d7a46 0%,
    #0a6a3c 34%,
    #065030 66%,
    #033a21 100%
  )
`;

/** The cloth with the lamp switched off: even, darker only at the very edge. */
const CLOTH_EVEN = `
  radial-gradient(
    ellipse 120% 110% at 50% 50%,
    #08623a 0%,
    #075a35 60%,
    #04412a 100%
  )
`;

interface TableSurfaceProps {
  /** The whole table (lamp, thin rim); false for a plain strip of cloth. */
  isFull?: boolean;
}

export const TableSurface: React.FC<TableSurfaceProps> = ({
  isFull = true,
}) => {
  // "Свет лампы" off: the cloth is lit evenly, with only the dark edge.
  const { values } = useSettings();
  const hasLamp = values.lamp;

  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: '#065030',
          backgroundImage: isFull
            ? hasLamp
              ? CLOTH
              : CLOTH_EVEN
            : 'linear-gradient(180deg, #0a6a3c 0%, #065030 100%)',
        }}
      />

      {/* The tooth of the cloth. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: TOOTH,
          backgroundSize: '256px 256px',
          mixBlendMode: 'soft-light',
          opacity: 0.22,
        }}
        aria-hidden="true"
      />

      {isFull && (
        /* A thin, dark rim along the screen edge. */
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            border: 'clamp(3px, 0.55vw, 6px) solid #1c1410',
            boxShadow:
              'inset 0 0 0 1px rgba(255,226,190,0.06), inset 0 0 28px rgba(0,0,0,0.42)',
          }}
          aria-hidden="true"
        />
      )}
    </>
  );
};
