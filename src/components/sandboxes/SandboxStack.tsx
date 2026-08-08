import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import tableTexture from '../../assets/black-main-background.avif';
import cardboardTexture from '../../assets/cardboard.avif';
import cardBackTexture from '../../assets/card_back.png';

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

const COMPACT_STEP = 2.5;
const DEFAULT_PREV_OFFSET = 13;
const DEFAULT_LAST_OFFSET = 60;
const DEFAULT_PREV_ANGLE = 4;
const DEFAULT_LAST_ANGLE = 7;

const SandboxStack: React.FC = () => {
  const [cardIndex, setCardIndex] = useState(0);
  const [items, setItems] = useState(CHECKLIST_ITEMS);
  const [time, setTime] = useState(new Date());
  const [colonVisible, setColonVisible] = useState(true);
  const [stackCount, setStackCount] = useState(5);
  const [lastCardAngle, setLastCardAngle] = useState(DEFAULT_LAST_ANGLE);
  const [prevCardAngle, setPrevCardAngle] = useState(DEFAULT_PREV_ANGLE);
  const [lastCardOffset, setLastCardOffset] = useState(DEFAULT_LAST_OFFSET);
  const [prevCardOffset, setPrevCardOffset] = useState(DEFAULT_PREV_OFFSET);
  const [showDebug, setShowDebug] = useState(false);
  const timerRef = useRef<number | null>(null);

  const card = CARD_COLORS[cardIndex];

  const offsets = useMemo(() => {
    return Array.from({ length: stackCount }, (_, i) => {
      const isLast = i === stackCount - 1;
      const isPreLast = i === stackCount - 2;

      let x: number;
      let rotate: number;

      if (stackCount === 1) {
        x = lastCardOffset + Math.sin(i * 1.5) * 0.8;
        rotate = lastCardAngle + Math.sin(i * 0.9) * 0.3;
      } else if (stackCount === 2) {
        if (isPreLast) {
          x = prevCardOffset + Math.sin(i * 1.5) * 0.8;
          rotate = prevCardAngle + Math.sin(i * 0.9) * 0.3;
        } else {
          x = lastCardOffset + Math.sin(i * 1.5) * 0.8;
          rotate = lastCardAngle + Math.sin(i * 0.9) * 0.3;
        }
      } else {
        if (isLast) {
          const compactX = (stackCount - 2) * COMPACT_STEP;
          x = compactX + lastCardOffset + Math.sin(i * 1.5) * 0.8;
          rotate = lastCardAngle + Math.sin(i * 0.9) * 0.3;
        } else if (isPreLast) {
          const compactX = (stackCount - 2) * COMPACT_STEP;
          x = compactX + prevCardOffset + Math.sin(i * 1.5) * 0.8;
          rotate = prevCardAngle + Math.sin(i * 0.9) * 0.3;
        } else {
          x = (i + 1) * COMPACT_STEP + Math.sin(i * 1.5) * 0.8;
          rotate = (i + 1) * 0.2 + Math.sin(i * 0.9) * 0.3;
        }
      }

      const y = (i + 1) * 0.3 + Math.cos(i * 2.1) * 0.5;

      return { x, y, rotate };
    });
  }, [stackCount, lastCardAngle, prevCardAngle, lastCardOffset, prevCardOffset]);

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
    <div className="fixed inset-0 flex items-center justify-center select-none overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${tableTexture})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 25% 15%, rgba(255,255,255,0.12) 0%, transparent 55%),
            radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0.03) 0%, transparent 40%),
            rgba(0,0,0,0.2)
          `,
        }}
      />

      <div className="relative w-[280px] flex items-center justify-center" style={{ maxHeight: 'min(620px, 78vh)' }}>
        
        {offsets.map((offset, index) => {
          const isLast = index === stackCount - 1;
          const isPreLast = index === stackCount - 2;
          const isAccent = isLast || isPreLast;

          return (
            <div
              key={`stack-${index}`}
              className="absolute rounded-[32px] overflow-hidden"
              style={{
                width: '280px',
                aspectRatio: '3 / 7',
                maxHeight: 'min(520px, 75vh)',
                backgroundImage: `
                  url(${cardBackTexture}),
                  url(${cardboardTexture})
                `,
                backgroundSize: 'cover, cover',
                backgroundPosition: 'center, center',
                backgroundBlendMode: 'normal, multiply',
                transform: `translate3d(${offset.x}px, ${offset.y}px, 0) rotate(${offset.rotate}deg)`,
                transformOrigin: 'bottom left',
                zIndex: 100 - 1 - index,
                boxShadow: isAccent
                  ? `
                      -1px 0 2px rgba(0,0,0,0.4),
                      4px 6px 18px rgba(0,0,0,0.6),
                      1px 2px 6px rgba(0,0,0,0.5)
                    `
                  : `
                      -1px 0 2px rgba(0,0,0,0.4),
                      2px 2px 6px rgba(0,0,0,0.5)
                    `,
              }}
            />
          );
        })}

        <div
          onClick={cycleCard}
          className="relative w-[280px] rounded-[32px] cursor-pointer transition-all duration-500 flex flex-col overflow-hidden z-[100]"
          style={{
            aspectRatio: '3 / 7',
            maxHeight: 'min(520px, 75vh)',
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

      <div
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-4 px-5 py-3 rounded-2xl"
        style={{
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
        <button
          onClick={() => setStackCount(Math.max(0, stackCount - 1))}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white/70 font-mono text-lg active:scale-90 transition-transform"
          style={{ background: 'rgba(255,255,255,0.06)' }}>
          −
        </button>
        <span className="text-white/70 font-mono text-xs min-w-[90px] text-center">
          В стопке: {stackCount}
        </span>
        <button
          onClick={() => setStackCount(Math.min(20, stackCount + 1))}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white/70 font-mono text-lg active:scale-90 transition-transform"
          style={{ background: 'rgba(255,255,255,0.06)' }}>
          +
        </button>
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="px-3 py-1.5 rounded-xl text-white/50 font-mono text-[10px] active:scale-90 transition-transform"
          style={{ background: 'rgba(255,255,255,0.04)' }}>
          {showDebug ? 'Скрыть' : 'Отладка'}
        </button>
      </div>

      {showDebug && (
        <div
          className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[200] px-5 py-4 rounded-2xl space-y-3 w-[300px]"
          style={{
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
          <p className="text-white/40 font-mono text-[10px] uppercase tracking-widest mb-2">Хвост стопки</p>
          
          <div className="space-y-1.5">
            <div className="flex justify-between text-white/50 font-mono text-[10px]">
              <span>Сдвиг предп.</span>
              <span>{prevCardOffset}px</span>
            </div>
            <input
              type="range"
              min={10}
              max={80}
              value={prevCardOffset}
              onChange={(e) => setPrevCardOffset(Number(e.target.value))}
              className="w-full h-1 accent-[#C4B998]"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-white/50 font-mono text-[10px]">
              <span>Сдвиг последн.</span>
              <span>{lastCardOffset}px</span>
            </div>
            <input
              type="range"
              min={10}
              max={80}
              value={lastCardOffset}
              onChange={(e) => setLastCardOffset(Number(e.target.value))}
              className="w-full h-1 accent-[#C4B998]"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-white/50 font-mono text-[10px]">
              <span>Угол предп.</span>
              <span>{prevCardAngle}°</span>
            </div>
            <input
              type="range"
              min={-15}
              max={15}
              value={prevCardAngle}
              onChange={(e) => setPrevCardAngle(Number(e.target.value))}
              className="w-full h-1 accent-[#C4B998]"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-white/50 font-mono text-[10px]">
              <span>Угол последн.</span>
              <span>{lastCardAngle}°</span>
            </div>
            <input
              type="range"
              min={-15}
              max={15}
              value={lastCardAngle}
              onChange={(e) => setLastCardAngle(Number(e.target.value))}
              className="w-full h-1 accent-[#C4B998]"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SandboxStack;