import React from 'react';
import { motion } from 'framer-motion';

import cardboardTexture from '../../assets/cardboard.avif';
import type { CardPalette } from '../../app/cardTheme';

interface DraftCardHeaderProps {
  palette: CardPalette;
  disabled: boolean;
  onCancel: () => void;
}

export const DraftCardHeader: React.FC<DraftCardHeaderProps> = ({
  palette,
  disabled,
  onCancel,
}) => {
  return (
    <div className="flex shrink-0 items-start justify-between gap-3">
      <motion.span
        initial={{ opacity: 0, y: -5 }}
        animate={{
          opacity: 1,
          y: 0,
          backgroundColor: palette.paper,
        }}
        transition={{ delay: 0.15, duration: 0.22 }}
        className="inline-flex min-w-[158px] shrink-0 items-center justify-center whitespace-nowrap rounded-[11px] px-[20px] py-[9px] font-mono text-[10px] font-semibold uppercase tracking-[0.14em]"
        style={{
          width: 'max-content',
          minHeight: '38px',
          color: 'rgba(30,28,26,0.72)',
          backgroundColor: palette.paper,
          backgroundImage:
            'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(52,37,26,0.06) 100%), url(' +
            cardboardTexture +
            ')',
          backgroundPosition: 'center, center',
          backgroundSize: '100% 100%, cover',
          backgroundBlendMode: 'soft-light, multiply',
          border: '1px solid rgba(67,49,35,0.2)',
          boxShadow:
            '0 1px 0 rgba(79,58,41,0.2), 0 2px 4px rgba(0,0,0,0.08), inset 1px 1px 1px rgba(255,255,255,0.24), inset -1px -1px 1px rgba(49,34,24,0.08)',
          textShadow: '0 1px 0 rgba(255,255,255,0.24)',
          filter: 'brightness(0.96) saturate(0.82)',
        }}
      >
        Новая карта
      </motion.span>

      <button
        type="button"
        onClick={onCancel}
        disabled={disabled}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-xl transition hover:bg-black/[0.05] active:scale-95 disabled:opacity-20"
        style={{ color: 'rgba(30,28,26,0.48)' }}
        aria-label="Отменить создание"
      >
        ×
      </button>
    </div>
  );
};
