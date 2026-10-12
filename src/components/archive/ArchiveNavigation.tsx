import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { TableSurface } from '../table/TableSurface';
import whiteMarbleTexture from '../../assets/white-marble.webp';

interface ArchiveNavigationProps {
  isArchiveOpen: boolean;
  onToggle: () => void;
  /** Changes every time a coupon lands in the archive: a quick glint. */
  glintKey?: number;
}

export const ARCHIVE_NAVIGATION_HEIGHT = 72;

const NAV_SURFACE_TRANSITION = {
  duration: 0.24,
  ease: [0.32, 0.72, 0, 1] as const,
};

export const ArchiveNavigation: React.FC<ArchiveNavigationProps> = ({
  isArchiveOpen,
  onToggle,
  glintKey = 0,
}) => {
  return (
    <button
      type="button"
      className="absolute bottom-0 left-0 right-0 z-30 flex w-full cursor-pointer items-center justify-center border-0 p-0"
      style={{
        height: ARCHIVE_NAVIGATION_HEIGHT,
      }}
      onClick={onToggle}
      aria-label={isArchiveOpen ? 'Вернуться на главный экран' : 'Открыть архив'}
    >
      <motion.div
        aria-hidden="true"
        initial={false}
        animate={{ opacity: isArchiveOpen ? 0 : 1 }}
        transition={NAV_SURFACE_TRANSITION}
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `url(${whiteMarbleTexture})`,
          backgroundSize: 'cover',
          backgroundPosition: 'bottom center',
          boxShadow: '0 -3px 10px rgba(0,0,0,0.4)',
          willChange: 'opacity',
        }}
      >
        <div className="absolute inset-0 bg-white/[0.08]" />
      </motion.div>

      <motion.div
        aria-hidden="true"
        initial={false}
        animate={{ opacity: isArchiveOpen ? 1 : 0 }}
        transition={NAV_SURFACE_TRANSITION}
        className="pointer-events-none absolute inset-0"
        style={{
          boxShadow: '0 -3px 10px rgba(0,0,0,0.35)',
          willChange: 'opacity',
        }}
      >
        <TableSurface isFull={false} />
      </motion.div>

      {/* The table's rim: a strip of dark wood with a brass line along the
          table's edge, and the shadow it throws on what lies below it (the
          marble of the archive, or the cloth strip of the way back). */}
      <span aria-hidden="true" className="table-rim pointer-events-none" />
      <span aria-hidden="true" className="table-rim-shadow pointer-events-none" />

      {/* A brief, quiet glint around the archive when a coupon lands. */}
      {glintKey > 0 && !isArchiveOpen && (
        <span key={glintKey} aria-hidden="true">
          <span className="archive-glint" />
          <span
            className="archive-spark"
            style={{ left: 'calc(50% - 46px)', top: '24%', animationDelay: '0ms' }}
          />
          <span
            className="archive-spark"
            style={{ left: 'calc(50% + 34px)', top: '58%', animationDelay: '70ms' }}
          />
          <span
            className="archive-spark"
            style={{ left: 'calc(50% + 74px)', top: '20%', animationDelay: '130ms' }}
          />
        </span>
      )}

      <AnimatePresence mode="wait">
        <motion.span
          key={isArchiveOpen ? 'main' : 'archive'}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.42 }}
          data-text={isArchiveOpen ? 'Главный экран' : 'Архив'}
          className={`foil-text foil-text--sweep${isArchiveOpen ? ' foil-text--on-dark' : ''} relative z-10 leading-none ${isArchiveOpen ? 'text-[20px]' : 'text-[27px]'}`}
        >
          {isArchiveOpen ? 'Главный экран' : 'Архив'}
        </motion.span>
      </AnimatePresence>
    </button>
  );
};
