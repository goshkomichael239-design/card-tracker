import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDeckStore } from '../store/useDeckStore';
import TaskCard from './TaskCard';
import CreateCardModal from './CreateCardModal';

const DeckView: React.FC = () => {
  const { deck, currentCard } = useDeckStore();
  const [showCreateCard, setShowCreateCard] = useState(false);

  const visibleStack = currentCard
    ? [currentCard, ...deck.slice(0, 2)]
    : deck.slice(0, 3);

  const getStackStyle = (index: number) => {
    const styles = [
      { scale: 1.0, y: 0, opacity: 1, rotateX: 0, brightness: 1, zIndex: 10 },
      { scale: 0.92, y: 15, opacity: 0.6, rotateX: 4, brightness: 0.85, zIndex: 2 },
      { scale: 0.85, y: 30, opacity: 0.3, rotateX: 8, brightness: 0.7, zIndex: 1 },
    ];
    return styles[Math.min(index, 2)];
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
      <AnimatePresence mode="popLayout">
        {visibleStack.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center gap-6">
            <div
              className="w-full max-w-[340px] h-[420px] rounded-[20px] border-2 border-dashed border-[#2E3236] flex flex-col items-center justify-center gap-4"
              style={{
                background: 'rgba(255,255,255,0.015)',
                boxShadow: 'inset 0 0 60px rgba(0,0,0,0.3)',
              }}>
              <span className="text-4xl opacity-40">🃏</span>
              <p className="text-[#5A5D62] text-sm">Колода пуста</p>
            </div>
            <button
              onClick={() => setShowCreateCard(true)}
              className="w-full max-w-[340px] py-4 rounded-xl text-lg font-medium text-[#B6C4B0] border border-[#2E3236] active:scale-95 transition-all hover:border-[#B6C4B0]/30"
              style={{ background: 'rgba(182,196,176,0.04)' }}>
              + Новая задача
            </button>
          </motion.div>
        ) : (
          <div className="relative w-full max-w-[340px] mx-auto" style={{ height: 460 }}>
            {visibleStack
              .slice()
              .reverse()
              .map((card, reverseIndex) => {
                const index = visibleStack.length - 1 - reverseIndex;
                const style = getStackStyle(index);
                const isTop = index === 0;

                return (
                  <motion.div
                    key={card.id}
                    layoutId={card.id}
                    initial={false}
                    animate={{
                      scale: style.scale,
                      y: style.y,
                      opacity: style.opacity,
                      rotateX: style.rotateX,
                      filter: `brightness(${style.brightness})`,
                      zIndex: style.zIndex,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 28,
                    }}
                    className="absolute inset-x-0 top-0 origin-bottom"
                    style={{
                      pointerEvents: isTop ? 'auto' : 'none',
                    }}>
                    <TaskCard card={card} isTop={isTop} />
                  </motion.div>
                );
              })}
          </div>
        )}
      </AnimatePresence>

      <CreateCardModal isOpen={showCreateCard} onClose={() => setShowCreateCard(false)} />
    </div>
  );
};

export default DeckView;