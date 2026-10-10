import React from 'react';
import { motion } from 'framer-motion';

import cardboardTexture from '../../assets/cardboard.avif';
import type { CardPalette } from '../../app/cardTheme';

interface TimeOptionProps {
  index: number;
  lines: [string, string];
  selected: boolean;
  palette: CardPalette;
  onClick: () => void;
}

export const TimeOption: React.FC<TimeOptionProps> = ({
  index,
  lines,
  selected,
  palette,
  onClick,
}) => {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 6 }}
      animate={{
        opacity: 1,
        y: 0,
        backgroundColor: selected
          ? palette.paper
          : 'rgba(245,236,218,0.16)',
      }}
      transition={{ delay: index * 0.035, duration: 0.18, ease: 'easeOut' }}
      whileHover={{ y: -1, filter: 'brightness(1.025)' }}
      whileTap={{
        y: 2,
        filter: 'brightness(0.98)',
        boxShadow:
          'inset 0 2px 4px rgba(48,34,24,0.2), 0 1px 0 rgba(72,52,37,0.2)',
        transition: { duration: 0.07, ease: 'easeOut' },
      }}
      onClick={onClick}
      className="flex min-h-[88px] flex-col items-center justify-center rounded-[13px] px-1 py-3 text-center"
      style={{
        color: selected ? palette.ink : 'rgba(30,28,26,0.7)',
        backgroundImage: 'url(' + cardboardTexture + ')',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundBlendMode: 'multiply',
        border: selected
          ? '1.5px solid ' + palette.accentDark + '99'
          : '1px solid rgba(70,52,38,0.3)',
        boxShadow: selected
          ? 'inset 1px 2px 4px rgba(51,36,25,0.2), inset -1px -1px 1px rgba(255,255,255,0.2), 0 1px 0 rgba(72,52,37,0.22)'
          : '0 3px 0 rgba(83,61,43,0.28), 0 5px 7px rgba(0,0,0,0.12), inset 1px 1px 1px rgba(255,255,255,0.24), inset -1px -1px 2px rgba(55,39,28,0.1)',
      }}
      aria-pressed={selected}
    >
      <span className="block text-[13.5px] font-semibold leading-[1.12]">
        {lines[0]}
      </span>

      <span className="mt-1 block min-h-[13px] text-[13.5px] font-semibold leading-[1.12]">
        {lines[1]}
      </span>
    </motion.button>
  );
};
