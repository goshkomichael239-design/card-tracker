import React, { useState, useCallback, useEffect, useRef } from 'react';

interface CardColorPreset {
  name: string;
  bg: string;
  accent: string;
}

const TABLE_COLORS = [
  { name: 'Глубокий базальт', value: '#1A1C1E' },
  { name: 'Изумрудный сланец', value: '#141C18' },
  { name: 'Тёмный индиго', value: '#151A26' },
  { name: 'Глиняный терракот', value: '#1C1817' },
  { name: 'Чароит', value: '#191720' },
  { name: 'Графитово-зелёный', value: '#171C19' },
  { name: 'Мокрый асфальт', value: '#181A1C' },
  { name: 'Дымчатый кварц', value: '#1A1B1E' },
  { name: 'Грозовая туча', value: '#1B1C1F' },
  { name: 'Чёрный сланец', value: '#191A1C' },
];

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

const PAPER_TEXTURE_URL = 'https://www.transparenttextures.com/patterns/cardboard-flat.png';

const SandboxView: React.FC = () => {
  const [tableIndex, setTableIndex] = useState(3);
  const [cardIndex, setCardIndex] = useState(0);
  const [showHud, setShowHud] = useState(true);
  const [items, setItems] = useState(CHECKLIST_ITEMS);
  const [time, setTime] = useState(new Date());
  const [colonVisible, setColonVisible] = useState(true);
  const timerRef = useRef<number | null>(null);

  const tableColor = TABLE_COLORS[tableIndex].value;
  const tableName = TABLE_COLORS[tableIndex].name;
  const card = CARD_COLORS[cardIndex];

  const cycleTable = useCallback(() => {
    setTableIndex((prev) => (prev + 1) % TABLE_COLORS.length);
  }, []);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyT') cycleTable();
      if (e.code === 'KeyC') setCardIndex((prev) => (prev + 1) % CARD_COLORS.length);
      if (e.code === 'KeyH') setShowHud((prev) => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cycleTable]);

  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = String(time.getSeconds()).padStart(2, '0');

  return (
    <div
      onClick={cycleTable}
      className="fixed inset-0 flex items-center justify-center cursor-pointer select-none overflow-hidden"
      style={{ background: tableColor }}>

      {/* Рельефная текстура камня */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='stone'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='6' seed='3' result='noise'/%3E%3CfeSpecularLighting surfaceScale='8' specularConstant='0.6' specularExponent='12' lighting-color='%23ffffff' in='noise' result='specular'%3E%3CfeDistantLight azimuth='135' elevation='35'/%3E%3C/feSpecularLighting%3E%3CfeComposite operator='in' in='specular' in2='SourceAlpha' result='specularMasked'/%3E%3CfeComposite operator='arithmetic' k1='0' k2='1' k3='0.15' k4='0' in='SourceGraphic' in2='specularMasked'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23stone)' opacity='0.35'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '400px 400px',
        }}
      />

      {/* Микро-шум */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '180px 180px',
        }}
      />

      {/* Свет сверху-слева */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 25% 15%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 30%, transparent 65%)',
        }}
      />

      {/* Рассеянный подсвет */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0.04) 0%, transparent 45%)',
        }}
      />

      {/* Карточка */}
      <div
        onClick={cycleCard}
        className="relative w-[280px] rounded-[32px] cursor-pointer transition-all duration-500 flex flex-col overflow-hidden"
        style={{
          aspectRatio: '3 / 7',
          maxHeight: 'min(520px, 75vh)',
          background: `linear-gradient(175deg, ${card.bg} 0%, ${card.bg}dd 100%)`,
          boxShadow: `
            18px 28px 50px -8px rgba(0,0,0,0.7),
            8px 14px 24px -4px rgba(0,0,0,0.4),
            inset 0 1.5px 1px rgba(255,255,255,0.7),
            inset 0 -2px 4px rgba(0,0,0,0.1)
          `,
          padding: '30px 22px 22px',
        }}>

        {/* Текстура хлопковой бумаги — PNG, mix-blend-mode: multiply */}
        <div
          className="absolute inset-0 rounded-[32px] pointer-events-none z-0"
          style={{
            backgroundImage: `url("${PAPER_TEXTURE_URL}")`,
            backgroundRepeat: 'repeat',
            mixBlendMode: 'multiply',
            opacity: 0.65,
          }}
        />

        {/* Верх: прорезанное окно времени с физикой среза */}
        <div className="relative shrink-0 z-10 mb-8">
          <div
            className="relative inline-block rounded-full overflow-hidden"
            style={{
              backgroundColor: card.accent,
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
            {/* Текстура внутри вырезанного окна */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                backgroundImage: `url("${PAPER_TEXTURE_URL}")`,
                backgroundRepeat: 'repeat',
                mixBlendMode: 'multiply',
                opacity: 0.5,
              }}
            />
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

        {/* Заголовок */}
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

        {/* Чек-лист */}
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

        {/* Гибкий спейсер */}
        <div className="flex-1" />

        {/* Низ: прогресс и дата */}
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

      {/* HUD */}
      {showHud && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed top-5 right-5 text-right z-20 space-y-1.5"
          style={{ opacity: 0.5 }}>
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-2">Sandbox</p>
          <p className="text-[11px] font-mono text-white/35">
            Стол · <span className="text-white/55">{tableName}</span>
          </p>
          <p className="text-[11px] font-mono text-white/35">
            Карта · <span className="text-white/55">{card.name}</span>
          </p>
          <p className="text-[11px] font-mono text-white/35">
            Акцент ·{' '}
            <span style={{ color: card.accent }}>
              {card.accent}
            </span>
          </p>
          <div className="pt-2 space-y-0.5">
            <p className="text-[9px] font-mono text-white/20">T — стол</p>
            <p className="text-[9px] font-mono text-white/20">C — карта</p>
            <p className="text-[9px] font-mono text-white/20">H — скрыть HUD</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SandboxView;