import React, { useEffect, useState } from 'react';

import cardboardTexture from '../../assets/cardboard.avif';
import { DECK_BACKS, getDeckBack } from '../../app/deckBacks';
import { STAMP_RED } from '../../app/stampRed';
import {
  DEFAULT_DECK_ID,
  MAX_DECK_NAME_LENGTH,
  type Deck,
} from '../../app/decks';
import { INITIAL_TASK_CARD_V2_CONFIG } from '../task-card/taskCardV2Config';

interface DeckSheetProps {
  /** The deck being changed, or null for a new one. */
  deck: Deck | null;
  /** How many cards lie in it (for the words before deleting). */
  cardCount: number;
  onSave: (name: string, backId: string) => void;
  onDelete: () => void;
  onClose: () => void;
}

const PAPER = '#F7F2E8';
const INK = '#4D4130';

/**
 * A deck's settings on a sheet of paper: its name and its back. A new deck
 * gets both here; the base deck only lets its back be chosen. Deleting asks
 * twice and moves the cards to the base deck.
 */
export const DeckSheet: React.FC<DeckSheetProps> = ({
  deck,
  cardCount,
  onSave,
  onDelete,
  onClose,
}) => {
  const config = INITIAL_TASK_CARD_V2_CONFIG;
  const isBase = deck?.id === DEFAULT_DECK_ID;
  const [name, setName] = useState(deck?.name ?? '');
  const [backId, setBackId] = useState(deck?.backId ?? DECK_BACKS[1]!.id);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!isConfirmingDelete) {
      return;
    }

    const timer = window.setTimeout(() => setIsConfirmingDelete(false), 3_500);
    return () => window.clearTimeout(timer);
  }, [isConfirmingDelete]);

  const canSave = isBase || name.trim() !== '';

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 p-3"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-label={deck ? 'Колода' : 'Новая колода'}
        onSubmit={(event) => {
          event.preventDefault();

          if (canSave) {
            onSave(isBase ? deck.name : name, backId);
          }
        }}
        className="engraved relative flex max-h-full w-full max-w-[420px] flex-col overflow-y-auto border"
        style={{
          borderRadius: config.borderRadius,
          padding: '22px 22px 18px',
          backgroundColor: PAPER,
          backgroundImage: `url(${cardboardTexture})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'multiply',
          borderColor: 'rgba(91,76,59,0.16)',
          boxShadow: `${config.shadowX}px ${config.shadowY}px ${config.shadowBlur}px rgba(20,17,14,${config.shadowOpacity}), inset 0 1px 0 rgba(255,255,255,0.88)`,
          color: INK,
        }}
      >
        <header className="flex items-start justify-between gap-3">
          <p className="font-mono text-[12.5px] font-bold uppercase tracking-[0.16em]">
            {deck ? 'Колода' : 'Новая колода'}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border bg-transparent text-[22px] leading-none"
            style={{ color: INK, borderColor: 'rgba(77,65,48,0.3)' }}
          >
            ×
          </button>
        </header>

        <label className="mt-4 block">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] opacity-70">
            Название
          </span>
          <input
            value={isBase ? deck.name : name}
            onChange={(event) => setName(event.target.value)}
            disabled={isBase}
            maxLength={MAX_DECK_NAME_LENGTH}
            placeholder="Например: Работа"
            autoFocus={!deck}
            className="mt-1.5 w-full rounded-[8px] border bg-transparent px-3 py-2.5 text-[17px] font-semibold outline-none disabled:opacity-60"
            style={{
              color: '#28231D',
              borderColor: 'rgba(77,65,48,0.28)',
              boxShadow: 'inset 0 1px 3px rgba(60,45,30,0.15)',
            }}
          />
        </label>

        <p className="mt-4 font-mono text-[11px] font-bold uppercase tracking-[0.12em] opacity-70">
          Рубашка
        </p>
        <div
          className="mt-2 grid grid-cols-3 gap-3"
          role="radiogroup"
          aria-label="Рубашка"
        >
          {DECK_BACKS.map((back) => {
            const isOn = backId === back.id;
            const paper = getDeckBack(back.id).paper;

            return (
              <button
                key={back.id}
                type="button"
                role="radio"
                aria-checked={isOn}
                onClick={() => setBackId(back.id)}
                className="flex cursor-pointer flex-col items-center gap-1.5 border-0 bg-transparent p-0"
              >
                <span
                  className="block"
                  style={{
                    width: 54,
                    height: 76,
                    borderRadius: 8,
                    backgroundColor: '#EFE6D6',
                    backgroundImage: `url(${cardboardTexture})`,
                    backgroundSize: 'cover',
                    backgroundBlendMode: 'multiply',
                    ...paper,
                    boxShadow: `${paper?.boxShadow ?? 'inset 0 0 0 1px rgba(91,76,59,0.25)'}, 0 2px 4px rgba(20,17,14,0.3)`,
                    outline: isOn ? '3px solid #C79A36' : 'none',
                    outlineOffset: 2,
                  }}
                />
                <span className="text-[12.5px] font-semibold">{back.name}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          {deck && !isBase ? (
            <button
              type="button"
              onClick={() => {
                if (isConfirmingDelete) {
                  onDelete();
                } else {
                  setIsConfirmingDelete(true);
                }
              }}
              className="cursor-pointer border-0 bg-transparent px-0 py-2 text-left font-mono text-[11.5px] font-bold uppercase tracking-[0.12em]"
              style={{ color: STAMP_RED }}
            >
              {isConfirmingDelete
                ? cardCount > 0
                  ? `Точно? ${cardCount} карт. уйдут в «По умолчанию»`
                  : 'Точно удалить?'
                : 'Удалить колоду'}
            </button>
          ) : (
            <span />
          )}

          <button
            type="submit"
            disabled={!canSave}
            className="min-h-[44px] shrink-0 cursor-pointer rounded-[11px] border px-5 font-mono text-[12px] font-bold uppercase tracking-[0.13em] disabled:cursor-default disabled:opacity-40"
            style={{
              color: 'rgba(30,28,26,0.75)',
              backgroundColor: 'rgba(245,236,218,0.5)',
              borderColor: 'rgba(70,52,38,0.3)',
              boxShadow: '0 3px 0 rgba(83,61,43,0.3)',
            }}
          >
            {deck ? 'Готово' : 'Создать'}
          </button>
        </div>
      </form>
    </div>
  );
};
