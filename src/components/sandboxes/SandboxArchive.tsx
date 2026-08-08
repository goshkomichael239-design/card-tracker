import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import tableTexture from '../../assets/black-main-background.avif';
import whiteMarbleTexture from '../../assets/white_marble.png';
import cardboardTexture from '../../assets/cardboard.avif';

interface CardColorPreset {
  name: string;
  bg: string;
  accent: string;
}

const CARD_COLORS: CardColorPreset[] = [
  { name: 'Сочный пергамент', bg: '#E8D9C0', accent: '#CD5334' },
  { name: 'Глубокая фисташка', bg: '#CDD9C4', accent: '#5C7A5A' },
  { name: 'Пудровый терракот', bg: '#E4CFC4', accent: '#B84C3A' },
  { name: 'Пепельно-голубой', bg: '#CFD7E0', accent: '#4A6578' },
  { name: 'Сливочно-оливковый', bg: '#D9D8C0', accent: '#7A7040' },
  { name: 'Тёплый айвори', bg: '#EADCC8', accent: '#B07040' },
  { name: 'Мягкий шалфей', bg: '#C9D1C0', accent: '#5C6B55' },
  { name: 'Льняной', bg: '#DDD5C5', accent: '#8B6B4A' },
  { name: 'Пудровый песок', bg: '#E2D3C0', accent: '#A0583A' },
  { name: 'Молочный бетон', bg: '#D5D2CB', accent: '#5A5A55' },
];

const CHECKLIST_ITEMS = [
  { id: '1', text: 'Аудит цветовой палитры', done: true },
  { id: '2', text: 'Сетка и отступы', done: true },
  { id: '3', text: 'Типографика и ритм', done: false },
  { id: '4', text: 'Микровзаимодействия', done: false },
];

const GOLD_STYLE: React.CSSProperties = {
  background: 'linear-gradient(180deg, #E8D48B 0%, #C4A662 30%, #8B6914 60%, #D4AF37 100%)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  textShadow: '0 1px 1px rgba(0,0,0,0.8), 0 -1px 0 rgba(255,215,0,0.5)',
  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
};

const CUBIC_EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];
const BUTTON_HEIGHT = 80;

const staggerItem = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: CUBIC_EASE },
  },
};

const SandboxArchive: React.FC = () => {
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [items, setItems] = useState(CHECKLIST_ITEMS);
  const [time, setTime] = useState(new Date());
  const [colonVisible, setColonVisible] = useState(true);
  const timerRef = useRef<number | null>(null);

  const card = CARD_COLORS[cardIndex];

  const cycleCard = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCardIndex((prev) => (prev + 1) % CARD_COLORS.length);
  }, []);

  const toggleItem = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  }, []);

  useEffect(() => {
    let blinkPhase = 0;
    timerRef.current = window.setInterval(() => {
      setTime(new Date());
      blinkPhase = (blinkPhase + 1) % 2;
      setColonVisible(blinkPhase === 0);
    }, 500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = String(time.getSeconds()).padStart(2, '0');

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0A0B0D]">

      {/* ─── СЛОЙ 1: БЕЛЫЙ МРАМОР (Архив) — 100% покрытие ─── */}
      <div
        className="absolute inset-0 w-full h-full z-0"
        style={{
          backgroundImage: `url(${whiteMarbleTexture})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 w-full h-full z-0 bg-white/10" />

      {/* ─── КОНТЕНТ АРХИВА ─── */}
      <AnimatePresence>
        {isArchiveOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 px-6"
            style={{ paddingTop: 80, paddingBottom: BUTTON_HEIGHT + 20 }}>
            
            <motion.h2
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: CUBIC_EASE }}
              className="text-base font-bold tracking-[0.35em] uppercase font-mono mb-2"
              style={GOLD_STYLE}>
              Архив
            </motion.h2>

            <motion.div
              variants={staggerItem}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.25 }}
              className="w-[240px] rounded-[28px] p-6"
              style={{
                backgroundImage: `linear-gradient(175deg, rgba(205,83,52,0.12) 0%, rgba(205,83,52,0.04) 100%), url(${cardboardTexture})`,
                backgroundSize: '100% 100%, cover',
                backgroundPosition: 'center, center',
                backgroundBlendMode: 'normal, multiply',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.6)',
              }}>
              <div className="w-8 h-8 rounded-full mb-4" style={{ backgroundColor: '#CD5334', opacity: 0.8 }} />
              <h3 className="text-[#1E1C1A] text-lg font-bold mb-2">Дизайн-ревью</h3>
              <p className="text-[#8A8A8A] text-xs font-mono">Завершено · 1ч 24м</p>
            </motion.div>

            <motion.div
              variants={staggerItem}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.4 }}
              className="w-[240px] rounded-[28px] p-5"
              style={{
                backgroundImage: `url(${cardboardTexture})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundBlendMode: 'multiply',
                backgroundColor: 'rgba(0,0,0,0.03)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.5)',
              }}>
              <p className="text-[#5A5D62] text-sm font-mono font-bold tracking-widest mb-3">АВГУСТ 2026</p>
              <div className="grid grid-cols-7 gap-1">
                {['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'].map((d) => (
                  <span key={d} className="text-[10px] text-[#8A8A8A] font-mono text-center">{d}</span>
                ))}
                {Array.from({ length: 31 }, (_, i) => (
                  <span
                    key={i}
                    className={`text-[11px] font-mono text-center py-0.5 rounded-sm ${
                      i === 2 ? 'bg-[#CD5334]/25 text-[#1E1C1A] font-bold' : 'text-[#5A5D62]'
                    }`}>
                    {i + 1}
                  </span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── СЛОЙ 2: ТЁМНЫЙ СТОЛ (Главный) — 100% покрытие, уезжает вверх ─── */}
      <motion.div
        className="absolute inset-0 w-full h-full z-20"
        style={{
          backgroundImage: `url(${tableTexture})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        animate={{ y: isArchiveOpen ? '-100%' : '0%' }}
        transition={{ duration: 0.85, ease: CUBIC_EASE }}>
        
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            background: `
              radial-gradient(ellipse at 25% 15%, rgba(255,255,255,0.12) 0%, transparent 55%),
              radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0.03) 0%, transparent 40%),
              rgba(0,0,0,0.2)
            `,
          }}
        />

        <div className="absolute inset-0 flex items-center justify-center" style={{ paddingBottom: BUTTON_HEIGHT }}>
          <div
            onClick={cycleCard}
            className="relative w-[280px] rounded-[32px] cursor-pointer transition-all duration-500 flex flex-col overflow-hidden"
            style={{
              aspectRatio: '3 / 7',
              maxHeight: 'min(520px, 65vh)',
              backgroundImage: `
                linear-gradient(175deg, ${card.bg} 0%, ${card.bg}dd 100%),
                url(${cardboardTexture})
              `,
              backgroundSize: '100% 100%, cover',
              backgroundPosition: 'center, center',
              backgroundBlendMode: 'multiply',
              boxShadow: `
                18px 28px 50px -8px rgba(0,0,0,0.7),
                8px 14px 24px -4px rgba(0,0,0,0.4),
                inset 0 1.5px 1px rgba(255,255,255,0.7),
                inset 0 -2px 4px rgba(0,0,0,0.1)
              `,
              padding: '30px 22px 22px',
            }}>

            <div className="relative shrink-0 z-10 mb-8">
              <div
                className="relative inline-block rounded-full overflow-hidden"
                style={{
                  backgroundImage: `
                    linear-gradient(0deg, ${card.accent} 0%, ${card.accent} 100%),
                    url(${cardboardTexture})
                  `,
                  backgroundSize: '100% 100%, cover',
                  backgroundPosition: 'center, center',
                  backgroundBlendMode: 'multiply',
                  boxShadow: `
                    inset 3px 3px 6px rgba(0,0,0,0.55),
                    inset -1px -1px 3px rgba(0,0,0,0.3),
                    0 1px 0 rgba(255,255,255,0.6)
                  `,
                  borderTop: '1px solid rgba(0,0,0,0.4)',
                  borderLeft: '1px solid rgba(0,0,0,0.3)',
                  borderBottom: '1px solid rgba(255,255,255,0.5)',
                  borderRight: '1px solid rgba(255,255,255,0.4)',
                }}>
                <div
                  className="relative flex items-center justify-center"
                  style={{
                    paddingTop: '10px',
                    paddingBottom: '10px',
                    paddingLeft: '22px',
                    paddingRight: '22px',
                  }}>
                  <span
                    className="font-mono font-medium tracking-[0.25em]"
                    style={{
                      color: 'rgba(255,255,255,0.82)',
                      fontSize: '11px',
                      lineHeight: '1',
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    }}>
                    <span>{hours}</span>
                    <span
                      className="inline-block w-[0.8em] text-center transition-opacity duration-100"
                      style={{ opacity: colonVisible ? 1 : 0.08 }}>
                      :
                    </span>
                    <span>{minutes}</span>
                    <span
                      className="inline-block w-[0.8em] text-center transition-opacity duration-100"
                      style={{ opacity: colonVisible ? 1 : 0.08 }}>
                      :
                    </span>
                    <span>{seconds}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="relative z-10 mb-7">
              <h2
                className="text-[1.55rem] font-bold leading-tight"
                style={{
                  color: '#1E1C1A',
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                  letterSpacing: '-0.02em',
                }}>
                Дизайн-ревью<br />компонентов
              </h2>
            </div>

            <div className="relative z-10 mb-7">
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.03)',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)',
                }}>
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    onClick={(e) => toggleItem(e, item.id)}
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors hover:bg-black/[0.02]"
                    style={{
                      borderBottom:
                        index < items.length - 1
                          ? '1px solid rgba(0,0,0,0.08)'
                          : 'none',
                      borderTop:
                        index > 0
                          ? '1px solid rgba(255,255,255,0.4)'
                          : 'none',
                    }}>
                    <div
                      className="shrink-0 w-[18px] h-[18px] rounded-md flex items-center justify-center transition-all duration-200"
                      style={{
                        backgroundColor: item.done ? card.accent : 'rgba(0,0,0,0.06)',
                        boxShadow: item.done
                          ? `inset 0 1px 2px rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.15)`
                          : 'inset 0 1px 3px rgba(0,0,0,0.2), 0 1px 0 rgba(255,255,255,0.3)',
                      }}>
                      {item.done && (
                        <svg width="10" height="10" viewBox="0 0 11 11" fill="none">
                          <path
                            d="M1.5 5.5L4.5 8.5L9.5 2.5"
                            stroke="white"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      className="text-[13px] font-medium leading-tight transition-all duration-200"
                      style={{
                        color: item.done ? 'rgba(30,28,26,0.35)' : '#1E1C1A',
                        textDecoration: item.done ? 'line-through' : 'none',
                      }}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1" />

            <div className="relative shrink-0 z-10 space-y-2.5">
              <div
                className="pb-2.5"
                style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium" style={{ color: '#1E1C1A' }}>
                    Прогресс
                  </span>
                  <span
                    className="text-sm font-mono"
                    style={{ color: 'rgba(30,28,26,0.5)' }}>
                    {items.filter((i) => i.done).length} / {items.length}
                  </span>
                </div>
              </div>

              <div
                className="w-full h-1 rounded-full overflow-hidden"
                style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(items.filter((i) => i.done).length / items.length) * 100}%`,
                    backgroundColor: card.accent,
                    opacity: 0.7,
                  }}
                />
              </div>

              <div
                className="pt-2.5"
                style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}
              />

              <div className="flex justify-between items-center">
                <span
                  className="text-xs font-mono tracking-wide"
                  style={{ color: 'rgba(30,28,26,0.35)' }}>
                  CHECKLIST
                </span>
                <span
                  className="text-xs font-mono tracking-wide"
                  style={{ color: 'rgba(30,28,26,0.35)' }}>
                  01 АВГ / ПТ
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── НИЖНЯЯ ПЛАШКА — от края до края, инвертированный фон ─── */}
      <div
        className="absolute bottom-0 left-0 right-0 w-full z-30 flex items-center justify-center cursor-pointer"
        style={{
          height: BUTTON_HEIGHT,
          backgroundImage: `url(${isArchiveOpen ? tableTexture : whiteMarbleTexture})`,
          backgroundSize: 'cover',
          backgroundPosition: 'bottom center',
          boxShadow: isArchiveOpen
            ? '0 -8px 24px rgba(0,0,0,0.5)'
            : '0 -8px 24px rgba(0,0,0,0.7)',
          transition: 'background-image 0.6s ease, box-shadow 0.6s ease',
        }}
        onClick={() => setIsArchiveOpen(!isArchiveOpen)}>
        <div
          className="absolute inset-0"
          style={{
            background: isArchiveOpen ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.08)',
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
            className="relative z-10 text-sm font-bold tracking-[0.3em] uppercase font-mono"
            style={GOLD_STYLE}>
            {isArchiveOpen ? 'Главный экран' : 'Архив'}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SandboxArchive;