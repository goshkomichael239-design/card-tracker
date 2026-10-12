import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import clipImage from '../../assets/clip.png';

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

// The clip is a picture (a gold paper clip, cut out of its background; the
// star it came with was taken off, ours is drawn in code at the wire's end).
// It is 92 x 300 in the file; in the 40 x 90 drawing it is shown CLIP_HEIGHT
// tall, and placed so that the end of its inner wire (at 20% of its width and
// 31.7% of its height) is exactly under the star.
const CLIP_HEIGHT = 70;
const CLIP_WIDTH = (CLIP_HEIGHT * 92) / 300;
const CLIP_X = STAR_X - 0.2 * CLIP_WIDTH;
const CLIP_Y = STAR_Y - 0.317 * CLIP_HEIGHT;

/**
 * A gold paper clip over the top edge of the card; its free end carries the
 * star the card was marked with, at the very place where it was pressed.
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
    <defs>
      <linearGradient id="star-gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FFF3BD" />
        <stop offset="0.5" stopColor="#F2C54E" />
        <stop offset="1" stopColor="#B07C1C" />
      </linearGradient>
    </defs>

    {/* What the clip casts onto the paper: a soft one a little to the lower
        right, and a tight one under the wire that holds it to the card. */}
    <image
      href={clipImage}
      x={CLIP_X + 1.6}
      y={CLIP_Y + 2.4}
      width={CLIP_WIDTH}
      height={CLIP_HEIGHT}
      style={{
        filter: 'brightness(0) blur(1.6px)',
        opacity: 0.26,
      }}
    />
    <image
      href={clipImage}
      x={CLIP_X + 0.5}
      y={CLIP_Y + 0.9}
      width={CLIP_WIDTH}
      height={CLIP_HEIGHT}
      style={{
        filter: 'brightness(0) blur(0.5px)',
        opacity: 0.34,
      }}
    />
    <image
      href={clipImage}
      x={CLIP_X}
      y={CLIP_Y}
      width={CLIP_WIDTH}
      height={CLIP_HEIGHT}
    />

    {/* the star at the end of the wire, with its own shadow */}
    <polygon
      points={STAR_POINTS}
      transform="translate(1.4 2)"
      fill="rgba(30,20,10,0.3)"
      style={{ filter: 'blur(1.1px)' }}
    />
    <polygon
      points={STAR_POINTS}
      fill="url(#star-gold)"
      stroke="rgba(110,76,14,0.9)"
      strokeWidth="1.1"
      strokeLinejoin="round"
    />
    <polygon
      points={`${STAR_X},${STAR_Y - 8.5} ${STAR_X + 2.3},${STAR_Y - 3.6} ${STAR_X + 5.6},${STAR_Y - 3.2} ${STAR_X + 2.6},${STAR_Y - 0.4}`}
      fill="rgba(255,255,255,0.6)"
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
            transition: { duration: 0.2, ease: 'easeIn' },
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
              transition: { duration: 0.14 },
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
        aria-label={pinned ? 'Открепить карточку' : 'Закрепить карточку'}
        title={
          pinned
            ? 'Закреплена. Нажмите, чтобы открепить'
            : 'Закрепить: карточка всегда сверху'
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
