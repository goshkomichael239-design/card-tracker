import type { CardKind, CardPalette } from '../../app/cardTheme';
import { TypeOption } from '../shared/TypeOption';

export interface DraftKindStepProps {
  selectedKind: CardKind | null;
  palette: CardPalette;
  onSelectKind: (kind: CardKind) => void;
}

export function DraftKindStep({ selectedKind, palette, onSelectKind }: DraftKindStepProps) {
  return (
    <div>
      <span
        className="font-mono text-[13px] font-bold uppercase tracking-[0.17em]"
        style={{
          color: 'rgba(30,28,26,0.72)',
          textShadow: '0 1px 0 rgba(255,255,255,0.28)',
        }}
      >
        Выберите тип
      </span>
      <div className="mt-5 grid grid-cols-3 gap-3">
        <TypeOption index={0} lines={['Одна', 'задача']} selected={selectedKind === 'single'} palette={palette} onClick={() => onSelectKind('single')} />
        <TypeOption index={1} lines={['Рутина', '']} hint="Скоро" selected={false} disabled palette={palette} onClick={() => undefined} />
        <TypeOption index={2} lines={['Список', '']} hint="Скоро" selected={false} disabled palette={palette} onClick={() => undefined} />
      </div>
    </div>
  );
}
