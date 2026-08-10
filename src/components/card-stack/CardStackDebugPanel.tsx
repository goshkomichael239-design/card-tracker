import React, { useState } from 'react';

import {
  INITIAL_CARD_STACK_CONFIG,
  type CardStackConfig,
} from './cardStackConfig';

interface CardStackDebugPanelProps {
  config: CardStackConfig;
  onChange: (config: CardStackConfig) => void;
}

interface ControlDefinition {
  key: keyof CardStackConfig;
  label: string;
  min: number;
  max: number;
  step?: number;
}

const CONTROLS: ControlDefinition[] = [
  { key: 'layerOffsetX', label: 'Layer X', min: -12, max: 20, step: 0.1 },
  { key: 'layerOffsetY', label: 'Layer Y', min: -4, max: 20, step: 0.1 },
  { key: 'rotationStep', label: 'Rotation step', min: -3, max: 3, step: 0.01 },
  { key: 'visibleEdge', label: 'Visible edge', min: 0, max: 12, step: 0.1 },
  { key: 'visibleLayers', label: 'Visible layers', min: 0, max: 6, step: 1 },
  { key: 'nextPreviewX', label: 'Next X', min: -30, max: 40, step: 0.1 },
  { key: 'nextPreviewY', label: 'Next Y', min: -10, max: 40, step: 0.1 },
  { key: 'nextPreviewRotation', label: 'Next rotation', min: -5, max: 5, step: 0.01 },
  { key: 'nextPreviewReveal', label: 'Next reveal', min: 0, max: 40, step: 0.1 },
  { key: 'shadowX', label: 'Shadow X', min: -10, max: 20, step: 0.5 },
  { key: 'shadowY', label: 'Shadow Y', min: -10, max: 30, step: 0.5 },
  { key: 'shadowBlur', label: 'Shadow blur', min: 0, max: 50, step: 0.5 },
  { key: 'shadowOpacity', label: 'Shadow opacity', min: 0, max: 1, step: 0.01 },
  { key: 'scaleStep', label: 'Scale step', min: 0, max: 0.02, step: 0.0005 },
];

export const CardStackDebugPanel: React.FC<CardStackDebugPanelProps> = ({
  config,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copyLabel, setCopyLabel] = useState('Copy config');

  const updateValue = (key: keyof CardStackConfig, value: number) => {
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
        className="fixed left-3 top-3 z-[100] rounded bg-black/80 px-3 py-2 font-mono text-[10px] font-bold tracking-wider text-white"
      >
        STACK DEBUG
      </button>
    );
  }

  return (
    <aside className="fixed left-3 top-3 z-[100] max-h-[calc(100vh-24px)] w-[286px] overflow-y-auto rounded-lg bg-black/90 p-3 text-white shadow-2xl">
      <div className="mb-3 flex items-center justify-between">
        <strong className="font-mono text-[11px] tracking-wider">CARD STACK</strong>
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
                onChange={(event) => updateValue(control.key, Number(event.target.value))}
                className="w-[72px] rounded border border-white/20 bg-white/10 px-1 py-0.5 text-right text-white outline-none"
              />
            </span>
            <input
              type="range"
              min={control.min}
              max={control.max}
              step={control.step ?? 1}
              value={config[control.key]}
              onChange={(event) => updateValue(control.key, Number(event.target.value))}
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
          onClick={() => onChange({ ...INITIAL_CARD_STACK_CONFIG })}
          className="rounded bg-white/15 px-2 py-2 font-mono text-[9px] font-bold"
        >
          Reset
        </button>
      </div>
    </aside>
  );
};
