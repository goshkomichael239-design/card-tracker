import React from 'react';

import bin0 from '../../assets/bin-new-0.png';
import bin1 from '../../assets/bin-new-1.png';
import bin2 from '../../assets/bin-new-2.png';
import bin3 from '../../assets/bin-new-3.png';

interface TrashBinProps {
  count: number;
  /** Changes every time a card lands in the bin; replays the little bump. */
  bumpKey: number;
  onOpen: () => void;
  /** Height of the picture in px. */
  pictureHeight: number;
  /** How far above the bottom of the touch box the basket's foot stands. */
  floor: number;
  style?: React.CSSProperties;
}

// The picture is 257 x 300 units. One picture per number of papers in the
// basket: empty, one, two, three; the four-or-more picture is still to
// come, until then three stands for "three or more".
const BIN_IMAGES = [bin0, bin1, bin2, bin3, bin3];
const PICTURE_W = 257;
const WIDTH_RATIO = PICTURE_W / 300;
// How deep the reflection in the marble reaches below the foot, in units.
const REFLECTION_DEPTH = 80;

/**
 * The waste-paper basket standing on the archive bar's marble, at its left
 * end. Thrown-away cards fly into it and it fills with crumpled paper;
 * pressing it opens what is inside. It stands on a contact shadow, throws a
 * long soft one to the right (the light is at the top left) and is mirrored
 * faintly in the polished stone. The touch box is wider than the picture and
 * taller than the bar, so a press near the basket never opens the archive.
 * `data-trash-bin` lets the throw animation aim at the picture.
 */
export const TrashBin: React.FC<TrashBinProps> = ({
  count,
  bumpKey,
  onOpen,
  pictureHeight,
  floor,
  style,
}) => {
  const pictureWidth = pictureHeight * WIDTH_RATIO;
  const shown = Math.min(count, BIN_IMAGES.length - 1);

  return (
    <button
      type="button"
      onClick={onOpen}
      onTouchStart={() => undefined}
      aria-label={count > 0 ? `Корзина: ${count}` : 'Корзина пуста'}
      title="Корзина"
      className="absolute z-[35] cursor-pointer border-0 bg-transparent p-0"
      style={style}
    >
      <span
        key={bumpKey}
        data-trash-bin=""
        className={`trash-bin absolute block${bumpKey > 0 ? ' trash-bump' : ''}`}
        style={{
          height: pictureHeight,
          width: pictureWidth,
          left: '50%',
          marginLeft: -pictureWidth / 2,
          bottom: floor,
        }}
      >
        <svg
          viewBox="0 0 257 300"
          className="h-full w-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <filter id="bin-soft" x="-30%" y="-200%" width="160%" height="500%">
              <feGaussianBlur stdDeviation="7" />
            </filter>
            <filter id="bin-tight" x="-30%" y="-300%" width="160%" height="700%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
            <linearGradient id="bin-fade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <mask id="bin-reflection-mask">
              <rect
                x="0"
                y="300"
                width="257"
                height={REFLECTION_DEPTH}
                fill="url(#bin-fade)"
              />
            </mask>
          </defs>

          {/* Cast shadow: long, soft, falling to the right. */}
          <ellipse
            cx="178"
            cy="296"
            rx="118"
            ry="15"
            fill="rgba(40,30,20,0.3)"
            filter="url(#bin-soft)"
          />

          {/* Reflection in the polished stone, fading within a short way. */}
          <g mask="url(#bin-reflection-mask)" opacity="0.32">
            <g transform="translate(0 600) scale(1 -1)">
              <image
                href={BIN_IMAGES[shown]}
                x="0"
                y="0"
                width="257"
                height="300"
              />
            </g>
          </g>

          {/* Contact shadow: dark and tight where it touches. */}
          <ellipse
            cx="128"
            cy="297"
            rx="84"
            ry="8"
            fill="rgba(10,6,2,0.62)"
            filter="url(#bin-tight)"
          />

          {/* All the pictures stay loaded; the one for the count shows. */}
          {BIN_IMAGES.map((image, index) => (
            <image
              key={index}
              href={image}
              x="0"
              y="0"
              width="257"
              height="300"
              opacity={index === shown ? 1 : 0}
            />
          ))}

          {count > 0 && (
            <g>
              <circle cx="216" cy="244" r="46" fill="#F7F2E8" stroke="rgba(60,45,30,0.45)" strokeWidth="3" />
              <text
                x="216"
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
};
