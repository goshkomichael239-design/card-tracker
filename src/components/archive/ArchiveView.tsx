import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import whiteMarbleTexture from '../../assets/white_marble.png';

interface ArchiveViewProps {
  isOpen: boolean;
}

const CUBIC_EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];

const ARCHIVE_TITLE_STYLE: React.CSSProperties = {
  color: '#5A5D62',
  textShadow: '0 1px 0 rgba(255,255,255,0.7)',
};

export const ArchiveView: React.FC<ArchiveViewProps> = ({ isOpen }) => {
  useEffect(() => {
    // The marble is revealed from behind an opaque main scene. Explicitly
    // decoding it while the scene is idle prevents that first reveal from
    // competing with the archive transition for image-decoding work.
    const image = new Image();
    image.src = whiteMarbleTexture;
    void image.decode?.().catch(() => undefined);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-[25] h-full w-full overflow-hidden">
      <motion.div
        initial={false}
        animate={{ y: isOpen ? '0%' : '100%' }}
        transition={{ duration: 0.85, ease: CUBIC_EASE }}
        className="absolute inset-0 h-full w-full"
        style={{ willChange: 'transform' }}
      >
        <div
          className="absolute inset-0 h-full w-full"
          style={{
            backgroundImage: `url(${whiteMarbleTexture})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-white/10" />

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 pb-[100px] pt-20 text-center"
            >
              <motion.h2
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: CUBIC_EASE }}
                className="font-mono text-base font-bold uppercase tracking-[0.35em]"
                style={ARCHIVE_TITLE_STYLE}
              >
                Архив
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.28, ease: CUBIC_EASE }}
                className="font-mono text-xs tracking-[0.08em]"
                style={{ color: 'rgba(63,65,68,0.62)' }}
              >
                Завершённых карточек пока нет
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
