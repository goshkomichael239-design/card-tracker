import React, { useState } from 'react';

import cardboardTexture from '../../assets/cardboard.avif';
import tableTexture from '../../assets/black-main-background.avif';
import {
  INITIAL_TASK_CARD_V2_CONFIG,
  type TaskCardV2Config,
} from '../task-card/taskCardV2Config';

const STACK_TITLES = ['Мама мыла раму', 'Кленовый сироп', 'Абсолютное безумие'];

const SandboxTaskCardV2: React.FC = () => {
  const [config, setConfig] = useState<TaskCardV2Config>({
    ...INITIAL_TASK_CARD_V2_CONFIG,
  });
  const [isDebugOpen, setIsDebugOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const updateNumber = (key: Exclude<keyof TaskCardV2Config, 'paperTint'>, value: number) => {
    setConfig((current) => ({ ...current, [key]: value }));
  };

  const copyConfig = async () => {
    await navigator.clipboard?.writeText(
      `const INITIAL_TASK_CARD_V2_CONFIG = ${JSON.stringify(config, null, 2)};`,
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="fixed inset-0 select-none overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${tableTexture})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 42%, rgba(255,255,255,0.13), transparent 43%), rgba(8,7,6,0.25)',
        }}
      />

      <div className="relative flex h-full items-center justify-center px-4 pt-12">
        <div
          className="relative shrink-0"
          style={{ width: config.width, height: config.height }}
        >
          {STACK_TITLES.map((title, index) => (
            <PrototypeStackCard
              key={title}
              title={title}
              index={index}
              config={config}
            />
          ))}
          <PrototypeTaskCard config={config} />
        </div>
      </div>

      <div className="fixed bottom-3 left-3 z-[1100] max-w-[min(330px,calc(100vw-24px))]">
        <div className="overflow-hidden rounded-xl border border-white/15 bg-black/75 font-mono shadow-xl backdrop-blur">
          <button
            type="button"
            onClick={() => setIsDebugOpen((open) => !open)}
            className="flex w-full items-center justify-between px-3 py-2 text-left text-[10px] uppercase tracking-[0.12em] text-white/75"
          >
            <span>TaskCard V2 · DEV</span>
            <span>{isDebugOpen ? '−' : '+'}</span>
          </button>

          {isDebugOpen && (
            <div className="max-h-[58vh] overflow-y-auto border-t border-white/10 px-3 pb-3 pt-2">
              <div className="grid grid-cols-2 gap-x-3">
                <TuningNumber
                  label="Card width"
                  value={config.width}
                  min={240}
                  max={420}
                  step={1}
                  onChange={(value) => updateNumber('width', value)}
                />
                <TuningNumber
                  label="Card height"
                  value={config.height}
                  min={340}
                  max={620}
                  step={1}
                  onChange={(value) => updateNumber('height', value)}
                />
                <TuningNumber
                  label="Radius"
                  value={config.borderRadius}
                  min={8}
                  max={42}
                  step={1}
                  onChange={(value) => updateNumber('borderRadius', value)}
                />
                <TuningNumber
                  label="Texture"
                  value={config.paperTextureOpacity}
                  min={0}
                  max={0.5}
                  step={0.01}
                  onChange={(value) => updateNumber('paperTextureOpacity', value)}
                />
                <TuningNumber label="Shadow X" value={config.shadowX} min={-8} max={28} step={1} onChange={(value) => updateNumber('shadowX', value)} />
                <TuningNumber label="Shadow Y" value={config.shadowY} min={0} max={42} step={1} onChange={(value) => updateNumber('shadowY', value)} />
                <TuningNumber label="Shadow blur" value={config.shadowBlur} min={0} max={64} step={1} onChange={(value) => updateNumber('shadowBlur', value)} />
                <TuningNumber label="Shadow opacity" value={config.shadowOpacity} min={0} max={0.7} step={0.01} onChange={(value) => updateNumber('shadowOpacity', value)} />
                <TuningNumber label="Stack X" value={config.stackOffsetX} min={0} max={28} step={0.5} onChange={(value) => updateNumber('stackOffsetX', value)} />
                <TuningNumber label="Stack Y" value={config.stackOffsetY} min={0} max={24} step={0.5} onChange={(value) => updateNumber('stackOffsetY', value)} />
                <TuningNumber label="Stack rotation" value={config.stackRotation} min={-4} max={5} step={0.05} onChange={(value) => updateNumber('stackRotation', value)} />
                <TuningNumber label="Content padding" value={config.contentPadding} min={16} max={48} step={1} onChange={(value) => updateNumber('contentPadding', value)} />
                <TuningNumber label="Title size" value={config.titleSize} min={18} max={44} step={1} onChange={(value) => updateNumber('titleSize', value)} />
                <TuningNumber label="Title gap" value={config.titleGap} min={8} max={44} step={1} onChange={(value) => updateNumber('titleGap', value)} />
                <TuningNumber label="Info gap" value={config.infoGap} min={6} max={34} step={1} onChange={(value) => updateNumber('infoGap', value)} />
                <TuningNumber label="Coupon height" value={config.couponHeight} min={30} max={62} step={1} onChange={(value) => updateNumber('couponHeight', value)} />
                <TuningNumber label="Coupon bottom" value={config.couponBottom} min={10} max={48} step={1} onChange={(value) => updateNumber('couponBottom', value)} />
              </div>

              <label className="mt-2 flex items-center justify-between gap-3 text-[9px] text-white/60">
                Paper tint
                <input
                  type="color"
                  value={config.paperTint}
                  onChange={(event) =>
                    setConfig((current) => ({
                      ...current,
                      paperTint: event.target.value,
                    }))
                  }
                  className="h-6 w-9 cursor-pointer rounded border-0 bg-transparent p-0"
                />
              </label>

              <div className="mt-3 flex gap-2">
                <button type="button" onClick={copyConfig} className="rounded-md bg-white/15 px-2 py-1.5 text-[9px] text-white/85">
                  {copied ? 'Copied' : 'Copy config'}
                </button>
                <button type="button" onClick={() => setConfig({ ...INITIAL_TASK_CARD_V2_CONFIG })} className="rounded-md border border-white/15 px-2 py-1.5 text-[9px] text-white/65">
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PrototypeStackCard: React.FC<{
  title: string;
  index: number;
  config: TaskCardV2Config;
}> = ({ title, index, config }) => {
  const depth = index + 1;
  const x = depth * config.stackOffsetX;
  const y = depth * config.stackOffsetY;
  const rotate = depth * config.stackRotation * (index % 2 === 0 ? 1 : -0.65);

  return (
    <div
      className="absolute inset-0 overflow-hidden border"
      style={{
        zIndex: 8 - index,
        borderRadius: config.borderRadius,
        transform: `translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg)`,
        transformOrigin: 'center center',
        backgroundColor: '#F3EEE5',
        boxShadow: `${config.shadowX * 0.55}px ${config.shadowY * 0.6}px ${config.shadowBlur * 0.6}px rgba(20,17,14,${config.shadowOpacity * 0.58})`,
        borderColor: 'rgba(91,76,59,0.16)',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${cardboardTexture})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          mixBlendMode: 'multiply',
          opacity: config.paperTextureOpacity,
        }}
      />
      <div className="absolute left-5 top-6 font-mono text-[8px] uppercase tracking-[0.12em] text-black/20">
        {title}
      </div>
    </div>
  );
};

const PrototypeTaskCard: React.FC<{ config: TaskCardV2Config }> = ({ config }) => (
  <article
    className="absolute inset-0 overflow-hidden border"
    style={{
      zIndex: 20,
      borderRadius: config.borderRadius,
      padding: config.contentPadding,
      backgroundColor: config.paperTint,
      borderColor: 'rgba(91,76,59,0.16)',
      boxShadow: `${config.shadowX}px ${config.shadowY}px ${config.shadowBlur}px rgba(20,17,14,${config.shadowOpacity}), inset 0 1px 0 rgba(255,255,255,0.88), inset 0 -1px 2px rgba(79,61,42,0.08)`,
    }}
  >
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: `url(${cardboardTexture})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        mixBlendMode: 'multiply',
        opacity: config.paperTextureOpacity,
      }}
    />

    <div className="relative flex h-full flex-col">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-[#C9644D]/12 px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#A64C38]">
          Одна задача
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5D8069]/12 text-sm text-[#52725C]">
          ◔
        </span>
      </div>

      <h1
        className="font-semibold leading-[1.08] text-[#28231D]"
        style={{ marginTop: config.titleGap, fontSize: config.titleSize }}
      >
        Рыба в воде
      </h1>

      <div
        className="border-t pt-4"
        style={{
          marginTop: config.infoGap,
          borderColor: 'rgba(69,57,44,0.13)',
        }}
      >
        <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#6B6258]">
          Напоминание
        </p>
        <p className="mt-2 text-[15px] font-medium text-[#3A342D]">
          Завтра · 09:30
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-[#776E63]">
          Спокойно вернуться к этой мысли утром.
        </p>
      </div>

      <div
        className="absolute left-0 right-0"
        style={{ bottom: config.couponBottom, height: config.couponHeight }}
      >
        <div
          className="absolute inset-0 rounded-[8px] border border-dashed"
          style={{
            borderColor: 'rgba(70,59,46,0.62)',
            backgroundColor: 'rgba(255,255,255,0.26)',
            boxShadow: 'inset 0 1px rgba(255,255,255,0.7)',
          }}
        />
        <div
          className="absolute inset-x-2 top-[-5px] border-t border-dashed"
          style={{ borderColor: 'rgba(70,59,46,0.44)' }}
        />
        <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#B4553E]">
          Завершить
        </span>
      </div>

      <span className="absolute bottom-0 left-0 font-mono text-[8px] uppercase tracking-[0.15em] text-black/30">
        Task
      </span>
      <span className="absolute bottom-0 right-0 font-mono text-[8px] uppercase tracking-[0.15em] text-black/30">
        12 Sep
      </span>
    </div>
  </article>
);

const TuningNumber: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}> = ({ label, value, min, max, step, onChange }) => (
  <label className="mt-2 block text-[8px] text-white/55">
    <span className="flex justify-between gap-2">
      <span>{label}</span>
      <span className="text-white/85">{value}</span>
    </span>
    <input
      className="mt-1 w-full accent-[#d8c7aa]"
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  </label>
);

export default SandboxTaskCardV2;
