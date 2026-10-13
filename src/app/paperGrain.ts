/**
 * The fine tooth of paper, drawn by the browser at the screen's own density
 * (an SVG noise tile): it stays sharp on any display, where a photographed
 * texture of a fixed size goes soft when it is enlarged. Laid over the paper
 * with "multiply" at a low opacity.
 */
export const PAPER_GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240">
    <filter id="g" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.62 0.9" numOctaves="2" seed="7" stitchTiles="stitch"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.36  0 0 0 0 0.29  0 0 0 0 0.2  0.9 0.9 0.9 0 -0.95"/>
    </filter>
    <rect width="100%" height="100%" filter="url(#g)"/>
  </svg>`,
)}")`;
