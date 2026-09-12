import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import cardboardTexture from '../../assets/cardboard.avif';
import cardBackTexture from '../../assets/card_back.png';
import whiteMarbleTexture from '../../assets/white_marble.png';
import { CARD_RADIUS, PALETTES, type VisualCard } from '../../app/cardTheme';
import {
  MONTH_NAMES_RU,
  formatCompletedDate,
  startOfLocalDay,
} from '../../app/dateTimeUtils';

interface ArchiveViewProps {
  isOpen: boolean;
  archivedCards: VisualCard[];
  firstCardCreatedAt?: string;
}

const CUBIC_EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];
const ARCHIVE_STACK_LAYER_LIMIT = 6;

const getLocalDayKey = (date: Date): string =>
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

const getDayCount = (year: number, month: number): number =>
  new Date(year, month + 1, 0).getDate();

const clampArchiveDate = (
  candidate: Date,
  minimum: Date,
  maximum: Date,
): Date => {
  const day = startOfLocalDay(candidate);

  if (day.getTime() < minimum.getTime()) {
    return minimum;
  }

  if (day.getTime() > maximum.getTime()) {
    return maximum;
  }

  return day;
};

const changeArchiveMonth = (date: Date, direction: -1 | 1): Date => {
  const monthStart = new Date(date.getFullYear(), date.getMonth() + direction, 1);
  const day = Math.min(
    date.getDate(),
    getDayCount(monthStart.getFullYear(), monthStart.getMonth()),
  );

  return new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
};

const changeArchiveYear = (date: Date, direction: -1 | 1): Date => {
  const year = date.getFullYear() + direction;
  const day = Math.min(date.getDate(), getDayCount(year, date.getMonth()));

  return new Date(year, date.getMonth(), day);
};

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  isOpen,
  archivedCards,
  firstCardCreatedAt,
}) => {
  const [selectedDate, setSelectedDate] = useState(() =>
    startOfLocalDay(new Date()),
  );
  const [activeArchivedCardId, setActiveArchivedCardId] = useState<string | null>(
    null,
  );
  const today = startOfLocalDay(new Date());
  const firstAvailableDateTimestamp = useMemo(() => {
    const parsedDate = firstCardCreatedAt
      ? new Date(firstCardCreatedAt)
      : null;

    return parsedDate && Number.isFinite(parsedDate.getTime())
      ? startOfLocalDay(parsedDate).getTime()
      : null;
  }, [firstCardCreatedAt]);
  const firstAvailableDate = new Date(
    firstAvailableDateTimestamp ?? today.getTime(),
  );
  const selectedDayKey = getLocalDayKey(selectedDate);
  const cardsForSelectedDate = useMemo(
    () =>
      archivedCards.filter(
        (card) =>
          card.completedAt &&
          getLocalDayKey(new Date(card.completedAt)) === selectedDayKey,
      ),
    [archivedCards, selectedDayKey],
  );
  const activeArchivedCard =
    cardsForSelectedDate.find((card) => card.id === activeArchivedCardId) ??
    cardsForSelectedDate[0];
  const activeArchivedCardIndex = activeArchivedCard
    ? cardsForSelectedDate.findIndex((card) => card.id === activeArchivedCard.id)
    : -1;
  const stackCards = activeArchivedCard
    ? Array.from(
        {
          length: Math.min(
            ARCHIVE_STACK_LAYER_LIMIT,
            Math.max(0, cardsForSelectedDate.length - 1),
          ),
        },
        (_, index) =>
          cardsForSelectedDate[
            (activeArchivedCardIndex + index + 1) % cardsForSelectedDate.length
          ]!,
      )
    : [];

  useEffect(() => {
    const image = new Image();
    image.src = whiteMarbleTexture;
    void image.decode?.().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelectedDate(startOfLocalDay(new Date()));
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedDate((current) =>
      clampArchiveDate(
        current,
        new Date(firstAvailableDateTimestamp ?? Date.now()),
        startOfLocalDay(new Date()),
      ),
    );
  }, [firstAvailableDateTimestamp]);

  useEffect(() => {
    setActiveArchivedCardId(cardsForSelectedDate[0]?.id ?? null);
  }, [cardsForSelectedDate, selectedDayKey]);

  const selectDate = useCallback(
    (candidate: Date) => {
      setSelectedDate(
        clampArchiveDate(candidate, firstAvailableDate, startOfLocalDay(new Date())),
      );
    },
    [firstAvailableDate],
  );

  const moveArchivedCard = useCallback(
    (direction: -1 | 1) => {
      if (cardsForSelectedDate.length <= 1 || activeArchivedCardIndex < 0) {
        return;
      }

      const nextIndex =
        (activeArchivedCardIndex + direction + cardsForSelectedDate.length) %
        cardsForSelectedDate.length;
      setActiveArchivedCardId(cardsForSelectedDate[nextIndex]!.id);
    },
    [activeArchivedCardIndex, cardsForSelectedDate],
  );

  const canChangeDate = (candidate: Date): boolean =>
    clampArchiveDate(candidate, firstAvailableDate, today).getTime() !==
    selectedDate.getTime();
  const hasCardsForSelectedDate = cardsForSelectedDate.length > 0;

  return (
    <div
      className={`absolute inset-0 z-[25] h-full w-full overflow-hidden ${
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      <motion.div
        initial={false}
        animate={{ y: isOpen ? '0%' : '100%' }}
        transition={{ duration: 0.85, ease: CUBIC_EASE }}
        className="absolute inset-0 h-full w-full"
        style={{ willChange: 'transform' }}
      >
        <div
          className="absolute inset-0 h-full w-full"
          style={{
            backgroundImage: `url(${whiteMarbleTexture})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-white/10" />

        <AnimatePresence>
          {isOpen && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 flex flex-col items-center overflow-y-auto px-5 pb-[98px] pt-8 text-center"
            >
              <h2
                className="font-mono text-[11px] font-bold uppercase tracking-[0.38em]"
                style={{
                  color: '#5A5D62',
                  textShadow: '0 1px 0 rgba(255,255,255,0.7)',
                }}
              >
                Журнал карточек
              </h2>

              <ArchiveCalendar
                date={selectedDate}
                onChangeYear={(direction) =>
                  selectDate(changeArchiveYear(selectedDate, direction))
                }
                onChangeMonth={(direction) =>
                  selectDate(changeArchiveMonth(selectedDate, direction))
                }
                onChangeDay={(direction) =>
                  selectDate(
                    new Date(
                      selectedDate.getFullYear(),
                      selectedDate.getMonth(),
                      selectedDate.getDate() + direction,
                    ),
                  )
                }
                canChangeYear={(direction) =>
                  canChangeDate(changeArchiveYear(selectedDate, direction))
                }
                canChangeMonth={(direction) =>
                  canChangeDate(changeArchiveMonth(selectedDate, direction))
                }
                canChangeDay={(direction) =>
                  canChangeDate(
                    new Date(
                      selectedDate.getFullYear(),
                      selectedDate.getMonth(),
                      selectedDate.getDate() + direction,
                    ),
                  )
                }
              />

              {hasCardsForSelectedDate && activeArchivedCard ? (
                <div className="relative mt-5 h-[382px] w-[252px] shrink-0">
                  <ArchiveCardBackStack cards={stackCards} />
                  <ArchiveHistoryCard card={activeArchivedCard} />

                  {cardsForSelectedDate.length > 1 && (
                    <>
                      <DeckArrow
                        direction="previous"
                        onClick={() => moveArchivedCard(-1)}
                      />
                      <DeckArrow
                        direction="next"
                        onClick={() => moveArchivedCard(1)}
                      />
                    </>
                  )}
                </div>
              ) : (
                <div className="mt-10 flex h-[330px] w-[252px] items-center justify-center rounded-[28px] border border-black/10 bg-white/20 px-8">
                  <p
                    className="font-mono text-[10px] leading-relaxed tracking-[0.08em]"
                    style={{ color: 'rgba(63,65,68,0.62)' }}
                  >
                    В этот день карточки ещё не сохранялись
                  </p>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

interface ArchiveCalendarProps {
  date: Date;
  onChangeYear: (direction: -1 | 1) => void;
  onChangeMonth: (direction: -1 | 1) => void;
  onChangeDay: (direction: -1 | 1) => void;
  canChangeYear: (direction: -1 | 1) => boolean;
  canChangeMonth: (direction: -1 | 1) => boolean;
  canChangeDay: (direction: -1 | 1) => boolean;
}

const ArchiveCalendar: React.FC<ArchiveCalendarProps> = ({
  date,
  onChangeYear,
  onChangeMonth,
  onChangeDay,
  canChangeYear,
  canChangeMonth,
  canChangeDay,
}) => (
  <div
    className="mt-4 w-full max-w-[286px] overflow-hidden rounded-[15px] border"
    style={{
      borderColor: 'rgba(82,69,56,0.22)',
      backgroundColor: 'rgba(235,229,214,0.76)',
      backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.35), transparent 58%), url(${cardboardTexture})`,
      backgroundSize: '100% 100%, cover',
      backgroundBlendMode: 'soft-light, multiply',
      boxShadow:
        '0 5px 10px rgba(67,56,43,0.16), inset 0 1px rgba(255,255,255,0.65)',
    }}
  >
    <CalendarRow
      label="Год"
      value={String(date.getFullYear())}
      onPrevious={() => onChangeYear(-1)}
      onNext={() => onChangeYear(1)}
      canPrevious={canChangeYear(-1)}
      canNext={canChangeYear(1)}
    />
    <CalendarRow
      label="Месяц"
      value={MONTH_NAMES_RU[date.getMonth()]!}
      onPrevious={() => onChangeMonth(-1)}
      onNext={() => onChangeMonth(1)}
      canPrevious={canChangeMonth(-1)}
      canNext={canChangeMonth(1)}
    />
    <CalendarRow
      label="День"
      value={String(date.getDate()).padStart(2, '0')}
      onPrevious={() => onChangeDay(-1)}
      onNext={() => onChangeDay(1)}
      canPrevious={canChangeDay(-1)}
      canNext={canChangeDay(1)}
      isLast
    />
  </div>
);

interface CalendarRowProps {
  label: string;
  value: string;
  onPrevious: () => void;
  onNext: () => void;
  canPrevious: boolean;
  canNext: boolean;
  isLast?: boolean;
}

const CalendarRow: React.FC<CalendarRowProps> = ({
  label,
  value,
  onPrevious,
  onNext,
  canPrevious,
  canNext,
  isLast = false,
}) => (
  <div
    className={`grid h-[34px] grid-cols-[42px_1fr_42px] items-center ${
      isLast ? '' : 'border-b'
    }`}
    style={{ borderColor: 'rgba(82,69,56,0.16)' }}
  >
    <CalendarArrow
      direction="previous"
      onClick={onPrevious}
      disabled={!canPrevious}
      label={`Предыдущий ${label.toLowerCase()}`}
    />
    <div className="flex items-baseline justify-center gap-2 font-mono">
      <span
        className="text-[8px] uppercase tracking-[0.14em]"
        style={{ color: 'rgba(61,55,48,0.55)' }}
      >
        {label}
      </span>
      <span
        className="text-[12px] font-bold uppercase tracking-[0.08em]"
        style={{ color: '#3F3932' }}
      >
        {value}
      </span>
    </div>
    <CalendarArrow
      direction="next"
      onClick={onNext}
      disabled={!canNext}
      label={`Следующий ${label.toLowerCase()}`}
    />
  </div>
);

interface CalendarArrowProps {
  direction: 'previous' | 'next';
  onClick: () => void;
  disabled: boolean;
  label: string;
}

const CalendarArrow: React.FC<CalendarArrowProps> = ({
  direction,
  onClick,
  disabled,
  label,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className="h-full font-mono text-base transition-opacity disabled:cursor-default"
    style={{ color: disabled ? 'rgba(63,57,50,0.2)' : 'rgba(63,57,50,0.78)' }}
  >
    {direction === 'previous' ? '‹' : '›'}
  </button>
);

const ArchiveCardBackStack: React.FC<{ cards: VisualCard[] }> = ({ cards }) => (
  <div className="pointer-events-none absolute inset-0" aria-hidden="true">
    {cards.map((card, index) => {
      const isTail = index === cards.length - 1;
      const x = 6 + index * 1.4 + (isTail ? 14 : 0);
      const y = 5 + index * 1.1 + (isTail ? 15 : 0);
      const rotate = -0.4 + index * 0.34 + (isTail ? 3.5 : 0);

      return (
        <div
          key={card.id}
          className="absolute inset-0 overflow-hidden"
          style={{
            borderRadius: `${CARD_RADIUS}px`,
            backgroundImage: `url(${cardBackTexture}), url(${cardboardTexture})`,
            backgroundSize: 'cover, cover',
            backgroundPosition: 'center, center',
            backgroundBlendMode: 'normal, multiply',
            transform: `translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg)`,
            transformOrigin: 'bottom left',
            zIndex: ARCHIVE_STACK_LAYER_LIMIT - index,
            boxShadow: isTail
              ? '5px 9px 15px rgba(39,31,25,0.3)'
              : '2px 4px 7px rgba(39,31,25,0.18)',
          }}
        />
      );
    })}
  </div>
);

const ArchiveHistoryCard: React.FC<{ card: VisualCard }> = ({ card }) => {
  const palette = PALETTES[card.timeMode];

  return (
    <article
      className="absolute inset-0 flex flex-col overflow-hidden border"
      style={{
        zIndex: 20,
        borderRadius: `${CARD_RADIUS}px`,
        padding: '24px 23px 20px',
        backgroundColor: palette.paper,
        backgroundImage: `radial-gradient(circle at 13% 9%, rgba(255,255,255,0.28), transparent 48%), linear-gradient(142deg, rgba(255,255,255,0.08), transparent 50%, rgba(39,28,20,0.12)), url(${cardboardTexture})`,
        backgroundSize: '100% 100%, 100% 100%, cover',
        backgroundPosition: 'center, center, center',
        backgroundBlendMode: 'soft-light, multiply, multiply',
        borderColor: 'rgba(73,55,40,0.22)',
        boxShadow:
          '12px 20px 30px rgba(45,37,30,0.32), inset 1px 1px rgba(255,255,255,0.48), inset -1px -1px 2px rgba(54,38,27,0.12)',
      }}
    >
      <div
        className="absolute bottom-[-5px] left-[5px] right-[5px] h-[16px] rounded-b-[28px]"
        style={{
          backgroundColor: 'rgba(60,45,32,0.36)',
          boxShadow: '0 5px 7px rgba(47,37,28,0.24)',
        }}
      />
      <div className="relative flex h-full flex-col">
        <div
          className="inline-flex w-fit rounded-[7px] px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.12em]"
          style={{
            color: 'rgba(255,255,255,0.94)',
            backgroundColor: palette.accent,
            backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.1), rgba(0,0,0,0.12)), url(${cardboardTexture})`,
            backgroundSize: '100% 100%, cover',
            backgroundBlendMode: 'soft-light, multiply',
            boxShadow: '0 3px 5px rgba(37,30,23,0.22)',
          }}
        >
          Сохранено
        </div>
        <h3
          className="mt-6 text-[25px] font-semibold leading-[1.08]"
          style={{
            color: palette.ink,
            display: '-webkit-box',
            overflow: 'hidden',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 5,
          }}
        >
          {card.title}
        </h3>
        <div
          className="mt-auto border-t pt-3 font-mono text-[9px] uppercase tracking-[0.11em]"
          style={{
            color: 'rgba(31,28,25,0.5)',
            borderColor: 'rgba(47,37,28,0.22)',
          }}
        >
          Завершено · {formatCompletedDate(card.completedAt ?? '')}
        </div>
      </div>
    </article>
  );
};

const DeckArrow: React.FC<{
  direction: 'previous' | 'next';
  onClick: () => void;
}> = ({ direction, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={
      direction === 'previous' ? 'Предыдущая карточка' : 'Следующая карточка'
    }
    className={`absolute top-1/2 z-30 -translate-y-1/2 rounded-full border bg-[#e8dfcf]/85 px-2 py-1 font-mono text-lg shadow-sm ${
      direction === 'previous' ? '-left-10' : '-right-10'
    }`}
    style={{ borderColor: 'rgba(78,63,49,0.2)', color: '#50463c' }}
  >
    {direction === 'previous' ? '‹' : '›'}
  </button>
);
