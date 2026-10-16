import React from 'react';

import cardboardTexture from '../../assets/cardboard.avif';
import {
  formatArchiveDay,
  formatArchiveMoment,
  longestDailyStreak,
  pluralDays,
} from '../../app/archiveUtils';
import { getCardPalette, type VisualCard } from '../../app/cardTheme';
import { formatSeriesDuration } from '../../app/seriesUtils';
import { INITIAL_TASK_CARD_V2_CONFIG } from '../task-card/taskCardV2Config';
import { t } from '../../app/i18n';

interface SeriesHistorySheetProps {
  card: VisualCard;
}

/**
 * The back of a series card: a log of every counted step — when it happened
 * and how long it took since the previous one — under a short summary.
 * Laid out at the card's natural size; the parent scales it like the card.
 */
export const SeriesHistorySheet: React.FC<SeriesHistorySheetProps> = ({
  card,
}) => {
  const series = card.series;
  const palette = getCardPalette(card);
  const config = INITIAL_TASK_CARD_V2_CONFIG;

  if (!series) {
    return null;
  }

  const entries = series.entries;
  const bestStreak = longestDailyStreak(entries.map((entry) => entry.completedAt));
  const finishedLabel = series.finishedAt
    ? t('Завершена {v} · {v2}', { v: formatArchiveDay(series.finishedAt), v2: series.finishReason === 'manual' ? t('вручную') : t('полностью') })
    : null;

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
      aria-label={t('История серии «{title}»', { title: card.title })}
    >
      <span
        className="self-start rounded-full px-3 py-1.5 font-mono text-[11.5px] font-bold uppercase tracking-[0.12em]"
        style={{ color: palette.accentDark, backgroundColor: `${palette.accent}1d` }}
      >{t('История серии')}</span>

      <h3
        className="mt-4 shrink-0 truncate text-[24px] font-semibold leading-[1.15]"
        style={{ color: '#28231D', letterSpacing: '-0.015em' }}
      >
        {card.title}
      </h3>

      <div
        className="mt-3 shrink-0 space-y-0.5 border-b pb-3 text-[13.5px] leading-[1.4]"
        style={{ color: '#6B6258', borderColor: 'rgba(69,57,44,0.13)' }}
      >
        <p>
          {t('Выполнено')}{' '}
          <strong style={{ color: palette.accentDark }}>{t('{length} из {targetCount}', { length: entries.length, targetCount: series.targetCount })}</strong>{' '}
          {t('· начата')} {formatArchiveDay(series.startedAt)}
        </p>
        {finishedLabel && <p>{finishedLabel}</p>}
        {bestStreak >= 2 && (
          <p>{t('Лучшее: {bestStreak} {v} подряд', { bestStreak, v: pluralDays(bestStreak) })}</p>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="mt-6 text-[15px]" style={{ color: 'rgba(40,35,29,0.55)' }}>{t('Ни одного шага не засчитано.')}</p>
      ) : (
        <ol
          className="mt-1 min-h-0 flex-1 overflow-y-auto pr-1"
          style={{ overscrollBehavior: 'contain' }}
        >
          {/* Newest step first. */}
          {entries
            .map((entry, index) => ({ entry, number: index + 1 }))
            .reverse()
            .map(({ entry, number }) => (
              <li
                key={`${number}-${entry.completedAt}`}
                className="grid grid-cols-[38px_1fr_auto] items-baseline gap-2 border-b py-2"
                style={{ borderColor: 'rgba(69,57,44,0.08)', borderBottomStyle: 'dashed' }}
              >
                <span
                  className="font-mono text-[13px] font-bold tabular-nums"
                  style={{ color: palette.accentDark }}
                >
                  №{number}
                </span>
                <span className="text-[15px]" style={{ color: '#28231D' }}>
                  {formatArchiveMoment(entry.completedAt)}
                </span>
                <span className="font-mono text-[12px] tabular-nums" style={{ color: '#776E63' }}>{t('за {v}', { v: formatSeriesDuration(entry.durationMs) })}</span>
              </li>
            ))}
        </ol>
      )}
    </article>
  );
};
