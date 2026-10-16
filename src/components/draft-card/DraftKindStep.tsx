import React from 'react';
import type { RefObject } from 'react';

import type { CardKind, CardPalette } from '../../app/cardTheme';
import type { QuickEntry } from '../../app/parseQuickEntry';
import { t } from '../../app/i18n';

export interface DraftKindStepProps {
  selectedKind: CardKind | null;
  palette: CardPalette;
  titleInputRef: RefObject<HTMLTextAreaElement | null>;
  /** What has been typed so far (it becomes the title). */
  value: string;
  disabled: boolean;
  /** What the app made of the line, if anything. */
  quickEntry: QuickEntry | null;
  onChange: (value: string) => void;
  onSelectKind: (kind: CardKind) => void;
  /** "Create it as understood". */
  onQuickCreate: () => void;
  /** "No, I will choose myself". */
  onChooseManually: () => void;
  /** Enter in the field. */
  onEnter: () => void;
}

const OPTIONS: Array<{ kind: CardKind; title: string; hint: string }> = [
  { kind: 'single', title: t('Одна задача'), hint: t('название и срок') },
  { kind: 'series', title: t('Серия'), hint: t('название и цель') },
  { kind: 'list', title: t('Список'), hint: t('пункты по одному') },
];

const drawDelay = (ms: number): React.CSSProperties =>
  ({ ['--draw-delay' as string]: `${ms}ms` }) as React.CSSProperties;

const KIND_WORD: Record<QuickEntry['kind'], string> = {
  single: t('Задача'),
  series: t('Серия'),
  list: t('Список'),
};

/**
 * The first thing on a new card: one line to write in. If the app understands
 * it (a time, a repeat, "30 раз", a list) it asks whether to make exactly
 * that, in place of the choices; if not, the line is the title and the person
 * picks what the card is.
 */
export function DraftKindStep({
  selectedKind,
  palette,
  titleInputRef,
  value,
  disabled,
  quickEntry,
  onChange,
  onSelectKind,
  onQuickCreate,
  onChooseManually,
  onEnter,
}: DraftKindStepProps) {
  const glowStyle = {
    ['--etched-glow' as string]: palette.glow,
  } as React.CSSProperties;
  const hasText = value.trim() !== '';

  return (
    <div className="flex min-h-0 flex-col">
      <p
        className="draw-in shrink-0 font-semibold leading-[1.15]"
        style={{
          ...drawDelay(60),
          fontSize: 22,
          color: 'rgba(40,35,29,0.62)',
          letterSpacing: '-0.015em',
        }}
      >{t('Что создаём?')}</p>

      <textarea
        ref={titleInputRef}
        value={value}
        disabled={disabled}
        rows={2}
        maxLength={100}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            onEnter();
          }
        }}
        placeholder={t('Например: завтра в 9 позвонить маме')}
        enterKeyHint="done"
        aria-label={t('Что нужно сделать')}
        className="draw-in mt-3 min-h-[78px] w-full shrink-0 resize-none rounded-[6px] border-0 bg-transparent px-1 py-2 text-[1.2rem] font-semibold leading-[1.4] outline-none placeholder:text-black/25 disabled:opacity-50"
        style={{
          ...drawDelay(110),
          color: palette.ink,
          letterSpacing: '-0.015em',
          backgroundImage:
            'repeating-linear-gradient(180deg, transparent 0, transparent 31px, rgba(77,58,43,0.14) 32px)',
          boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.18)',
        }}
      />

      {quickEntry ? (
        <div className="mt-3 flex flex-col gap-2.5">
          <div
            className="draw-in rounded-[10px] px-3.5 py-3"
            style={{
              ...drawDelay(40),
              backgroundColor: `${palette.accent}16`,
              boxShadow:
                'inset 0 1px 3px rgba(60,45,30,0.18), 0 1px 0 rgba(255,255,255,0.55)',
            }}
          >
            <p
              className="font-mono text-[10.5px] font-bold uppercase tracking-[0.14em]"
              style={{ color: palette.accentDark }}
            >{t('Я понял так · {v}', { v: KIND_WORD[quickEntry.kind] })}</p>
            <p
              className="mt-1.5 text-[15.5px] font-semibold leading-[1.3]"
              style={{ color: palette.ink }}
            >
              {quickEntry.question}
            </p>
          </div>

          <button
            type="button"
            onClick={onQuickCreate}
            onTouchStart={() => undefined}
            disabled={disabled}
            className="etched-action etched-action--slim etched-action--roomy draw-in"
            style={{ ...drawDelay(120), ...glowStyle }}
          >
            <span className="etched-action__text">{t('Да, создать')}</span>
            <span className="etched-action__hint">Enter</span>
          </button>

          <button
            type="button"
            onClick={onChooseManually}
            onTouchStart={() => undefined}
            disabled={disabled}
            className="draw-in cursor-pointer self-start border-0 bg-transparent px-1 py-1 font-mono text-[11.5px] font-bold uppercase tracking-[0.12em]"
            style={{ ...drawDelay(180), color: palette.accentDark }}
          >{t('Нет, выберу сам')}</button>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2.5">
          {hasText && (
            <p
              className="draw-in font-mono text-[10.5px] font-bold uppercase tracking-[0.14em]"
              style={{ ...drawDelay(40), color: palette.accentDark }}
            >{t('Это будет…')}</p>
          )}
          {OPTIONS.map((option, index) => (
            <button
              key={option.kind}
              type="button"
              onClick={() => onSelectKind(option.kind)}
              onTouchStart={() => undefined}
              disabled={disabled}
              className={`etched-action etched-action--slim etched-action--roomy draw-in${selectedKind === option.kind ? ' etched-action--selected' : ''}`}
              style={{ ...drawDelay(100 + index * 50), ...glowStyle }}
            >
              <span className="etched-action__text">{option.title}</span>
              <span className="etched-action__hint">{option.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
