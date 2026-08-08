import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDeckStore } from '../store/useDeckStore';
import type { CardType, CheckItem } from '../store/useDeckStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const TIMER_PRESETS = [5, 15, 25, 45, 60];

const CreateCardModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { addCardToDeck } = useDeckStore();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<CardType>('SINGLE');
  const [batchTotal, setBatchTotal] = useState(10);
  const [checklistItems, setChecklistItems] = useState<CheckItem[]>([
    { id: crypto.randomUUID(), text: '', done: false },
  ]);
  const [timerMinutes, setTimerMinutes] = useState(25);

  const handleAddCheckItem = () => {
    setChecklistItems([...checklistItems, { id: crypto.randomUUID(), text: '', done: false }]);
  };

  const handleRemoveCheckItem = (id: string) => {
    if (checklistItems.length <= 1) return;
    setChecklistItems(checklistItems.filter((item) => item.id !== id));
  };

  const handleCheckItemChange = (id: string, text: string) => {
    setChecklistItems(checklistItems.map((item) => (item.id === id ? { ...item, text } : item)));
  };

  const handleSubmit = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const baseCard = {
      id: Date.now().toString(),
      title: trimmedTitle,
      status: 'idle' as const,
      createdAt: Date.now(),
      completedAt: null,
      accumulatedTime: 0,
      startedAtTimestamp: null,
    };

    let newCard;

    switch (type) {
      case 'SINGLE':
        newCard = { ...baseCard, type: 'SINGLE' as const };
        break;
      case 'BATCH':
        newCard = {
          ...baseCard,
          type: 'BATCH' as const,
          batchTotal,
          batchCompleted: 0,
          batchLapAccumulated: 0,
          batchLapStartedAt: null,
        };
        break;
      case 'CHECKLIST':
        const validItems = checklistItems.filter((item) => item.text.trim());
        if (validItems.length === 0) return;
        newCard = {
          ...baseCard,
          type: 'CHECKLIST' as const,
          checklist: validItems,
        };
        break;
      case 'TIMER':
        newCard = {
          ...baseCard,
          type: 'TIMER' as const,
          targetTime: timerMinutes * 60 * 1000,
        };
        break;
    }

    addCardToDeck(newCard);
    setTitle('');
    setType('SINGLE');
    setBatchTotal(10);
    setChecklistItems([{ id: crypto.randomUUID(), text: '', done: false }]);
    setTimerMinutes(25);
    onClose();
  };

  const typeOptions: { value: CardType; emoji: string; label: string }[] = [
    { value: 'SINGLE', emoji: '📍', label: 'Разовая' },
    { value: 'BATCH', emoji: '🔄', label: 'Серия' },
    { value: 'CHECKLIST', emoji: '✅', label: 'Список' },
    { value: 'TIMER', emoji: '⏳', label: 'Таймер' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#1E2024] rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
            style={{ boxShadow: '0 -10px 40px rgba(0,0,0,0.5)' }}>
            <div className="w-10 h-1 bg-[#3A3D42] rounded-full mx-auto mb-6" />
            <h2 className="text-[#C4B998] text-xl font-bold mb-6">Новая карта</h2>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Что нужно сделать?"
              className="w-full bg-[#2A2D31] text-[#E3E0D8] text-lg px-4 py-3 rounded-xl mb-6 placeholder:text-[#5A5D62] outline-none border border-transparent focus:border-[#C4B998] transition-all"
              style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}
              autoFocus
            />
            <p className="text-[#7A7D82] text-sm mb-3">Тип задачи</p>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setType(opt.value)}
                  className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-medium transition-all ${
                    type === opt.value
                      ? 'bg-[#C4B998] text-[#16181A]'
                      : 'bg-[#2A2D31] text-[#8A8A8A] hover:bg-[#33363B]'
                  }`}
                  style={
                    type === opt.value
                      ? { boxShadow: '0 2px 0 #A89B7A' }
                      : { boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)' }
                  }>
                  <span className="text-lg">{opt.emoji}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
            {type === 'BATCH' && (
              <div className="mb-6">
                <p className="text-[#7A7D82] text-sm mb-3">Количество повторений</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setBatchTotal(Math.max(1, batchTotal - 5))}
                    className="w-10 h-10 rounded-xl bg-[#2A2D31] text-[#E3E0D8] text-lg active:scale-95 transition-transform">
                    −
                  </button>
                  <input
                    type="number"
                    value={batchTotal}
                    onChange={(e) => setBatchTotal(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 bg-[#2A2D31] text-[#E3E0D8] text-center text-lg px-4 py-3 rounded-xl outline-none border border-transparent focus:border-[#C4B998] transition-all"
                    style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}
                  />
                  <button
                    onClick={() => setBatchTotal(batchTotal + 5)}
                    className="w-10 h-10 rounded-xl bg-[#2A2D31] text-[#E3E0D8] text-lg active:scale-95 transition-transform">
                    +
                  </button>
                </div>
              </div>
            )}
            {type === 'CHECKLIST' && (
              <div className="mb-6">
                <p className="text-[#7A7D82] text-sm mb-3">Пункты списка</p>
                <div className="space-y-2">
                  {checklistItems.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <span className="text-[#5A5D62] text-sm w-6">{index + 1}.</span>
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => handleCheckItemChange(item.id, e.target.value)}
                        placeholder={`Пункт ${index + 1}`}
                        className="flex-1 bg-[#2A2D31] text-[#E3E0D8] text-sm px-3 py-2 rounded-lg outline-none border border-transparent focus:border-[#C4B998] transition-all"
                        style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)' }}
                      />
                      <button
                        onClick={() => handleRemoveCheckItem(item.id)}
                        className="w-8 h-8 rounded-lg bg-[#2A2D31] text-[#8A8A8A] text-sm active:scale-95 transition-transform flex items-center justify-center">
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleAddCheckItem}
                  className="mt-2 text-sm text-[#A8C4A2] hover:text-[#C4D8C0] transition-colors">
                  + Добавить пункт
                </button>
              </div>
            )}
            {type === 'TIMER' && (
              <div className="mb-6">
                <p className="text-[#7A7D82] text-sm mb-3">Целевое время</p>
                <div className="flex gap-2 flex-wrap">
                  {TIMER_PRESETS.map((min) => (
                    <button
                      key={min}
                      onClick={() => setTimerMinutes(min)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        timerMinutes === min
                          ? 'bg-[#C49898] text-[#16181A]'
                          : 'bg-[#2A2D31] text-[#8A8A8A] hover:bg-[#33363B]'
                      }`}
                      style={
                        timerMinutes === min
                          ? { boxShadow: '0 2px 0 #A87878' }
                          : { boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)' }
                      }>
                      {min} мин
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={!title.trim()}
              className="w-full py-4 rounded-xl text-lg font-bold text-[#E3E0D8] transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                backgroundColor: '#2A2D31',
                boxShadow: '0 4px 0 #141518, 0 8px 15px rgba(0,0,0,0.3)',
              }}>
              Положить на стол
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreateCardModal;