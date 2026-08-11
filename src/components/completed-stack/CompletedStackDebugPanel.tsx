import React, { useEffect, useRef, useState } from 'react';

import {
  COMPLETED_STACK_MAX_LAYERS,
  INITIAL_COMPLETED_STACK_CONFIG,
  type CompletedStackConfig,
} from './completedStackConfig';

interface CompletedStackDebugPanelProps {
  config: CompletedStackConfig;
  onChange: (config: CompletedStackConfig) => void;
}

interface DebugField {
  key: keyof CompletedStackConfig;
  label: string;
  min: number;
  max: number;
  step: number;
}

const DEBUG_FIELDS: DebugField[] = [
  { key: 'baseX', label: 'Base X', min: -100, max: 100, step: 0.5 },
  { key: 'baseY', label: 'Base Y', min: -100, max: 100, step: 0.5 },
  { key: 'rotationStep', label: 'Rotation step', min: -3, max: 3, step: 0.05 },
  { key: 'offsetX', label: 'Offset X / layer', min: -10, max: 15, step: 0.1 },
  { key: 'offsetY', label: 'Offset Y / layer', min: -10, max: 15, step: 0.1 },
  { key: 'previousTailX', label: 'Previous tail X', min: -20, max: 100, step: 0.5 },
  { key: 'tailX', label: 'Tail X', min: -20, max: 140, step: 0.5 },
  { key: 'tailY', label: 'Tail Y', min: -50, max: 100, step: 0.5 },
  { key: 'previousTailRotation', label: 'Previous tail angle', min: -15, max: 15, step: 0.1 },
  { key: 'tailRotation', label: 'Tail angle', min: -15, max: 20, step: 0.1 },
  { key: 'scale', label: 'Base scale', min: 0.8, max: 1.1, step: 0.005 },
  { key: 'scaleStep', label: 'Scale step', min: -0.03, max: 0.03, step: 0.001 },
  { key: 'completedCount', label: 'Completed count', min: 1, max: COMPLETED_STACK_MAX_LAYERS, step: 1 },
  { key: 'shadowX', label: 'Shadow X', min: -10, max: 20, step: 0.5 },
  { key: 'shadowY', label: 'Shadow Y', min: -10, max: 30, step: 0.5 },
  { key: 'shadowBlur', label: 'Shadow blur', min: 0, max: 40, step: 0.5 },
  { key: 'shadowOpacity', label: 'Shadow opacity', min: 0, max: 1, step: 0.01 },
];

export const CompletedStackDebugPanel: React.FC<
  CompletedStackDebugPanelProps
> = ({ config, onChange }) => {
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current);
      }
    };
  }, []);

  const updateValue = (key: keyof CompletedStackConfig, value: number) => {
    onChange({ ...config, [key]: value });
  };

  const copyConfig = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      setCopied(true);

      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current);
      }

      copiedTimerRef.current = window.setTimeout(() => {
        setCopied(false);
        copiedTimerRef.current = null;
      }, 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <aside className="fixed right-3 top-3 z-[100] max-h-[calc(100vh-24px)] w-[292px] overflow-y-auto rounded-lg border border-white/10 bg-black/90 p-3 text-white shadow-2xl">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/55">
          Completed stack
        </span>
        <button
          type="button"
          onClick={() => onChange({ ...INITIAL_COMPLETED_STACK_CONFIG })}
          className="rounded border border-white/10 px-2 py-1 font-mono text-[9px] text-white/65"
        >
          Reset
        </button>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() =>
            updateValue('completedCount', COMPLETED_STACK_MAX_LAYERS)
          }
          className="rounded border border-white/10 bg-white/5 px-2 py-2 font-mono text-[9px] text-white/75"
        >
          Заполнить стопку
        </button>
        <button
          type="button"
          onClick={() => updateValue('completedCount', 1)}
          className="rounded border border-white/10 bg-white/5 px-2 py-2 font-mono text-[9px] text-white/75"
        >
          Оставить одну
        </button>
      </div>

      <div className="space-y-2.5">
        {DEBUG_FIELDS.map((field) => (
          <label key={field.key} className="block">
            <span className="mb-1 flex items-center justify-between gap-2 font-mono text-[9px] text-white/55">
              <span>{field.label}</span>
              <input
                type="number"
                min={field.min}
                max={field.max}
                step={field.step}
                value={config[field.key]}
                onChange={(event) =>
                  updateValue(field.key, Number(event.target.value))
                }
                className="w-[72px] rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-right text-white/80 outline-none"
              />
            </span>
            <input
              type="range"
              min={field.min}
              max={field.max}
              step={field.step}
              value={config[field.key]}
              onChange={(event) =>
                updateValue(field.key, Number(event.target.value))
              }
              className="block w-full"
            />
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={copyConfig}
        className="mt-3 w-full rounded border border-white/15 bg-white/10 px-3 py-2 font-mono text-[10px] text-white/80"
      >
        {copied ? 'Copied' : 'Copy config'}
      </button>
    </aside>
  );
};
