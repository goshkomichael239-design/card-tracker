import React from 'react';

import cardboardTexture from '../../assets/cardboard.avif';

/** Size of the folded corner and the clip that removes it from the card body. */
export const FOLD_SIZE = 46;
export const FOLD_CUT_PATH = `polygon(0 0, calc(100% - ${FOLD_SIZE}px) 0, 100% ${FOLD_SIZE}px, 100% 100%, 0 100%)`;

/**
 * The flap lying on the card where the corner is folded: the cut-off corner,
 * mirrored across the crease. Shared by the cards and the new-card form, so
 * all of them have the same corner.
 */
export const FoldedFlap: React.FC<{ lifted: boolean; paperTint: string }> = ({
  lifted,
  paperTint,
}) => (
  <span
    className="absolute right-0 top-0 block"
    style={{
      width: FOLD_SIZE,
      height: FOLD_SIZE,
      filter: lifted
        ? 'drop-shadow(-2px 4px 3.5px rgba(38,27,16,0.5))'
        : 'drop-shadow(-1px 2px 2px rgba(38,27,16,0.36))',
      transition: 'filter 160ms ease-out',
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
  </span>
);
