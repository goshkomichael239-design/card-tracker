import type { RefObject } from 'react';

import type { CardPalette } from '../../app/cardTheme';

export interface DraftTitleStepProps {
  titleInputRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  disabled: boolean;
  palette: CardPalette;
  onChange: (value: string) => void;
}

export function DraftTitleStep({
  titleInputRef,
  value,
  disabled,
  palette,
  onChange,
}: DraftTitleStepProps) {
  return (
    <textarea
      ref={titleInputRef}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      rows={2}
      maxLength={100}
      placeholder="Что нужно сделать?"
      className="mt-1 min-h-[138px] w-full resize-none rounded-[6px] border-0 bg-transparent px-1 py-4 text-[1.36rem] font-semibold leading-[1.42] outline-none placeholder:text-black/25 disabled:opacity-50"
      style={{
        color: palette.ink,
        letterSpacing: '-0.018em',
        backgroundImage:
          'repeating-linear-gradient(180deg, transparent 0, transparent 35px, rgba(77,58,43,0.14) 36px)',
        boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.18)',
      }}
    />
  );
}
