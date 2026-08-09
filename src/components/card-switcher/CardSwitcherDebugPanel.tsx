import React, { useState } from 'react';

import {
  INITIAL_CARD_SWITCHER_CONFIG,
  type CardSwitcherConfig,
} from './cardSwitcherConfig';

interface CardSwitcherDebugPanelProps {
  config: CardSwitcherConfig;
  onChange: (config: CardSwitcherConfig) => void;
}

interface ControlDefinition {
  key: keyof CardSwitcherConfig;
  label: string;
  min: number;
  max: number;
  step?: number;
}

const CONTROLS: ControlDefinition[] = [
  { key: 'width', label: 'Width', min: 180, max: 480 },
  { key: 'height', label: 'Height', min: 70, max: 260 },
  { key: 'borderRadius', label: 'Radius', min: 0, max: 48 },
  { key: 'backgroundSize', label: 'Texture size', min: 150, max: 1200 },
  { key: 'backgroundX', label: 'Texture X', min: -800, max: 400 },
  { key: 'backgroundY', label: 'Texture Y', min: -800, max: 400 },
  { key: 'paddingLeft', label: 'Padding left', min: 0, max: 120 },
  { key: 'paddingRight', label: 'Padding right', min: 0, max: 120 },
  { key: 'paddingTop', label: 'Padding top', min: 0, max: 100 },
  { key: 'paddingBottom', label: 'Padding bottom', min: 0, max: 100 },
  { key: 'rowHeight', label: 'Row height', min: 12, max: 56 },
  { key: 'rowGap', label: 'Row gap', min: -10, max: 30 },
  { key: 'fontSize', label: 'Font size', min: 6, max: 24 },
  { key: 'textX', label: 'Text X', min: -100, max: 100 },
  { key: 'dotsX', label: 'Dots X', min: 120, max: 600 },
  { key: 'dotSize', label: 'Dot size', min: 2, max: 24 },
  { key: 'dotGap', label: 'Dot gap', min: 0, max: 30 },
  { key: 'activeWidth', label: 'Active width', min: 40, max: 440 },
  { key: 'activeHeight', label: 'Active height', min: 8, max: 60 },
  { key: 'activeRadius', label: 'Active radius', min: 0, max: 30 },
  {
    key: 'activeOpacity',
    label: 'Active opacity',
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: 'textureOpacity',
    label: 'Texture opacity',
    min: 0,
    max: 1,
    step: 0.01,
  },
];

export const CardSwitcherDebugPanel: React.FC<
  CardSwitcherDebugPanelProps
> = ({ config, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copyLabel, setCopyLabel] = useState('Copy config');

  const updateValue = (
    key: keyof CardSwitcherConfig,
    value: number,
  ) => {
    onChange({ ...config, [key]: value });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      setCopyLabel('Copied');
      window.setTimeout(() => setCopyLabel('Copy config'), 900);
    } catch {
      setCopyLabel('Copy failed');
      window.setTimeout(() => setCopyLabel('Copy config'), 1200);
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed right-3 top-3 z-[100] rounded bg-black/80 px-3 py-2 font-mono text-[10px] font-bold tracking-wider text-white"
      >
        DEBUG
      </button>
    );
  }

  return (
    <aside className="fixed right-3 top-3 z-[100] max-h-[calc(100vh-24px)] w-[286px] overflow-y-auto rounded-lg bg-black/90 p-3 text-white shadow-2xl">
      <div className="mb-3 flex items-center justify-between">
        <strong className="font-mono text-[11px] tracking-wider">
          CARD SWITCHER
        </strong>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="rounded bg-white/10 px-2 py-1 font-mono text-[10px]"
        >
          CLOSE
        </button>
      </div>

      <div className="space-y-2">
        {CONTROLS.map((control) => (
          <label key={control.key} className="block">
            <span className="mb-1 flex items-center justify-between gap-2 font-mono text-[9px]">
              <span>{control.label}</span>
              <input
                type="number"
                min={control.min}
                max={control.max}
                step={control.step ?? 1}
                value={config[control.key]}
                onChange={(event) =>
                  updateValue(control.key, Number(event.target.value))
                }
                className="w-[72px] rounded border border-white/20 bg-white/10 px-1 py-0.5 text-right text-white outline-none"
              />
            </span>
            <input
              type="range"
              min={control.min}
              max={control.max}
              step={control.step ?? 1}
              value={config[control.key]}
              onChange={(event) =>
                updateValue(control.key, Number(event.target.value))
              }
              className="block w-full"
            />
          </label>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="rounded bg-white/15 px-2 py-2 font-mono text-[9px] font-bold"
        >
          {copyLabel}
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...INITIAL_CARD_SWITCHER_CONFIG })}
          className="rounded bg-white/15 px-2 py-2 font-mono text-[9px] font-bold"
        >
          Reset
        </button>
      </div>
    </aside>
  );
};
