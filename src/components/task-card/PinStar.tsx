import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import clipImage from '../../assets/clip.png';
import { t } from '../../app/i18n';

interface PinStarProps {
  pinned: boolean;
  /** Only the front of the card shows the star; the clip stays on every face. */
  showStar: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

// The star sits at this point of the 40 x 90 drawing, whether it is a loose
// star or the end of the clip, so pressing it never moves it.
const STAR_X = 10;
const STAR_Y = 30;

const starPoints = (radiusOuter: number, radiusInner: number): string => {
  const points: string[] = [];

  for (let index = 0; index < 10; index += 1) {
    const radius = index % 2 === 0 ? radiusOuter : radiusInner;
    const angle = (Math.PI / 5) * index - Math.PI / 2;
    points.push(
      `${(STAR_X + radius * Math.cos(angle)).toFixed(2)},${(STAR_Y + radius * Math.sin(angle)).toFixed(2)}`,
    );
  }

  return points.join(' ');
};

const STAR_POINTS = starPoints(11.5, 5);

/** A star pressed into the paper: the quiet "favourite" mark. */
const StarMark: React.FC = () => (
  <svg
    width="40"
    height="90"
    viewBox="0 0 40 90"
    aria-hidden="true"
    className="pin-star-mark absolute left-0 top-0"
  >
    <polygon
      points={STAR_POINTS}
      fill="rgba(60,45,30,0.06)"
      stroke="rgba(60,45,30,0.5)"
      strokeWidth="1.8"
      strokeLinejoin="round"
      style={{ filter: 'drop-shadow(0 1.2px 0 rgba(255,255,255,0.85))' }}
    />
  </svg>
);

// The clip is the finished picture (src/assets/clip.png), shown as it was
// drawn, with its own star. It is 94 x 300 in the file; its star's centre lies
// at 30.9% of its width and 25.8% of its height. In the 40 x 90 drawing it is
// shown CLIP_HEIGHT tall and placed so that its star stands exactly where the
// card's own star stood: the clip simply takes the star's place.
const CLIP_HEIGHT = 78;
const CLIP_WIDTH = (CLIP_HEIGHT * 94) / 300;
const CLIP_X = STAR_X - 0.309 * CLIP_WIDTH;
const CLIP_Y = STAR_Y - 0.258 * CLIP_HEIGHT;

/**
 * The gold paper clip over the top edge of the card, with the star that is
 * drawn on it. Only a soft and a tight shadow are added, so that it lies on
 * the paper.
 */
const ClipMark: React.FC = () => (
  <svg
    width="40"
    height="90"
    viewBox="0 0 40 90"
    aria-hidden="true"
    className="absolute left-0 top-0"
    style={{ overflow: 'visible' }}
  >
    {/* What the clip casts onto the paper: a soft one a little to the lower
        right, and a tight one under the wire that holds it to the card. */}
    <image
      href={clipImage}
      x={CLIP_X + 1.8}
      y={CLIP_Y + 2.6}
      width={CLIP_WIDTH}
      height={CLIP_HEIGHT}
      style={{ filter: 'brightness(0) blur(1.7px)', opacity: 0.26 }}
    />
    <image
      href={clipImage}
      x={CLIP_X + 0.6}
      y={CLIP_Y + 1}
      width={CLIP_WIDTH}
      height={CLIP_HEIGHT}
      style={{ filter: 'brightness(0) blur(0.5px)', opacity: 0.34 }}
    />
    <image
      href={clipImage}
      x={CLIP_X}
      y={CLIP_Y}
      width={CLIP_WIDTH}
      height={CLIP_HEIGHT}
    />
  </svg>
);

/**
 * The favourite star left of the folded corner. Pressed, the star turns into
 * a gold paper clip slid over the top edge of the card, with the star at its
 * end; pressed again, the clip comes off and the star is back.
 */
export const PinStar: React.FC<PinStarProps> = ({
  pinned,
  showStar,
  disabled = false,
  onToggle,
}) => (
  <div
    className="pointer-events-none absolute z-30"
    style={{
      top: -8,
      right: 60,
      width: 40,
      height: 90,
      // 3% larger, growing from the star itself so it stays where it is.
      transform: 'scale(1.03)',
      transformOrigin: `${STAR_X}px ${STAR_Y}px`,
    }}
  >
    <AnimatePresence initial={false} mode="popLayout">
      {pinned ? (
        <motion.div
          key="clip"
          className="absolute inset-0"
          initial={{ y: -34, opacity: 0, rotate: -6 }}
          animate={{
            y: 0,
            opacity: 1,
            rotate: 0,
            transition: {
              type: 'spring',
              stiffness: 420,
              damping: 19,
              mass: 0.8,
            },
          }}
          exit={{
            y: -26,
            opacity: 0,
            rotate: -5,
            transition: { duration: 0.24, ease: 'easeIn' },
          }}
          style={{ filter: 'drop-shadow(0.5px 1px 0.5px rgba(30,20,10,0.25))' }}
        >
          <ClipMark />
        </motion.div>
      ) : (
        showStar && (
          <motion.div
            key="star"
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{
              opacity: 0,
              scale: 0.4,
              rotate: 40,
              transition: { duration: 0.15 },
            }}
            style={{ transformOrigin: `${STAR_X}px ${STAR_Y}px` }}
          >
            <StarMark />
          </motion.div>
        )
      )}
    </AnimatePresence>

    {/* The press target stays put whichever of the two is showing. */}
    {(pinned || showStar) && (
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-label={pinned ? t('Открепить карточку') : t('Закрепить карточку')}
        title={
          pinned
            ? t('Закреплена. Нажмите, чтобы открепить')
            : t('Закрепить: карточка всегда сверху')
        }
        className="pointer-events-auto absolute cursor-pointer rounded-full border-0 bg-transparent p-0 outline-none disabled:cursor-default"
        style={{
          left: STAR_X - 18,
          top: STAR_Y - 18,
          width: 36,
          height: 36,
        }}
      />
    )}
  </div>
);
