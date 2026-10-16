import React from 'react';

import cardboardTexture from '../../assets/cardboard.avif';
import { formatArchiveMoment } from '../../app/archiveUtils';
import { getCardPalette, type VisualCard } from '../../app/cardTheme';
import { getListCompletedCount } from '../../app/listUtils';
import { INITIAL_TASK_CARD_V2_CONFIG } from '../task-card/taskCardV2Config';
import { t } from '../../app/i18n';

interface ListItemsSheetProps {
  card: VisualCard;
}

/**
 * The back of a list card: every item, however long the list is, with the
 * moment it was checked. Laid out at the card's natural size; the parent
 * scales it like the card.
 */
export const ListItemsSheet: React.FC<ListItemsSheetProps> = ({ card }) => {
  const list = card.list;
  const palette = getCardPalette(card);
  const config = INITIAL_TASK_CARD_V2_CONFIG;

  if (!list) {
    return null;
  }

  return (
    <article
      className="engraved absolute inset-0 flex flex-col overflow-hidden border"
      style={{
        borderRadius: config.borderRadius,
        padding: config.contentPadding,
        backgroundColor: palette.paper,
        backgroundImage: `url(${cardboardTexture})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundBlendMode: 'multiply',
        borderColor: 'rgba(91,76,59,0.16)',
        boxShadow: `${config.shadowX}px ${config.shadowY}px ${config.shadowBlur}px rgba(20,17,14,${config.shadowOpacity}), inset 0 1px 0 rgba(255,255,255,0.88)`,
      }}
      aria-label={t('Все пункты списка «{title}»', { title: card.title })}
    >
      <span
        className="self-start rounded-full px-3 py-1.5 font-mono text-[11.5px] font-bold uppercase tracking-[0.12em]"
        style={{ color: palette.accentDark, backgroundColor: `${palette.accent}1d` }}
      >{t('Весь список')}</span>

      <p
        className="mt-3 shrink-0 border-b pb-3 text-[13.5px] leading-[1.4]"
        style={{ color: '#6B6258', borderColor: 'rgba(69,57,44,0.13)' }}
      >
        {t('Отмечено')}{' '}
        <strong style={{ color: palette.accentDark }}>{t('{v} из {length}', { v: getListCompletedCount(list), length: list.items.length })}</strong>
      </p>

      <ol
        className="mt-1 min-h-0 flex-1 overflow-y-auto pr-1"
        style={{ overscrollBehavior: 'contain' }}
      >
        {list.items.map((item) => {
          const completed = Boolean(item.completedAt);

          return (
            <li
              key={item.id}
              className="flex items-start gap-3 border-b py-2"
              style={{ borderColor: 'rgba(69,57,44,0.08)', borderBottomStyle: 'dashed' }}
            >
              <span
                className="mt-[1px] flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border font-mono text-[12px] font-bold"
                style={{
                  borderColor: completed ? palette.accent : 'rgba(69,57,44,0.32)',
                  backgroundColor: completed ? palette.accent : 'transparent',
                  color: 'white',
                }}
                aria-hidden="true"
              >
                {completed ? '✓' : ''}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className="block break-words text-[15.5px] leading-[1.35]"
                  style={{ color: '#28231D' }}
                >
                  {item.text}
                </span>
                {item.completedAt && (
                  <span
                    className="block font-mono text-[11.5px] tabular-nums"
                    style={{ color: '#776E63' }}
                  >
                    {formatArchiveMoment(item.completedAt)}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </article>
  );
};
