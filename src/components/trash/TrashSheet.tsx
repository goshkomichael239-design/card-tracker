import React, { useEffect, useState } from 'react';

import cardboardTexture from '../../assets/cardboard.avif';
import { getCardPalette } from '../../app/cardTheme';
import { STAMP_RED_DARK } from '../../app/stampRed';
import {
  formatTrashedAgo,
  getTrashDaysLeft,
  TRASH_RETENTION_DAYS,
  type TrashedCard,
} from '../../app/trash';
import { INITIAL_TASK_CARD_V2_CONFIG } from '../task-card/taskCardV2Config';
import { t } from '../../app/i18n';

interface TrashSheetProps {
  items: TrashedCard[];
  /** False while a completion is still settling; restoring waits for it. */
  canRestore: boolean;
  onRestore: (cardId: string) => void;
  onDeleteForever: (cardId: string) => void;
  onEmpty: () => void;
  onClose: () => void;
}

const CONFIRM_TIMEOUT_MS = 3_500;
const PAPER = '#F7F2E8';

const kindLabel = (item: TrashedCard): string =>
  item.card.kind === 'series'
    ? t('Серия')
    : item.card.kind === 'list'
      ? t('Список')
      : t('Одна задача');

/** A small crumpled sheet in the card's own paper colour. */
const CrumpledThumb: React.FC<{ paper: string }> = ({ paper }) => (
  <span
    aria-hidden="true"
    className="block h-10 w-9 shrink-0"
    style={{
      backgroundColor: paper,
      backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.55) 0%, transparent 38%, rgba(60,40,20,0.16) 52%, transparent 66%), linear-gradient(40deg, transparent 40%, rgba(60,40,20,0.14) 48%, transparent 58%), url(${cardboardTexture})`,
      backgroundSize: '100% 100%, 100% 100%, cover',
      backgroundBlendMode: 'normal, normal, multiply',
      clipPath:
        'polygon(8% 6%, 36% 12%, 62% 2%, 94% 10%, 88% 38%, 98% 66%, 90% 94%, 60% 88%, 34% 98%, 6% 90%, 12% 62%, 2% 32%)',
      filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.25))',
    }}
  />
);

/**
 * What is in the bin. Each card can be put back on the table or deleted for
 * good (that needs a second press); the whole bin can be emptied the same way.
 */
export const TrashSheet: React.FC<TrashSheetProps> = ({
  items,
  canRestore,
  onRestore,
  onDeleteForever,
  onEmpty,
  onClose,
}) => {
  const config = INITIAL_TASK_CARD_V2_CONFIG;
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    if (confirmId === null) {
      return;
    }

    const timer = window.setTimeout(() => setConfirmId(null), CONFIRM_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [confirmId]);

  const confirmDelete = (key: string, action: () => void) => {
    if (confirmId === key) {
      setConfirmId(null);
      action();
      return;
    }

    setConfirmId(key);
  };

  return (
    <div
      className="absolute inset-0 z-50 bg-black/25 p-2 sm:p-5"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={t('Корзина')}
        className="engraved relative mx-auto flex h-full w-full max-w-[560px] flex-col overflow-hidden border"
        style={{
          borderRadius: config.borderRadius,
          padding: 'clamp(20px, 4vw, 32px)',
          backgroundColor: PAPER,
          backgroundImage: `url(${cardboardTexture})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'multiply',
          borderColor: 'rgba(91,76,59,0.16)',
          boxShadow: `${config.shadowX}px ${config.shadowY}px ${config.shadowBlur}px rgba(20,17,14,${config.shadowOpacity}), inset 0 1px 0 rgba(255,255,255,0.88), inset 0 -1px 2px rgba(79,61,42,0.08)`,
        }}
      >
        <header className="flex shrink-0 items-start justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] cursor-pointer border-0 bg-transparent px-0 font-mono text-[12.5px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: '#6B4A3A' }}
          >{t('← Назад')}</button>

          <div className="min-w-0 text-center">
            <p
              className="font-mono text-[12.5px] font-bold uppercase tracking-[0.16em]"
              style={{ color: '#6B4A3A' }}
            >{t('Корзина')}</p>
            <p className="mt-1 font-mono text-[12.5px] text-[#6B6258]">{t('Хранится {TRASH_RETENTION_DAYS} дней', { TRASH_RETENTION_DAYS })}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t('Закрыть корзину')}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border bg-transparent text-[25px] font-light leading-none"
            style={{
              color: '#6B4A3A',
              borderColor: 'rgba(107,74,58,0.3)',
              backgroundColor: 'rgba(107,74,58,0.05)',
            }}
          >
            ×
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
            <p className="text-[18px] font-semibold" style={{ color: 'rgba(40,35,29,0.62)' }}>{t('Корзина пуста')}</p>
            <p className="mt-2 max-w-[260px] text-[13.5px] leading-[1.4]" style={{ color: '#776E63' }}>{t('Выброшенные карточки лежат здесь {TRASH_RETENTION_DAYS} дней, их можно вернуть на стол.', { TRASH_RETENTION_DAYS })}</p>
          </div>
        ) : (
          <ul
            className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1"
            style={{ overscrollBehavior: 'contain' }}
          >
            {items.map((item) => {
              const palette = getCardPalette(item.card);
              const deleteKey = `delete:${item.card.id}`;
              const isArmed = confirmId === deleteKey;

              return (
                <li
                  key={item.card.id}
                  className="flex items-center gap-3 border-b py-3"
                  style={{ borderColor: 'rgba(69,57,44,0.1)' }}
                >
                  <CrumpledThumb paper={palette.paper} />

                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-[17px] font-semibold leading-[1.25]"
                      style={{ color: '#28231D' }}
                    >
                      {item.card.title}
                    </p>
                    <p className="mt-0.5 text-[12.5px] leading-[1.35]" style={{ color: '#776E63' }}>{t('{v} · {v2} · ещё {v3} дн.', { v: kindLabel(item), v2: formatTrashedAgo(item, now), v3: getTrashDaysLeft(item, now) })}</p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                    <button
                      type="button"
                      disabled={!canRestore}
                      onClick={() => onRestore(item.card.id)}
                      onTouchStart={() => undefined}
                      className="pill-action disabled:cursor-default disabled:opacity-50"
                      style={
                        {
                          padding: '9px 14px',
                          ['--pill-bg' as string]: `${palette.accent}1d`,
                          ['--pill-ink' as string]: palette.accentDark,
                          ['--pill-glow' as string]: palette.glow,
                        } as React.CSSProperties
                      }
                    >{t('Вернуть')}</button>
                    <button
                      type="button"
                      onClick={() =>
                        confirmDelete(deleteKey, () => onDeleteForever(item.card.id))
                      }
                      className="min-h-[30px] cursor-pointer border-0 bg-transparent px-1 font-mono text-[11.5px] font-bold uppercase tracking-[0.1em]"
                      style={{ color: isArmed ? STAMP_RED_DARK : 'rgba(40,35,29,0.5)' }}
                    >
                      {isArmed ? t('Точно?') : t('Удалить')}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {items.length > 0 && (
          <footer
            className="mt-4 flex shrink-0 items-center justify-between gap-3 border-t pt-4"
            style={{ borderColor: 'rgba(69,57,44,0.12)' }}
          >
            <p className="text-[12.5px]" style={{ color: '#776E63' }}>{t('Карточек: {length}', { length: items.length })}</p>
            <button
              type="button"
              onClick={() => confirmDelete('empty', onEmpty)}
              className="min-h-[36px] cursor-pointer border-0 bg-transparent px-1 font-mono text-[12.5px] font-bold uppercase tracking-[0.1em]"
              style={{ color: confirmId === 'empty' ? STAMP_RED_DARK : 'rgba(40,35,29,0.6)' }}
            >
              {confirmId === 'empty' ? t('Точно очистить?') : t('Очистить корзину')}
            </button>
          </footer>
        )}
      </section>
    </div>
  );
};
