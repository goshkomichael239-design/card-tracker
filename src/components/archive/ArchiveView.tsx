import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import cardboardTexture from '../../assets/cardboard.avif';
import whiteMarbleTexture from '../../assets/white_marble.png';
import type { VisualCard } from '../../app/cardTheme';
import { MONTH_NAMES_RU, startOfLocalDay } from '../../app/dateTimeUtils';
import { CardSwitcher } from '../card-switcher/CardSwitcher';
import type { BackupImportResult } from '../../app/backupUtils';
import { ArchiveCard } from './ArchiveCard';
import { BackupControls } from './BackupControls';

interface ArchiveViewProps { isOpen: boolean; archivedCards: VisualCard[]; firstCardCreatedAt?: string; onExportBackup: () => void; onImportBackup: (text: string) => BackupImportResult; }
const CUBIC_EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];
const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const clampDate = (candidate: Date, minimum: Date, maximum: Date) => { const value = startOfLocalDay(candidate); return value < minimum ? minimum : value > maximum ? maximum : value; };
const shiftMonth = (date: Date, direction: -1 | 1) => { const start = new Date(date.getFullYear(), date.getMonth() + direction, 1); return new Date(start.getFullYear(), start.getMonth(), Math.min(date.getDate(), daysInMonth(start.getFullYear(), start.getMonth()))); };
const shiftYear = (date: Date, direction: -1 | 1) => { const year = date.getFullYear() + direction; return new Date(year, date.getMonth(), Math.min(date.getDate(), daysInMonth(year, date.getMonth()))); };

export const ArchiveView: React.FC<ArchiveViewProps> = ({ isOpen, archivedCards, firstCardCreatedAt, onExportBackup, onImportBackup }) => {
  const [selectedDate, setSelectedDate] = useState(() => startOfLocalDay(new Date()));
  const [activeId, setActiveId] = useState<string | null>(null);
  const pointerRef = useRef<number | null>(null);
  const todayKey = dayKey(new Date());
  const today = useMemo(() => startOfLocalDay(new Date()), [todayKey]);
  const firstDate = useMemo(() => { const parsed = firstCardCreatedAt ? new Date(firstCardCreatedAt) : today; return Number.isFinite(parsed.getTime()) ? startOfLocalDay(parsed) : today; }, [firstCardCreatedAt, today]);
  const selectedKey = dayKey(selectedDate);
  const dayCards = useMemo(() => archivedCards.filter((card) => card.completedAt && dayKey(new Date(card.completedAt)) === selectedKey), [archivedCards, selectedKey]);
  const activeCard = dayCards.find((card) => card.id === activeId) ?? dayCards[0];
  const activeIndex = activeCard ? dayCards.findIndex((card) => card.id === activeCard.id) : -1;

  useEffect(() => { const image = new Image(); image.src = whiteMarbleTexture; void image.decode?.().catch(() => undefined); }, []);
  useEffect(() => { if (isOpen) setSelectedDate(startOfLocalDay(new Date())); }, [isOpen]);
  useEffect(() => {
    setSelectedDate((current) => {
      const next = clampDate(current, firstDate, today);
      return next.getTime() === current.getTime() ? current : next;
    });
  }, [firstDate, today]);
  useEffect(() => { setActiveId(dayCards[0]?.id ?? null); }, [selectedKey, archivedCards]);
  const selectDate = useCallback((date: Date) => setSelectedDate(clampDate(date, firstDate, startOfLocalDay(new Date()))), [firstDate]);
  const moveCard = useCallback((direction: -1 | 1) => { if (dayCards.length < 2 || activeIndex < 0) return; setActiveId(dayCards[(activeIndex + direction + dayCards.length) % dayCards.length]!.id); }, [activeIndex, dayCards]);
  const canChange = (date: Date) => clampDate(date, firstDate, today).getTime() !== selectedDate.getTime();

  useEffect(() => { if (!isOpen) return; const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'ArrowDown' || event.key === 'ArrowRight') moveCard(1); if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') moveCard(-1); }; window.addEventListener('keydown', onKeyDown); return () => window.removeEventListener('keydown', onKeyDown); }, [isOpen, moveCard]);

  return <div className={`absolute inset-0 z-[25] h-full w-full overflow-hidden ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
    <motion.div initial={false} animate={{ y: isOpen ? '0%' : '100%' }} transition={{ duration: 0.85, ease: CUBIC_EASE }} className="absolute inset-0 h-full w-full" style={{ willChange: 'transform' }}>
      <div className="absolute inset-0 h-full w-full" style={{ backgroundImage: `url(${whiteMarbleTexture})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div className="absolute inset-0 bg-white/10" />
      <AnimatePresence>{isOpen && <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="absolute inset-0 flex flex-col items-center overflow-y-auto px-5 pb-[98px] text-center" onPointerDown={(event) => { pointerRef.current = event.clientY; }} onPointerUp={(event) => { const start = pointerRef.current; pointerRef.current = null; if (start === null || Math.abs(event.clientY - start) < 48) return; moveCard(event.clientY < start ? 1 : -1); }} onPointerCancel={() => { pointerRef.current = null; }}>
        <h2 className="mt-[5vh] shrink-0 font-mono text-[clamp(24px,4vw,40px)] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(174,143,75,0.78)', textShadow: '0 1px 0 rgba(255,255,255,0.72), 0 -1px 0 rgba(105,82,42,0.42), 0 2px 5px rgba(76,59,29,0.22)' }}>ЖУРНАЛ КАРТОЧЕК</h2>
        <ArchiveCalendar date={selectedDate} onChangeYear={(d) => selectDate(shiftYear(selectedDate, d))} onChangeMonth={(d) => selectDate(shiftMonth(selectedDate, d))} onChangeDay={(d) => selectDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + d))} canChangeYear={(d) => canChange(shiftYear(selectedDate, d))} canChangeMonth={(d) => canChange(shiftMonth(selectedDate, d))} canChangeDay={(d) => canChange(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + d))} />
        {activeCard ? <><ArchiveCard cards={dayCards} activeCardId={activeCard.id} />{dayCards.length > 1 && <CardSwitcher cards={dayCards} activeCardId={activeCard.id} onSelectCard={setActiveId} onNextCard={() => moveCard(1)} onPreviousCard={() => moveCard(-1)} mode="archive" />}</> : <div className="mt-8 flex h-[260px] w-[min(396px,88vw)] shrink-0 items-center justify-center rounded-[25px] border border-black/10 px-10" style={{ backgroundColor: 'rgba(247,242,232,0.68)', backgroundImage: `url(${cardboardTexture})`, backgroundBlendMode: 'soft-light', boxShadow: '0 16px 28px rgba(54,42,31,0.16), inset 0 1px rgba(255,255,255,0.7)' }}><p className="font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: 'rgba(63,57,50,0.62)' }}>В этот день завершённых карточек нет</p></div>}
        <BackupControls onExport={onExportBackup} onImport={onImportBackup} />
      </motion.section>}</AnimatePresence>
    </motion.div>
  </div>;
};

interface CalendarProps { date: Date; onChangeYear: (d: -1 | 1) => void; onChangeMonth: (d: -1 | 1) => void; onChangeDay: (d: -1 | 1) => void; canChangeYear: (d: -1 | 1) => boolean; canChangeMonth: (d: -1 | 1) => boolean; canChangeDay: (d: -1 | 1) => boolean; }
const ArchiveCalendar: React.FC<CalendarProps> = ({ date, onChangeYear, onChangeMonth, onChangeDay, canChangeYear, canChangeMonth, canChangeDay }) => <div className="mt-5 w-[min(380px,88vw)] shrink-0 overflow-hidden rounded-[18px] border" style={{ borderColor: 'rgba(82,69,56,0.22)', backgroundColor: 'rgba(235,229,214,0.76)', backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.35), transparent 58%), url(${cardboardTexture})`, backgroundSize: '100% 100%, cover', backgroundBlendMode: 'soft-light, multiply', boxShadow: '0 7px 14px rgba(67,56,43,0.16), inset 0 1px rgba(255,255,255,0.65)' }}><CalendarRow label="Год" value={String(date.getFullYear())} onPrevious={() => onChangeYear(-1)} onNext={() => onChangeYear(1)} canPrevious={canChangeYear(-1)} canNext={canChangeYear(1)} /><CalendarRow label="Месяц" value={MONTH_NAMES_RU[date.getMonth()]!} onPrevious={() => onChangeMonth(-1)} onNext={() => onChangeMonth(1)} canPrevious={canChangeMonth(-1)} canNext={canChangeMonth(1)} /><CalendarRow label="День" value={String(date.getDate()).padStart(2, '0')} onPrevious={() => onChangeDay(-1)} onNext={() => onChangeDay(1)} canPrevious={canChangeDay(-1)} canNext={canChangeDay(1)} isLast /></div>;
const CalendarRow: React.FC<{ label: string; value: string; onPrevious: () => void; onNext: () => void; canPrevious: boolean; canNext: boolean; isLast?: boolean }> = ({ label, value, onPrevious, onNext, canPrevious, canNext, isLast }) => <div className={`grid h-[42px] grid-cols-[52px_1fr_52px] items-center ${isLast ? '' : 'border-b'}`} style={{ borderColor: 'rgba(82,69,56,0.16)' }}><CalendarArrow direction="previous" onClick={onPrevious} disabled={!canPrevious} label={`Предыдущий ${label.toLowerCase()}`} /><div className="flex items-baseline justify-center gap-3 font-mono"><span className="text-[9px] uppercase tracking-[0.14em]" style={{ color: 'rgba(61,55,48,0.55)' }}>{label}</span><span className="text-[14px] font-bold uppercase tracking-[0.08em]" style={{ color: '#3F3932' }}>{value}</span></div><CalendarArrow direction="next" onClick={onNext} disabled={!canNext} label={`Следующий ${label.toLowerCase()}`} /></div>;
const CalendarArrow: React.FC<{ direction: 'previous' | 'next'; onClick: () => void; disabled: boolean; label: string }> = ({ direction, onClick, disabled, label }) => <button type="button" onClick={onClick} disabled={disabled} aria-label={label} className="h-full font-mono text-xl transition-opacity disabled:cursor-default" style={{ color: disabled ? 'rgba(63,57,50,0.2)' : 'rgba(63,57,50,0.78)' }}>{direction === 'previous' ? '‹' : '›'}</button>;
