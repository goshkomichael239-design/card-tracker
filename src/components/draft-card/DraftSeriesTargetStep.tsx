import type { CardPalette } from '../../app/cardTheme';

interface DraftSeriesTargetStepProps {
  value: string;
  disabled: boolean;
  palette: CardPalette;
  onChange: (value: string) => void;
}

export function DraftSeriesTargetStep({
  value,
  disabled,
  palette,
  onChange,
}: DraftSeriesTargetStepProps) {
  return (
    <div className="pt-1">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-black/55">
        Сколько одинаковых действий?
      </p>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder="50"
        className="mt-6 w-full border-0 border-b bg-transparent px-1 pb-3 font-mono text-[34px] font-semibold outline-none placeholder:text-black/20 disabled:opacity-50"
        style={{
          color: palette.ink,
          borderColor: 'rgba(77,58,43,0.2)',
        }}
        aria-label="Количество действий"
      />
      <p className="mt-4 font-mono text-[9px] leading-relaxed tracking-[0.08em] text-black/40">
        Укажите целое число не меньше одного.
      </p>
    </div>
  );
}
