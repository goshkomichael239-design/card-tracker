import React from 'react';

import cardboardTexture from '../../assets/cardboard.svg';

/** Size of the folded corner and the clip that removes it from the card body. */
export const FOLD_SIZE = 46;
export const FOLD_CUT_PATH = `polygon(0 0, calc(100% - ${FOLD_SIZE}px) 0, 100% ${FOLD_SIZE}px, 100% 100%, 0 100%)`;

/**
 * The flap lying on the card where the corner is folded: the cut-off corner,
 * mirrored across the crease. Shared by the cards and the new-card form, so
 * all of them have the same corner.
 */
// The "edit" pencil glyph (Material, 24 x 24), tip at the lower left.
const PENCIL_PATH =
  'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 000-1.41l-2.34-2.34a.996.996 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z';

export const FoldedFlap: React.FC<{
  lifted: boolean;
  paperTint: string;
  /** A pencil pressed into the flap: this corner is the way to edit. */
  showPencil?: boolean;
}> = ({ lifted, paperTint, showPencil = false }) => (
  <span
    className="absolute right-0 top-0 block"
    style={{
      width: FOLD_SIZE,
      height: FOLD_SIZE,
      filter: lifted
        ? 'drop-shadow(-2px 4px 3.5px rgba(38,27,16,0.5))'
        : 'drop-shadow(-1px 2px 2px rgba(38,27,16,0.36))',
      transition: 'filter 240ms ease-out',
    }}
  >
    <span
      className="absolute inset-0 block"
      style={{
        clipPath: 'polygon(0 0, 100% 100%, 0 100%)',
        backgroundColor: paperTint,
        backgroundImage: `linear-gradient(to bottom left, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 50%, rgba(70,55,38,0.3) 100%), url(${cardboardTexture})`,
        backgroundSize: '100% 100%, cover',
        backgroundBlendMode: 'normal, multiply',
      }}
    />
    {showPencil && (
      <svg
        viewBox="0 0 24 24"
        width="17"
        height="17"
        aria-hidden="true"
        className="absolute"
        style={{ left: 6, top: 22, overflow: 'visible' }}
      >
        {/* Blind embossing: a lit edge below, a shaded edge above. */}
        <path d={PENCIL_PATH} fill="rgba(255,255,255,0.95)" transform="translate(0.9 0.9)" />
        <path d={PENCIL_PATH} fill="rgba(70,52,34,0.55)" transform="translate(-0.6 -0.6)" />
        <path d={PENCIL_PATH} fill="rgba(176,156,126,0.55)" />
      </svg>
    )}
  </span>
);
