import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useDeckStore, getElapsedTime, getBatchLapTime } from '../store/useDeckStore';
import type { TaskCard as TaskCardType } from '../store/useDeckStore';

interface Props {
  card: TaskCardType;
  isTop: boolean;
}

const SWIPE_THRESHOLD = 120;

const TaskCard: React.FC<Props> = ({ card, isTop }) => {
  const {
    startTimer,
    pauseTimer,
    tick,
    completeCard,
    shelveCard,
    toggleCheckItem,
    completeBatchLap,
  } = useDeckStore();

  const rafRef = useRef<number | null>(null);
  const [, forceRender] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
  const cardOpacity = useTransform(x, [-300, -SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD, 300], [0.3, 1, 1, 1, 0.3]);

  const incubatorOpacity = useTransform(x, [-300, -SWIPE_THRESHOLD, 0], [1, 0.85, 0]);
  const incubatorScale = useTransform(x, [-300, -SWIPE_THRESHOLD, 0], [1, 0.95, 0.8]);
  const completeOpacity = useTransform(x, [0, SWIPE_THRESHOLD, 300], [0, 0.85, 1]);
  const completeScale = useTransform(x, [0, SWIPE_THRESHOLD, 300], [0.8, 0.95, 1]);

  useEffect(() => {
    if (!isTop) return;
    if (card.status !== 'running') {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    const updateLoop = () => {
      forceRender((n) => n + 1);
      tick();
      rafRef.current = requestAnimationFrame(updateLoop);
    };
    rafRef.current = requestAnimationFrame(updateLoop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [card.status, tick, isTop]);

  useEffect(() => {
    if (!isTop) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && card.status === 'running') {
        forceRender((n) => n + 1);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [card.status, isTop]);

  const displayTime = getElapsedTime(card);
  const displayLapTime = card.type === 'BATCH' ? getBatchLapTime(card) : 0;

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const typeBadge: Record<string, { emoji: string; label: string; color: string }> = {
    SINGLE: { emoji: '📍', label: 'Разовая', color: '#C4B998' },
    BATCH: { emoji: '🔄', label: 'Серия', color: '#B6C4B0' },
    CHECKLIST: { emoji: '✅', label: 'Список', color: '#C4A882' },
    TIMER: { emoji: '⏳', label: 'Таймер', color: '#C49898' },
  };

  const badge = typeBadge[card.type];

  const handleMainAction = () => {
    if (!isTop || isDragging) return;
    if (card.status === 'idle' || card.status === 'paused') {
      startTimer();
    } else if (card.status === 'running') {
      pauseTimer();
    }
  };

  const timerDisplay =
    card.type === 'TIMER' && card.targetTime
      ? Math.max(0, card.targetTime - displayTime)
      : displayTime;

  const isOvertime =
    card.type === 'TIMER' && card.targetTime && displayTime > card.targetTime;

  const handleDragEnd = (_: any, info: { offset: { x: number } }) => {
    if (!isTop) return;
    setIsDragging(false);
    setSwipeDirection(null);
    const offsetX = info.offset.x;
    if (offsetX < -SWIPE_THRESHOLD) {
      shelveCard();
    } else if (offsetX > SWIPE_THRESHOLD) {
      completeCard();
    }
  };

  const handleDrag = (_: any, info: { offset: { x: number } }) => {
    if (!isTop) return;
    const offsetX = info.offset.x;
    if (offsetX < -SWIPE_THRESHOLD) {
      setSwipeDirection('left');
    } else if (offsetX > SWIPE_THRESHOLD) {
      setSwipeDirection('right');
    } else {
      setSwipeDirection(null);
    }
  };

  return (
    <motion.div
      className="relative w-full"
      style={{ perspective: 1000 }}>
      <motion.div
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[calc(100%+16px)] z-0 pointer-events-none"
        style={{ opacity: isTop ? incubatorOpacity : 0, scale: incubatorScale }}>
        <div
          className="flex items-center gap-2 bg-[#23272A] px-4 py-3 rounded-xl"
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
          <span className="text-lg">🧺</span>
          <span className="text-[#C4B998] text-sm font-medium">Отложить</span>
        </div>
      </motion.div>

      <motion.div
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[calc(100%+16px)] z-0 pointer-events-none"
        style={{ opacity: isTop ? completeOpacity : 0, scale: completeScale }}>
        <div
          className="flex items-center gap-2 bg-[#23272A] px-4 py-3 rounded-xl"
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
          <span className="text-lg">🏁</span>
          <span className="text-[#B6C4B0] text-sm font-medium">Завершить</span>
        </div>
      </motion.div>

      <motion.div
        drag={isTop ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragStart={() => {
          if (isTop) setIsDragging(true);
        }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        whileTap={isTop ? { cursor: 'grabbing' } : {}}
        onClick={handleMainAction}
        className={`relative w-full min-h-[420px] px-6 py-8 rounded-[20px] select-none transition-shadow duration-200 ${
          isTop ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
        } ${
          swipeDirection === 'left'
            ? 'ring-2 ring-[#C4B998]/40'
            : swipeDirection === 'right'
            ? 'ring-2 ring-[#B6C4B0]/40'
            : ''
        }`}
        style={{
          x,
          rotate,
          opacity: isTop ? cardOpacity : undefined,
          background: 'linear-gradient(160deg, #EBE7DC 0%, #E3DED2 100%)',
          boxShadow: `
            0 16px 32px rgba(0,0,0,0.35),
            0 4px 0 #C4BFB2,
            inset 0 1px 0 rgba(255,255,255,0.5)
          `,
        }}>
        <div className="flex items-center gap-2 mb-6 pointer-events-none">
          <span
            className="text-xs px-3 py-1 rounded-full font-medium tracking-wide"
            style={{ backgroundColor: `${badge.color}18`, color: badge.color }}>
            {badge.emoji} {badge.label}
          </span>
        </div>

        <h2 className="text-[#2A2C2E] text-2xl font-bold mb-8 leading-tight pointer-events-none">
          {card.title}
        </h2>

        {card.type === 'CHECKLIST' && card.checklist && (
          <div className="mb-8 space-y-3">
            {card.checklist.slice(0, 4).map((item) => (
              <button
                key={item.id}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCheckItem(item.id);
                }}
                className="flex items-center gap-3 w-full text-left">
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                    item.done ? 'bg-[#B6C4B0] border-[#B6C4B0]' : 'border-[#8A8A8A]'
                  }`}
                  style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.15)' }}>
                  {item.done && <span className="text-white text-xs">✓</span>}
                </div>
                <span
                  className={`text-sm ${
                    item.done ? 'line-through text-[#8A8A8A]' : 'text-[#2A2C2E]'
                  }`}>
                  {item.text}
                </span>
              </button>
            ))}
          </div>
        )}

        {card.type === 'BATCH' && (
          <div className="mb-6 pointer-events-none">
            <div className="flex justify-between text-sm text-[#6A6C6E] mb-2">
              <span>Прогресс</span>
              <span>
                {card.batchCompleted || 0} / {card.batchTotal || 0}
              </span>
            </div>
            <div
              className="w-full h-2 bg-[#D4CFC4] rounded-full overflow-hidden"
              style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)' }}>
              <div
                className="h-full bg-[#B6C4B0] rounded-full transition-all duration-300"
                style={{
                  width: `${((card.batchCompleted || 0) / (card.batchTotal || 1)) * 100}%`,
                }}
              />
            </div>
            {card.batchCompleted && card.batchCompleted > 0 && (
              <p className="text-xs text-[#8A8A8A] mt-2">
                Среднее: {formatTime(displayTime / card.batchCompleted)} / шт
                {displayLapTime > 0 && ` · Текущий: ${formatTime(displayLapTime)}`}
              </p>
            )}
          </div>
        )}

        <div
          className="mb-8 py-4 px-6 bg-[#D9D4C8] rounded-xl text-center pointer-events-none"
          style={{
            boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.4)',
          }}>
          <span
            className={`text-4xl font-mono font-bold tracking-wider ${
              isOvertime ? 'text-[#C49898]' : 'text-[#2A2C2E]'
            }`}>
            {formatTime(timerDisplay)}
          </span>
          {card.type === 'TIMER' && card.targetTime && (
            <p
              className={`text-sm mt-1 ${
                isOvertime ? 'text-[#C49898] font-medium' : 'text-[#8A8A8A]'
              }`}>
              {isOvertime ? '⚠️ Время вышло' : `Цель: ${formatTime(card.targetTime)}`}
            </p>
          )}
        </div>

        {isTop && (
          <>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                handleMainAction();
              }}
              className="w-full py-4 rounded-xl text-xl font-bold uppercase tracking-widest transition-all active:scale-[0.97]"
              style={{
                backgroundColor: card.status === 'running' ? '#C4A882' : '#2A2C2E',
                color: '#EBE7DC',
                boxShadow:
                  card.status === 'running'
                    ? '0 4px 0 #A8906A, 0 8px 15px rgba(0,0,0,0.25)'
                    : '0 4px 0 #141518, 0 8px 15px rgba(0,0,0,0.25)',
              }}>
              {card.status === 'running' ? '⏸ ПАУЗА' : '▶ СТАРТ'}
            </button>

            {card.type === 'BATCH' && card.status === 'running' && (
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  completeBatchLap();
                }}
                className="w-full mt-3 py-3 rounded-xl text-sm font-medium text-[#B6C4B0] border border-[#B6C4B0]/30 active:scale-[0.97] transition-all">
                ✅ Завершить круг
              </button>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default TaskCard;