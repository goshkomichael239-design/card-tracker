import React from 'react';

import bin0 from '../../assets/bin.png';
import bin1 from '../../assets/bin-1.png';
import bin2 from '../../assets/bin-2.png';
import bin3 from '../../assets/bin-3.png';
import bin4 from '../../assets/bin-4.png';

interface TrashBinProps {
  count: number;
  /** Changes every time a card lands in the bin; replays the little bump. */
  bumpKey: number;
  onOpen: () => void;
  /** Height of the picture in px; the touch box is wider and as tall as the bar. */
  pictureHeight: number;
  style?: React.CSSProperties;
}

// The picture is 244 x 300 units. One picture per number of papers in the
// basket: empty, one, two, three, four or more.
const BIN_IMAGES = [bin0, bin1, bin2, bin3, bin4];

/**
 * The waste-paper basket standing in the archive bar's left end. Thrown-away
 * cards fly into it and it fills with crumpled paper; pressing it opens what
 * is inside. The touch box is wider than the picture and sits above the bar,
 * so a press near the basket does not open the archive by mistake.
 * `data-trash-bin` lets the throw animation aim at the picture.
 */
export const TrashBin: React.FC<TrashBinProps> = ({
  count,
  bumpKey,
  onOpen,
  pictureHeight,
  style,
}) => (
  <button
    type="button"
    onClick={onOpen}
    onTouchStart={() => undefined}
    aria-label={count > 0 ? `Корзина: ${count}` : 'Корзина пуста'}
    title="Корзина"
    className="absolute z-[35] flex cursor-pointer items-center justify-center border-0 bg-transparent p-0"
    style={style}
  >
    <span
      key={bumpKey}
      data-trash-bin=""
      className={`trash-bin block${bumpKey > 0 ? ' trash-bump' : ''}`}
      style={{ height: pictureHeight, width: (pictureHeight * 244) / 300 }}
    >
      <svg
        viewBox="0 0 244 300"
        className="h-full w-full overflow-visible"
        aria-hidden="true"
      >
        {/* Contact shadow on the table. */}
        <ellipse cx="122" cy="292" rx="88" ry="12" fill="rgba(0,0,0,0.4)" />

        {/* All the pictures stay loaded; the one for the count shows. */}
        {BIN_IMAGES.map((image, index) => (
          <image
            key={index}
            href={image}
            x="0"
            y="0"
            width="244"
            height="300"
            opacity={index === Math.min(count, BIN_IMAGES.length - 1) ? 1 : 0}
          />
        ))}

        {count > 0 && (
          <g>
            <circle cx="206" cy="244" r="46" fill="#F7F2E8" stroke="rgba(60,45,30,0.45)" strokeWidth="3" />
            <text
              x="206"
              y="260"
              textAnchor="middle"
              fontSize="52"
              fontWeight="700"
              fill="#3F3932"
              fontFamily="Lora, Georgia, serif"
            >
              {count > 99 ? '99' : count}
            </text>
          </g>
        )}
      </svg>
    </span>
  </button>
);
