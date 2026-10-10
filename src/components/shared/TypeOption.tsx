import React from 'react';
import { motion } from 'framer-motion';

import cardboardTexture from '../../assets/cardboard.avif';
import type { CardPalette } from '../../app/cardTheme';

interface TypeOptionProps {
  index: number;
  lines: [string, string];
  hint?: string;
  selected: boolean;
  disabled?: boolean;
  palette: CardPalette;
  onClick: () => void;
}

export const TypeOption: React.FC<TypeOptionProps> = ({
  index,
  lines,
  hint,
  selected,
  disabled = false,
  palette,
  onClick,
}) => {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 6 }}
      animate={{
        opacity: disabled ? 0.38 : 1,
        y: 0,
        backgroundColor: selected
          ? palette.paper
          : 'rgba(245,236,218,0.16)',
      }}
      transition={{ delay: index * 0.035, duration: 0.18, ease: 'easeOut' }}
      whileHover={
        disabled
          ? undefined
          : { y: -1, filter: 'brightness(1.025)' }
      }
      whileTap={
        disabled
          ? undefined
          : {
              y: 2,
              filter: 'brightness(0.98)',
              boxShadow:
                'inset 0 2px 4px rgba(48,34,24,0.2), 0 1px 0 rgba(72,52,37,0.2)',
              transition: { duration: 0.07, ease: 'easeOut' },
            }
      }
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-[92px] flex-col items-center justify-center rounded-[13px] px-2 py-3 text-center disabled:cursor-default"
      style={{
        color: selected ? palette.ink : 'rgba(30,28,26,0.68)',
        backgroundImage: 'url(' + cardboardTexture + ')',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundBlendMode: 'multiply',
        border: selected
          ? '1.5px solid rgba(72,53,38,0.48)'
          : '1px solid rgba(70,52,38,0.3)',
        boxShadow: selected
          ? 'inset 1px 2px 5px rgba(51,36,25,0.22), inset -1px -1px 1px rgba(255,255,255,0.2), 0 1px 0 rgba(72,52,37,0.22)'
          : '0 3px 0 rgba(83,61,43,0.28), 0 5px 7px rgba(0,0,0,0.12), inset 1px 1px 1px rgba(255,255,255,0.24), inset -1px -1px 2px rgba(55,39,28,0.1)',
        filter: selected ? 'brightness(0.94)' : 'none',
      }}
      aria-pressed={selected}
    >
      <span className="block text-[13.5px] font-semibold leading-[1.15]">
        {lines[0]}
      </span>

      <span className="mt-0.5 block min-h-[13px] text-[13.5px] font-semibold leading-[1.15]">
        {lines[1]}
      </span>

      {hint && (
        <span
          className="mt-1 block font-mono text-[8px] uppercase tracking-[0.08em]"
          style={{ color: 'rgba(30,28,26,0.3)' }}
        >
          {hint}
        </span>
      )}
    </motion.button>
  );
};
