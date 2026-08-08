import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDeckStore } from '../store/useDeckStore';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const typeLabels: Record<string, { emoji: string; color: string }> = {
  SINGLE: { emoji: '📍', color: '#C4B998' },
  BATCH: { emoji: '🔄', color: '#A8C4A2' },
  CHECKLIST: { emoji: '✅', color: '#C4A882' },
  TIMER: { emoji: '⏳', color: '#C49898' },
};

const IncubatorDrawer: React.FC<Props> = ({ visible, onClose }) => {
  const { incubator, unshelveCard } = useDeckStore();

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#1E2024] rounded-t-3xl p-6 max-h-[50vh] overflow-y-auto"
            style={{ boxShadow: '0 -10px 40px rgba(0,0,0,0.5)' }}>
            <div className="w-10 h-1 bg-[#3A3D42] rounded-full mx-auto mb-6" />
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[#C4B998] text-xl font-bold">🧺 Инкубатор</h2>
              <span className="text-[#7A7D82] text-sm">{incubator.length} отложено</span>
            </div>
            {incubator.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-3xl mb-3">🧺</p>
                <p className="text-[#7A7D82] text-sm">Здесь пока пусто</p>
                <p className="text-[#5A5D62] text-xs mt-1">Отложите карточку, чтобы вернуться к ней позже</p>
              </div>
            ) : (
              <div className="space-y-3">
                {incubator.map((card) => {
                  const badge = typeLabels[card.type] || { emoji: '📋', color: '#8A8A8A' };
                  return (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-4 bg-[#2A2D31] p-4 rounded-xl"
                      style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)' }}>
                      <span className="text-lg">{badge.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#E3E0D8] text-sm font-medium truncate">{card.title}</p>
                        <p className="text-[#5A5D62] text-xs mt-0.5">
                          {card.type === 'BATCH' && `${card.batchCompleted || 0}/${card.batchTotal || 0} `}
                          {card.type === 'TIMER' && card.targetTime && '⏱ '}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          unshelveCard(card.id);
                          if (incubator.length <= 1) onClose();
                        }}
                        className="shrink-0 px-4 py-2 rounded-lg text-xs font-medium text-[#A8C4A2] border border-[#A8C4A2] active:scale-95 transition-transform">
                        Вернуть
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default IncubatorDrawer;