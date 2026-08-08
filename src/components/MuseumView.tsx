import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDeckStore, getElapsedTime } from '../store/useDeckStore';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const typeLabels: Record<string, { emoji: string }> = {
  SINGLE: { emoji: '📍' },
  BATCH: { emoji: '🔄' },
  CHECKLIST: { emoji: '✅' },
  TIMER: { emoji: '⏳' },
};

const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}ч ${minutes}м`;
  if (minutes > 0) return `${minutes}м ${seconds}с`;
  return `${seconds}с`;
};

const MuseumView: React.FC<Props> = ({ visible, onClose }) => {
  const { museumToday } = useDeckStore();

  const totalCards = museumToday.length;
  const totalTime = museumToday.reduce((sum, card) => sum + getElapsedTime(card), 0);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: '0%' }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          className="fixed inset-0 bg-[#1A1C1F] z-30 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={onClose}
                className="text-[#C4B998] text-sm font-medium flex items-center gap-2 active:scale-95 transition-transform">
                <span>←</span> Стол
              </button>
              <span className="text-[#7A7D82] text-xs font-mono">
                {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }).toUpperCase()}
              </span>
            </div>

            <h2 className="text-[#C4B998] text-2xl font-bold mb-2">🏛️ Музей дня</h2>
            <p className="text-[#7A7D82] text-sm mb-8">Завершённые задачи за сегодня</p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div
                className="bg-[#1E2024] p-4 rounded-xl text-center"
                style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}>
                <p className="text-3xl font-bold text-[#E3E0D8]">{totalCards}</p>
                <p className="text-xs text-[#7A7D82] mt-1">задач</p>
              </div>
              <div
                className="bg-[#1E2024] p-4 rounded-xl text-center"
                style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}>
                <p className="text-3xl font-bold text-[#C4B998] font-mono">{formatTime(totalTime)}</p>
                <p className="text-xs text-[#7A7D82] mt-1">общее время</p>
              </div>
            </div>

            {totalCards === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-4">🏛️</p>
                <p className="text-[#7A7D82] text-lg">Сегодня пока пусто</p>
                <p className="text-[#5A5D62] text-sm mt-2">Завершите первую задачу, и она появится здесь</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...museumToday].reverse().map((card, index) => {
                  const badge = typeLabels[card.type] || { emoji: '📋' };
                  const elapsed = getElapsedTime(card);
                  return (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 bg-[#1E2024] p-4 rounded-xl"
                      style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)' }}>
                      <div className="w-10 h-10 rounded-xl bg-[#2A2D31] flex items-center justify-center text-lg"
                           style={{ boxShadow: 'inset 0 2px 3px rgba(0,0,0,0.3)' }}>
                        {badge.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#E3E0D8] text-sm font-medium truncate">{card.title}</p>
                        <p className="text-[#5A5D62] text-xs mt-0.5">
                          {card.type === 'BATCH' && `${card.batchCompleted || 0}/${card.batchTotal || 0} шт · `}
                          {card.type === 'CHECKLIST' && card.checklist && `${card.checklist.filter(i => i.done).length}/${card.checklist.length} пунктов · `}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[#C4B998] text-sm font-mono font-bold">{formatTime(elapsed)}</p>
                        <p className="text-[#5A5D62] text-[10px]">
                          {card.completedAt
                            ? new Date(card.completedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                            : ''}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MuseumView;