import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SandboxCreateCard: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [cardType, setCardType] = useState('SINGLE');

  const types = [
    { value: 'SINGLE', emoji: '📍', label: 'Разовая' },
    { value: 'BATCH', emoji: '🔄', label: 'Серия' },
    { value: 'CHECKLIST', emoji: '✅', label: 'Список' },
    { value: 'TIMER', emoji: '⏳', label: 'Таймер' },
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#1A1C1E]">
      {/* Карточка-заготовка с загнутым уголком */}
      <div className="relative w-[280px] rounded-[32px] bg-[#E8D9C0] overflow-hidden"
           style={{
             aspectRatio: '3 / 7',
             maxHeight: 'min(520px, 75vh)',
             boxShadow: '18px 28px 50px -8px rgba(0,0,0,0.7)',
           }}>
        
        {/* Загнутый уголок */}
        <motion.div
          className="absolute -top-4 -right-4 w-24 h-24 cursor-pointer z-20"
          onClick={() => setShowForm(!showForm)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}>
          <div
            className="absolute inset-0 rounded-bl-3xl"
            style={{
              background: 'linear-gradient(135deg, #CD5334 0%, #B84C3A 100%)',
              clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
              boxShadow: '-4px 4px 12px rgba(0,0,0,0.3)',
            }}
          />
          <span className="absolute top-3 right-3 text-white text-xl font-bold">+</span>
        </motion.div>

        {/* Содержимое карточки */}
        <div className="p-8 pt-12">
          <h2 className="text-2xl font-bold text-[#1E1C1A] mb-4">Новая задача</h2>
          <p className="text-[#8A8A8A] text-sm">Нажмите на уголок, чтобы создать карточку</p>
        </div>
      </div>

      {/* Форма создания */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-30"
              onClick={() => setShowForm(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: '0%' }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-40 bg-[#1E2024] rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto">
              <div className="w-10 h-1 bg-[#3A3D42] rounded-full mx-auto mb-6" />
              <h3 className="text-[#C4B998] text-lg font-bold mb-4">Создать карточку</h3>
              
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Название задачи"
                className="w-full bg-[#2A2D31] text-[#E3E0D8] px-4 py-3 rounded-xl mb-4 outline-none"
              />

              <div className="grid grid-cols-4 gap-2 mb-6">
                {types.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setCardType(t.value)}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl text-xs transition-all ${
                      cardType === t.value
                        ? 'bg-[#C4B998] text-[#16181A]'
                        : 'bg-[#2A2D31] text-[#8A8A8A]'
                    }`}>
                    <span className="text-lg">{t.emoji}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowForm(false)}
                className="w-full py-4 rounded-xl bg-[#C4B998] text-[#16181A] font-bold">
                Создать
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SandboxCreateCard;