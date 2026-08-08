import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useDeckStore } from '../store/useDeckStore';
import DeckView from './DeckView';
import MuseumView from './MuseumView';
import IncubatorDrawer from './IncubatorDrawer';

const MainLayout: React.FC = () => {
  const { museumToday } = useDeckStore();
  const [showMuseum, setShowMuseum] = useState(false);
  const [showIncubator, setShowIncubator] = useState(false);
  const [swipeStartX, setSwipeStartX] = useState(0);

  const formatDate = () => {
    const months = ['ЯНВ', 'ФЕВ', 'МАР', 'АПР', 'МАЙ', 'ИЮН', 'ИЮЛ', 'АВГ', 'СЕН', 'ОКТ', 'НОЯ', 'ДЕК'];
    const days = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
    const now = new Date();
    return `${now.getDate()} ${months[now.getMonth()]} / ${days[now.getDay()]}`;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setSwipeStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - swipeStartX;
    if (delta < -50) setShowMuseum(true);
    else if (delta > 50) setShowMuseum(false);
  };

  return (
    <div
      className="fixed inset-0 overflow-hidden select-none"
      style={{ background: '#1A1D1F' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}>
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center px-6 py-4">
        <div
          className="text-[#6A6C6E] text-xs font-mono tracking-widest px-4 py-2 rounded-md"
          style={{
            background: 'rgba(255,255,255,0.03)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.03)',
          }}>
          {formatDate()}
        </div>

        <button
          onClick={() => setShowMuseum(!showMuseum)}
          className="text-[#C4B998] text-sm font-medium px-4 py-2 rounded-md flex items-center gap-2 transition-all hover:bg-white/[0.02]"
          style={{
            background: 'rgba(255,255,255,0.03)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.03)',
          }}>
          <span>🏛️ Музей</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-bold"
            style={{ backgroundColor: 'rgba(196,185,152,0.15)', color: '#C4B998' }}>
            [{museumToday.length}]
          </span>
        </button>
      </div>

      <motion.div
        className="relative w-full h-full"
        animate={{ x: showMuseum ? '-100%' : '0%' }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}>
        <DeckView />

        <button
          onClick={() => setShowIncubator(!showIncubator)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 w-20 h-2 rounded-full active:scale-95 transition-transform"
          style={{
            background: 'rgba(255,255,255,0.04)',
            boxShadow: 'inset 0 2px 3px rgba(0,0,0,0.4), 0 2px 0 rgba(255,255,255,0.03)',
          }}
        />
      </motion.div>

      <MuseumView visible={showMuseum} onClose={() => setShowMuseum(false)} />
      <IncubatorDrawer visible={showIncubator} onClose={() => setShowIncubator(false)} />
    </div>
  );
};

export default MainLayout;