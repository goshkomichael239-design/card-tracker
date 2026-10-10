import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

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
    className="absolute left-0 top-0"
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

// The wire: from its free end (under the star) down the left side, round the
// bottom, up the right side, over the top (above the edge of the card) and a
// little way down again, where it slips behind the paper.
const WIRE =
  'M10 30 V68 A10 10 0 0 0 30 68 V13 A7.5 7.5 0 0 0 15 13 V24';

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
      <linearGradient
        id="clip-gold"
        gradientUnits="userSpaceOnUse"
        x1="4"
        y1="0"
        x2="36"
        y2="0"
      >
        <stop offset="0" stopColor="#A87718" />
        <stop offset="0.4" stopColor="#F6DA7C" />
        <stop offset="0.7" stopColor="#D6A63A" />
        <stop offset="1" stopColor="#9A6C14" />
      </linearGradient>
      <linearGradient id="star-gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FFF3BD" />
        <stop offset="0.5" stopColor="#F2C54E" />
        <stop offset="1" stopColor="#B07C1C" />
      </linearGradient>
    </defs>

    {/* what the clip casts onto the paper */}
    <path
      d={WIRE}
      transform="translate(2.2 3)"
      fill="none"
      stroke="rgba(30,20,10,0.3)"
      strokeWidth="3.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ filter: 'blur(1.4px)' }}
    />
    <polygon
      points={STAR_POINTS}
      transform="translate(2.2 3)"
      fill="rgba(30,20,10,0.25)"
      style={{ filter: 'blur(1.4px)' }}
    />

    {/* the wire: a dark edge, the gold, and a thin light along it */}
    <path
      d={WIRE}
      fill="none"
      stroke="rgba(90,60,10,0.85)"
      strokeWidth="4.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d={WIRE}
      fill="none"
      stroke="url(#clip-gold)"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d={WIRE}
      fill="none"
      stroke="rgba(255,250,215,0.65)"
      strokeWidth="0.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      transform="translate(-0.7 -0.5)"
    />

    {/* the star at the end of the wire */}
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
    style={{ top: -16, right: 40, width: 40, height: 90 }}
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
