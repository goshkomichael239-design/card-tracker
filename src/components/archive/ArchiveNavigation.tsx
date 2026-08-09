import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import tableTexture from '../../assets/black-main-background.avif';
import whiteMarbleTexture from '../../assets/white_marble.png';

interface ArchiveNavigationProps {
  isArchiveOpen: boolean;
  onToggle: () => void;
}

export const ARCHIVE_NAVIGATION_HEIGHT = 80;

const GOLD_STYLE: React.CSSProperties = {
  background:
    'linear-gradient(180deg, #E8D48B 0%, #C4A662 30%, #8B6914 60%, #D4AF37 100%)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  textShadow:
    '0 1px 1px rgba(0,0,0,0.8), 0 -1px 0 rgba(255,215,0,0.5)',
  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
};

export const ArchiveNavigation: React.FC<ArchiveNavigationProps> = ({
  isArchiveOpen,
  onToggle,
}) => {
  return (
    <button
      type="button"
      className="absolute bottom-0 left-0 right-0 z-30 flex w-full cursor-pointer items-center justify-center border-0 p-0"
      style={{
        height: ARCHIVE_NAVIGATION_HEIGHT,
        backgroundImage: `url(${
          isArchiveOpen ? tableTexture : whiteMarbleTexture
        })`,
        backgroundSize: 'cover',
        backgroundPosition: isArchiveOpen ? 'center center' : 'bottom center',
        boxShadow: isArchiveOpen
          ? '0 -8px 24px rgba(0,0,0,0.5)'
          : '0 -8px 24px rgba(0,0,0,0.7)',
        transition: 'background-image 0.6s ease, box-shadow 0.6s ease',
      }}
      onClick={onToggle}
      aria-label={isArchiveOpen ? 'Вернуться на главный экран' : 'Открыть архив'}
    >
      <div
        className="absolute inset-0"
        style={{
          background: isArchiveOpen
            ? 'rgba(255,255,255,0.035)'
            : 'rgba(255,255,255,0.08)',
          transition: 'background 0.6s ease',
        }}
      />

      <AnimatePresence mode="wait">
        <motion.span
          key={isArchiveOpen ? 'main' : 'archive'}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 font-mono text-sm font-bold uppercase tracking-[0.3em]"
          style={GOLD_STYLE}
        >
          {isArchiveOpen ? 'Главный экран' : 'Архив'}
        </motion.span>
      </AnimatePresence>
    </button>
  );
};
