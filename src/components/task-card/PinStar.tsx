import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface PinStarProps {
  pinned: boolean;
  /** Only the front of the card shows the star; the pin stays on every face. */
  showStar: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

const STAR_POINTS = (() => {
  const points: string[] = [];

  for (let index = 0; index < 10; index += 1) {
    const radius = index % 2 === 0 ? 13 : 5.6;
    const angle = (Math.PI / 5) * index - Math.PI / 2;
    points.push(
      `${(22 + radius * Math.cos(angle)).toFixed(2)},${(19 + radius * Math.sin(angle)).toFixed(2)}`,
    );
  }

  return points.join(' ');
})();

/** A star pressed into the paper: the quiet "favourite" mark. */
const StarMark: React.FC = () => (
  <svg width="32" height="32" viewBox="0 0 44 44" aria-hidden="true">
    <polygon
      points={STAR_POINTS}
      transform="translate(0 3)"
      fill="rgba(60,45,30,0.06)"
      stroke="rgba(60,45,30,0.5)"
      strokeWidth="2"
      strokeLinejoin="round"
      style={{ filter: 'drop-shadow(0 1.2px 0 rgba(255,255,255,0.85))' }}
    />
  </svg>
);

/**
 * A gold pin stuck into the card, its head a star: the star the card was
 * marked with, now fixed in place. The needle goes into the paper at the
 * lower left, with its soft shadow lying on the card.
 */
const PinMark: React.FC = () => (
  <svg width="48" height="63" viewBox="0 0 44 58" aria-hidden="true">
    <defs>
      <linearGradient id="pin-gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FFF0B3" />
        <stop offset="0.45" stopColor="#F0C24A" />
        <stop offset="1" stopColor="#B27F1E" />
      </linearGradient>
      <linearGradient id="pin-needle" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#8F6A1C" />
        <stop offset="0.5" stopColor="#F4D675" />
        <stop offset="1" stopColor="#9C7420" />
      </linearGradient>
    </defs>

    {/* shadow of the needle and the head on the paper */}
    <ellipse cx="18" cy="52" rx="6" ry="2" fill="rgba(30,20,10,0.32)" />
    <polygon
      points={STAR_POINTS}
      transform="translate(5 8)"
      fill="rgba(30,20,10,0.22)"
    />

    {/* the needle, going down and to the left into the card */}
    <path
      d="M22 31 L15.2 51.5 L16.8 51.9 L24 32 Z"
      fill="url(#pin-needle)"
      stroke="rgba(60,40,10,0.55)"
      strokeWidth="0.6"
    />
    {/* collar under the head */}
    <ellipse
      cx="22.6"
      cy="30.6"
      rx="5.2"
      ry="2.4"
      fill="url(#pin-gold)"
      stroke="rgba(90,60,10,0.7)"
      strokeWidth="0.7"
    />
    {/* the star head */}
    <polygon
      points={STAR_POINTS}
      fill="url(#pin-gold)"
      stroke="rgba(110,76,14,0.85)"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    <polygon
      points="22,10.5 24.6,16 28.5,16.6 25.2,19.6"
      fill="rgba(255,255,255,0.55)"
    />
  </svg>
);

/**
 * The favourite star left of the folded corner. Pressed, the star goes and a
 * gold pin with a star for a head drops onto the card; pressed again, the
 * pin is pulled out and the star comes back.
 */
export const PinStar: React.FC<PinStarProps> = ({
  pinned,
  showStar,
  disabled = false,
  onToggle,
}) => (
  <div
    className="absolute z-30"
    style={{ top: 4, right: 52, width: 48, height: 63 }}
  >
    <AnimatePresence initial={false} mode="popLayout">
      {pinned ? (
        <motion.button
          key="pin"
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-label="Открепить карточку"
          title="Закреплена. Нажмите, чтобы открепить"
          className="absolute inset-0 flex cursor-pointer items-start justify-center border-0 bg-transparent p-0 outline-none disabled:cursor-default"
          initial={{ y: -26, scale: 1.6, rotate: -18, opacity: 0 }}
          animate={{
            y: 0,
            scale: 1,
            rotate: 0,
            opacity: 1,
            transition: {
              type: 'spring',
              stiffness: 520,
              damping: 17,
              mass: 0.7,
            },
          }}
          exit={{
            y: -18,
            scale: 1.15,
            rotate: -12,
            opacity: 0,
            transition: { duration: 0.18, ease: 'easeIn' },
          }}
          style={{
            filter: 'drop-shadow(1px 2px 1.5px rgba(30,20,10,0.35))',
          }}
        >
          <PinMark />
        </motion.button>
      ) : (
        showStar && (
          <motion.button
            key="star"
            type="button"
            onClick={onToggle}
            disabled={disabled}
            aria-label="Закрепить карточку"
            title="Закрепить: карточка всегда сверху"
            className="absolute left-1/2 top-1 flex h-[34px] w-[34px] -translate-x-1/2 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 outline-none transition-transform hover:scale-110 focus-visible:scale-110 active:scale-95 disabled:cursor-default"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{
              opacity: 0,
              scale: 0.4,
              rotate: 40,
              transition: { duration: 0.14 },
            }}
          >
            <StarMark />
          </motion.button>
        )
      )}
    </AnimatePresence>
  </div>
);
