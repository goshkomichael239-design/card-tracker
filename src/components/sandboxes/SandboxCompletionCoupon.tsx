import React, { useState } from 'react';
import {
  AnimatePresence,
  motion,
} from 'framer-motion';

import tableTexture from '../../assets/table-background.webp';
import cardboardTexture from '../../assets/cardboard.svg';

/* -------------------------------------------------------------------------- */
/*                                    Типы                                    */
/* -------------------------------------------------------------------------- */

type PaletteId =
  | 'timeless'
  | 'deadline'
  | 'reminder';

type PerforationStyle =
  | 'black'
  | 'layered';

interface CardPalette {
  name: string;
  paper: string;
  accent: string;
  accentDark: string;
  ink: string;
}

interface CouponSettings {
  width: number;
  height: number;

  bottom: number;
  offsetX: number;

  cornerRadius: number;

  perforationStyle: PerforationStyle;

  perforationY: number;

  dashLength: number;
  dashGap: number;
  dashOffset: number;

  coreThickness: number;

  shoulderThickness: number;
  shoulderOpacity: number;

  shadowEnabled: boolean;
  shadowStrength: number;

  hoverLift: number;

  tearX: number;
  tearY: number;
  tearRotate: number;
}

/* -------------------------------------------------------------------------- */
/*                                 Константы                                  */
/* -------------------------------------------------------------------------- */

const PALETTES: Record<
  PaletteId,
  CardPalette
> = {
  timeless: {
    name: 'Без времени',
    paper: '#E8D9C0',
    accent: '#CD5334',
    accentDark: '#8F3025',
    ink: '#1E1C1A',
  },

  deadline: {
    name: 'Дедлайн',
    paper: '#CFD7E0',
    accent: '#4A6578',
    accentDark: '#2E4655',
    ink: '#1B242A',
  },

  reminder: {
    name: 'Напоминание',
    paper: '#CDD9C4',
    accent: '#5C7A5A',
    accentDark: '#3E583D',
    ink: '#1D251D',
  },
};

const DEFAULT_SETTINGS: CouponSettings = {
  width: 232,
  height: 38,

  bottom: 76,
  offsetX: 0,

  cornerRadius: 8,

  perforationStyle: 'layered',

  /*
   * Линия находится немного ниже верхнего края.
   * Значение 2–3px выглядит как вдавленная перфорация,
   * а не как обычная CSS-рамка.
   */
  perforationY: 2.5,

  dashLength: 5,
  dashGap: 3,
  dashOffset: 0,

  coreThickness: 1.15,

  shoulderThickness: 2.8,
  shoulderOpacity: 0.52,

  shadowEnabled: false,
  shadowStrength: 0.34,

  hoverLift: 1.2,

  tearX: 18,
  tearY: 68,
  tearRotate: 5,
};

const CARD_SHADOW = `
  18px 28px 50px -8px rgba(0,0,0,0.72),
  8px 14px 24px -4px rgba(0,0,0,0.42),
  inset 0 1.5px 1px rgba(255,255,255,0.7),
  inset 0 -2px 4px rgba(0,0,0,0.1)
`;

const PHYSICAL_SPRING = {
  type: 'spring' as const,
  stiffness: 170,
  damping: 19,
  mass: 0.82,
};

/* -------------------------------------------------------------------------- */
/*                                  Утилиты                                   */
/* -------------------------------------------------------------------------- */

const padNumber = (
  value: number,
): string => {
  return String(value).padStart(2, '0');
};

const formatCompletedDate = (
  value: string,
): string => {
  const date = new Date(value);

  return [
    padNumber(date.getDate()),
    '.',
    padNumber(date.getMonth() + 1),
    '.',
    date.getFullYear(),
    ' · ',
    padNumber(date.getHours()),
    ':',
    padNumber(date.getMinutes()),
  ].join('');
};

/* -------------------------------------------------------------------------- */
/*                                  Песочница                                 */
/* -------------------------------------------------------------------------- */

const SandboxCompletionCoupon: React.FC =
  () => {
    const [paletteId, setPaletteId] =
      useState<PaletteId>('timeless');

    const [settings, setSettings] =
      useState<CouponSettings>({
        ...DEFAULT_SETTINGS,
      });

    const [completedAt, setCompletedAt] =
      useState<string | null>(null);

    const [debugOpen, setDebugOpen] =
      useState(true);

    const palette =
      PALETTES[paletteId];

    const handleComplete = () => {
      if (completedAt) {
        return;
      }

      setCompletedAt(
        new Date().toISOString(),
      );
    };

    const handleResetCoupon = () => {
      setCompletedAt(null);
    };

    const updateSetting = <
      Key extends keyof CouponSettings,
    >(
      key: Key,
      value: CouponSettings[Key],
    ) => {
      setSettings((previous) => ({
        ...previous,
        [key]: value,
      }));
    };

    return (
      <main className="relative h-full w-full overflow-hidden">
        <TableBackground />

        <div className="relative z-10 flex h-full w-full items-center justify-center px-4 py-10">
          <article
            className="relative w-[300px] max-w-[78vw] overflow-hidden rounded-[32px]"
            style={{
              aspectRatio: '9 / 16',

              backgroundColor:
                palette.paper,

              backgroundImage: `
                linear-gradient(
                  175deg,
                  rgba(255,255,255,0.11) 0%,
                  rgba(0,0,0,0.025) 100%
                ),
                url(${cardboardTexture})
              `,

              backgroundPosition:
                'center, center',

              backgroundSize:
                '100% 100%, cover',

              backgroundBlendMode:
                'soft-light, multiply',

              boxShadow: CARD_SHADOW,

              transition:
                'background-color 300ms ease',
            }}
          >
            <div className="relative z-10 px-6 pt-7">
              <CardStamp
                palette={palette}
              />

              <h1
                className="mt-7 text-[1.7rem] font-bold leading-tight"
                style={{
                  color: palette.ink,

                  letterSpacing:
                    '-0.025em',
                }}
              >
                Отполировать
                <br />
                перфорацию
              </h1>

              <p
                className="mt-4 max-w-[205px] text-[11px] leading-relaxed"
                style={{
                  color:
                    'rgba(30,28,26,0.44)',
                }}
              >
                Настраиваем пунктир отдельно
                от материала, теней и
                анимации отрыва.
              </p>
            </div>

            <CompletionCoupon
              palette={palette}
              settings={settings}
              completedAt={
                completedAt ?? undefined
              }
              onComplete={handleComplete}
            />

            <div
              className="absolute bottom-5 left-6 right-6 flex items-center justify-between border-t pt-4"
              style={{
                borderColor:
                  'rgba(0,0,0,0.08)',
              }}
            >
              <span
                className="font-mono text-[9px] uppercase tracking-[0.14em]"
                style={{
                  color:
                    'rgba(30,28,26,0.34)',
                }}
              >
                COUPON LAB
              </span>

              <span
                className="font-mono text-[9px] uppercase tracking-[0.14em]"
                style={{
                  color:
                    'rgba(30,28,26,0.34)',
                }}
              >
                04 АВГ
              </span>
            </div>
          </article>
        </div>

        <DebugPanel
          isOpen={debugOpen}
          settings={settings}
          paletteId={paletteId}
          completed={Boolean(completedAt)}
          onToggle={() =>
            setDebugOpen(
              (previous) => !previous,
            )
          }
          onPaletteChange={setPaletteId}
          onSettingChange={updateSetting}
          onResetSettings={() =>
            setSettings({
              ...DEFAULT_SETTINGS,
            })
          }
          onResetCoupon={
            handleResetCoupon
          }
        />
      </main>
    );
  };

/* -------------------------------------------------------------------------- */
/*                            Перфорированный купон                           */
/* -------------------------------------------------------------------------- */

interface CompletionCouponProps {
  palette: CardPalette;
  settings: CouponSettings;

  completedAt?: string;

  onComplete: () => void;
}

const CompletionCoupon: React.FC<
  CompletionCouponProps
> = ({
  palette,
  settings,
  completedAt,
  onComplete,
}) => {
  const dashPattern =
    `${settings.dashLength} ${settings.dashGap}`;

  const outerDropShadow =
    settings.shadowEnabled
      ? `
          drop-shadow(
            0
            ${
              2 +
              settings.shadowStrength * 6
            }px
            ${
              2 +
              settings.shadowStrength * 8
            }px
            rgba(
              0,
              0,
              0,
              ${
                0.08 +
                settings.shadowStrength *
                  0.32
              }
            )
          )
        `
      : 'none';

  const paperBoxShadow =
    settings.shadowEnabled
      ? `
          0 5px 8px -6px rgba(
            0,
            0,
            0,
            ${
              0.24 +
              settings.shadowStrength * 0.3
            }
          ),
          inset 0 1px 1px rgba(255,255,255,0.38),
          inset 0 -1px 2px rgba(0,0,0,0.04)
        `
      : 'none';

  const innerLayerShadow =
    settings.shadowEnabled
      ? `
          inset 2px 3px 7px rgba(0,0,0,0.36),
          inset -1px -1px 2px rgba(255,255,255,0.1)
        `
      : 'none';

  return (
    <div
      className="absolute left-1/2 z-20"
      style={{
        width: `${settings.width}px`,
        height: `${settings.height}px`,

        maxWidth:
          'calc(100% - 34px)',

        bottom: `${settings.bottom}px`,

        transform: `
          translateX(
            calc(-50% + ${settings.offsetX}px)
          )
        `,

        perspective: '900px',
      }}
    >
      {/* Нижний слой */}
      <motion.div
        animate={{
          backgroundColor: completedAt
            ? palette.accent
            : 'rgba(32,28,25,0.18)',
        }}
        transition={{
          duration: 0.26,
        }}
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
        style={{
          borderRadius: `${settings.cornerRadius}px`,

          backgroundImage: `
            linear-gradient(
              180deg,
              rgba(255,255,255,0.06) 0%,
              rgba(0,0,0,0.09) 100%
            ),
            url(${cardboardTexture})
          `,

          backgroundPosition:
            'center, center',

          backgroundSize:
            '100% 100%, cover',

          backgroundBlendMode:
            'soft-light, multiply',

          boxShadow:
            innerLayerShadow,
        }}
      >
        <AnimatePresence>
          {completedAt && (
            <motion.span
              initial={{
                opacity: 0,
                y: 4,
                scale: 0.97,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              transition={{
                delay: 0.14,
                duration: 0.24,
              }}
              className="px-3 text-center font-mono text-[8px] font-semibold uppercase tracking-[0.08em]"
              style={{
                color:
                  'rgba(255,255,255,0.92)',

                textShadow:
                  '0 1px 1px rgba(0,0,0,0.28)',
              }}
            >
              Выполнено ·{' '}
              {formatCompletedDate(
                completedAt,
              )}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Верхняя бумажная часть */}
      <AnimatePresence>
        {!completedAt && (
          <motion.button
            type="button"
            onClick={onComplete}
            initial={{
              opacity: 1,
              x: 0,
              y: 0,
              rotate: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              x: settings.tearX,
              y: settings.tearY,

              rotate:
                settings.tearRotate,

              scale: 0.965,
            }}
            transition={PHYSICAL_SPRING}
            whileHover={{
              y: -settings.hoverLift,
              rotateX:
                settings.hoverLift > 0
                  ? -1.2
                  : 0,
            }}
            whileTap={{
              y: 1,
              scale: 0.992,
              rotateX: 0.7,
            }}
            className="absolute inset-0 cursor-pointer border-0 bg-transparent p-0"
            style={{
              transformOrigin:
                'center bottom',

              filter: outerDropShadow,
            }}
            aria-label="Завершить задачу"
          >
            <div
              className="absolute inset-0 overflow-hidden"
              style={{
                borderRadius: `${settings.cornerRadius}px`,

                backgroundColor:
                  palette.paper,

                backgroundImage: `
                  linear-gradient(
                    180deg,
                    rgba(255,255,255,0.1) 0%,
                    rgba(255,255,255,0.01) 48%,
                    rgba(0,0,0,0.025) 100%
                  ),
                  url(${cardboardTexture})
                `,

                backgroundPosition:
                  'center, center',

                backgroundSize:
                  '100% 100%, cover',

                backgroundBlendMode:
                  'soft-light, multiply',

                boxShadow:
                  paperBoxShadow,
              }}
            />

            {/* Отдельный SVG только для перфорации */}
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
              viewBox={`0 0 ${settings.width} ${settings.height}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {settings.perforationStyle ===
              'black' ? (
                /*
                 * Вариант 1:
                 * один чёрный пунктир.
                 */
                <line
                  x1="0"
                  y1={settings.perforationY}
                  x2={settings.width}
                  y2={settings.perforationY}
                  stroke="rgba(12,12,12,0.88)"
                  strokeWidth={
                    settings.coreThickness
                  }
                  strokeDasharray={
                    dashPattern
                  }
                  strokeDashoffset={
                    settings.dashOffset
                  }
                  strokeLinecap="butt"
                  vectorEffect="non-scaling-stroke"
                />
              ) : (
                /*
                 * Вариант 2:
                 * широкая серая кромка под
                 * тонкой чёрной сердцевиной.
                 */
                <>
                  <line
                    x1="0"
                    y1={
                      settings.perforationY
                    }
                    x2={settings.width}
                    y2={
                      settings.perforationY
                    }
                    stroke={`rgba(
                      112,
                      112,
                      112,
                      ${settings.shoulderOpacity}
                    )`}
                    strokeWidth={
                      Math.max(
                        settings.shoulderThickness,
                        settings.coreThickness,
                      )
                    }
                    strokeDasharray={
                      dashPattern
                    }
                    strokeDashoffset={
                      settings.dashOffset
                    }
                    strokeLinecap="butt"
                    vectorEffect="non-scaling-stroke"
                  />

                  <line
                    x1="0"
                    y1={
                      settings.perforationY
                    }
                    x2={settings.width}
                    y2={
                      settings.perforationY
                    }
                    stroke="rgba(8,8,8,0.94)"
                    strokeWidth={
                      settings.coreThickness
                    }
                    strokeDasharray={
                      dashPattern
                    }
                    strokeDashoffset={
                      settings.dashOffset
                    }
                    strokeLinecap="butt"
                    vectorEffect="non-scaling-stroke"
                  />
                </>
              )}

              {/* Тонкий нижний край бумаги */}
              <line
                x1={
                  settings.cornerRadius
                }
                y1={
                  settings.height - 1
                }
                x2={
                  settings.width -
                  settings.cornerRadius
                }
                y2={
                  settings.height - 1
                }
                stroke="rgba(0,0,0,0.07)"
                strokeWidth="0.6"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {/* Тиснёный текст */}
            <span
              className="absolute inset-0 flex select-none items-center justify-center pt-[3px] font-mono text-[9px] font-semibold uppercase tracking-[0.18em]"
              style={{
                color:
                  'rgba(36,30,26,0.55)',

                textShadow: `
                  -1px -1px 1px rgba(0,0,0,0.22),
                  1px 1px 1px rgba(255,255,255,0.52)
                `,
              }}
            >
              Завершить
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                  Штамп                                     */
/* -------------------------------------------------------------------------- */

interface CardStampProps {
  palette: CardPalette;
}

const CardStamp: React.FC<
  CardStampProps
> = ({ palette }) => {
  return (
    <span
      className="inline-flex shrink-0 items-center whitespace-nowrap rounded-[9px] px-[13px] py-[7px] font-mono text-[10px] font-semibold uppercase tracking-[0.1em]"
      style={{
        width: 'max-content',
        minHeight: '30px',

        color:
          'rgba(255,255,255,0.94)',

        backgroundColor:
          palette.accent,

        boxShadow: `
          inset 2px 2px 5px rgba(0,0,0,0.42),
          inset -1px -1px 1px rgba(255,255,255,0.2),
          0 2px 4px rgba(0,0,0,0.18)
        `,

        textShadow:
          '0 1px 1px rgba(0,0,0,0.28)',
      }}
    >
      Одна задача
    </span>
  );
};

/* -------------------------------------------------------------------------- */
/*                            Отладочная панель                               */
/* -------------------------------------------------------------------------- */

interface DebugPanelProps {
  isOpen: boolean;

  settings: CouponSettings;

  paletteId: PaletteId;

  completed: boolean;

  onToggle: () => void;

  onPaletteChange: (
    palette: PaletteId,
  ) => void;

  onSettingChange: <
    Key extends keyof CouponSettings,
  >(
    key: Key,
    value: CouponSettings[Key],
  ) => void;

  onResetSettings: () => void;
  onResetCoupon: () => void;
}

const DebugPanel: React.FC<
  DebugPanelProps
> = ({
  isOpen,
  settings,
  paletteId,
  completed,
  onToggle,
  onPaletteChange,
  onSettingChange,
  onResetSettings,
  onResetCoupon,
}) => {
  const patternStep =
    settings.dashLength +
    settings.dashGap;

  return (
    <div className="fixed bottom-4 left-4 z-[1000]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{
              opacity: 0,
              y: 12,
              scale: 0.97,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 8,
              scale: 0.98,
            }}
            transition={{
              duration: 0.18,
            }}
            className="mb-3 max-h-[76vh] w-[318px] max-w-[calc(100vw-32px)] overflow-y-auto rounded-2xl p-4"
            style={{
              background:
                'rgba(8,9,10,0.88)',

              backdropFilter:
                'blur(18px)',

              border:
                '1px solid rgba(255,255,255,0.1)',

              boxShadow:
                '0 16px 45px rgba(0,0,0,0.48)',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/70">
                  Перфорация
                </p>

                <p className="mt-1 text-[10px] leading-relaxed text-white/30">
                  Прямой пунктир без
                  круглых отверстий
                </p>
              </div>

              <button
                type="button"
                onClick={onResetSettings}
                className="shrink-0 rounded-lg px-2 py-1 font-mono text-[9px] text-white/40 transition hover:bg-white/10 hover:text-white/75"
              >
                Сбросить
              </button>
            </div>

            {/* Гамма */}
            <div className="mt-4">
              <PanelLabel>
                Гамма карты
              </PanelLabel>

              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {(
                  Object.keys(
                    PALETTES,
                  ) as PaletteId[]
                ).map((id) => {
                  const palette =
                    PALETTES[id];

                  const selected =
                    paletteId === id;

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() =>
                        onPaletteChange(id)
                      }
                      className="rounded-xl px-1 py-2 font-mono text-[8px] transition"
                      style={{
                        color: selected
                          ? '#FFFFFF'
                          : 'rgba(255,255,255,0.46)',

                        backgroundColor:
                          selected
                            ? palette.accent
                            : 'rgba(255,255,255,0.05)',

                        border: selected
                          ? `1px solid ${palette.accent}`
                          : '1px solid rgba(255,255,255,0.07)',
                      }}
                    >
                      {palette.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Стиль перфорации */}
            <div className="mt-5">
              <PanelLabel>
                Цвет перфорации
              </PanelLabel>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <PerforationStyleButton
                  label="Чёрный"
                  description="Одна линия"
                  selected={
                    settings.perforationStyle ===
                    'black'
                  }
                  onClick={() =>
                    onSettingChange(
                      'perforationStyle',
                      'black',
                    )
                  }
                />

                <PerforationStyleButton
                  label="Сердцевина"
                  description="Чёрный + серый"
                  selected={
                    settings.perforationStyle ===
                    'layered'
                  }
                  onClick={() =>
                    onSettingChange(
                      'perforationStyle',
                      'layered',
                    )
                  }
                />
              </div>
            </div>

            {/* Тени */}
            <label
              className="mt-5 flex cursor-pointer items-center justify-between rounded-xl px-3 py-3"
              style={{
                background:
                  'rgba(255,255,255,0.045)',

                border:
                  '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <span>
                <span className="block font-mono text-[9px] uppercase tracking-[0.12em] text-white/60">
                  Тени купона
                </span>

                <span className="mt-1 block text-[9px] text-white/28">
                  Можно полностью отключить
                </span>
              </span>

              <input
                type="checkbox"
                checked={
                  settings.shadowEnabled
                }
                onChange={(event) =>
                  onSettingChange(
                    'shadowEnabled',
                    event.target.checked,
                  )
                }
                className="h-4 w-4 cursor-pointer accent-[#C4B998]"
              />
            </label>

            <div className="mt-5 space-y-4">
              <PanelLabel>
                Геометрия купона
              </PanelLabel>

              <DebugSlider
                label="Ширина"
                value={settings.width}
                min={170}
                max={270}
                step={1}
                suffix="px"
                onChange={(value) =>
                  onSettingChange(
                    'width',
                    value,
                  )
                }
              />

              <DebugSlider
                label="Высота"
                value={settings.height}
                min={24}
                max={60}
                step={1}
                suffix="px"
                onChange={(value) =>
                  onSettingChange(
                    'height',
                    value,
                  )
                }
              />

              <DebugSlider
                label="Положение снизу"
                value={settings.bottom}
                min={48}
                max={180}
                step={1}
                suffix="px"
                onChange={(value) =>
                  onSettingChange(
                    'bottom',
                    value,
                  )
                }
              />

              <DebugSlider
                label="Сдвиг X"
                value={settings.offsetX}
                min={-35}
                max={35}
                step={1}
                suffix="px"
                onChange={(value) =>
                  onSettingChange(
                    'offsetX',
                    value,
                  )
                }
              />

              <DebugSlider
                label="Скругление"
                value={
                  settings.cornerRadius
                }
                min={0}
                max={18}
                step={1}
                suffix="px"
                onChange={(value) =>
                  onSettingChange(
                    'cornerRadius',
                    value,
                  )
                }
              />
            </div>

            <div
              className="my-5 h-px"
              style={{
                background:
                  'rgba(255,255,255,0.07)',
              }}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <PanelLabel>
                  Рисунок пунктира
                </PanelLabel>

                <span className="font-mono text-[8px] text-white/35">
                  шаг {patternStep.toFixed(1)}
                  px
                </span>
              </div>

              <DebugSlider
                label="Длина штриха"
                value={
                  settings.dashLength
                }
                min={0.5}
                max={18}
                step={0.1}
                suffix="px"
                onChange={(value) =>
                  onSettingChange(
                    'dashLength',
                    value,
                  )
                }
              />

              <DebugSlider
                label="Расстояние"
                value={settings.dashGap}
                min={0.5}
                max={18}
                step={0.1}
                suffix="px"
                onChange={(value) =>
                  onSettingChange(
                    'dashGap',
                    value,
                  )
                }
              />

              <DebugSlider
                label="Смещение узора"
                value={
                  settings.dashOffset
                }
                min={-20}
                max={20}
                step={0.1}
                suffix="px"
                onChange={(value) =>
                  onSettingChange(
                    'dashOffset',
                    value,
                  )
                }
              />

              <DebugSlider
                label="Положение линии"
                value={
                  settings.perforationY
                }
                min={0}
                max={12}
                step={0.1}
                suffix="px"
                onChange={(value) =>
                  onSettingChange(
                    'perforationY',
                    value,
                  )
                }
              />

              <DebugSlider
                label="Толщина сердцевины"
                value={
                  settings.coreThickness
                }
                min={0.3}
                max={5}
                step={0.05}
                suffix="px"
                onChange={(value) =>
                  onSettingChange(
                    'coreThickness',
                    value,
                  )
                }
              />

              {settings.perforationStyle ===
                'layered' && (
                <>
                  <DebugSlider
                    label="Ширина серых краёв"
                    value={
                      settings.shoulderThickness
                    }
                    min={0.5}
                    max={8}
                    step={0.1}
                    suffix="px"
                    onChange={(value) =>
                      onSettingChange(
                        'shoulderThickness',
                        value,
                      )
                    }
                  />

                  <DebugSlider
                    label="Яркость серых краёв"
                    value={
                      settings.shoulderOpacity
                    }
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(value) =>
                      onSettingChange(
                        'shoulderOpacity',
                        value,
                      )
                    }
                  />
                </>
              )}
            </div>

            {settings.shadowEnabled && (
              <>
                <div
                  className="my-5 h-px"
                  style={{
                    background:
                      'rgba(255,255,255,0.07)',
                  }}
                />

                <DebugSlider
                  label="Сила тени"
                  value={
                    settings.shadowStrength
                  }
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(value) =>
                    onSettingChange(
                      'shadowStrength',
                      value,
                    )
                  }
                />
              </>
            )}

            <div
              className="my-5 h-px"
              style={{
                background:
                  'rgba(255,255,255,0.07)',
              }}
            />

            <div className="space-y-4">
              <PanelLabel>
                Анимация
              </PanelLabel>

              <DebugSlider
                label="Подъём при наведении"
                value={settings.hoverLift}
                min={0}
                max={5}
                step={0.1}
                suffix="px"
                onChange={(value) =>
                  onSettingChange(
                    'hoverLift',
                    value,
                  )
                }
              />

              <DebugSlider
                label="Отрыв X"
                value={settings.tearX}
                min={-20}
                max={160}
                step={1}
                suffix="px"
                onChange={(value) =>
                  onSettingChange(
                    'tearX',
                    value,
                  )
                }
              />

              <DebugSlider
                label="Отрыв Y"
                value={settings.tearY}
                min={20}
                max={180}
                step={1}
                suffix="px"
                onChange={(value) =>
                  onSettingChange(
                    'tearY',
                    value,
                  )
                }
              />

              <DebugSlider
                label="Поворот при отрыве"
                value={settings.tearRotate}
                min={-20}
                max={20}
                step={0.5}
                suffix="°"
                onChange={(value) =>
                  onSettingChange(
                    'tearRotate',
                    value,
                  )
                }
              />
            </div>

            <button
              type="button"
              onClick={onResetCoupon}
              disabled={!completed}
              className="mt-5 w-full rounded-xl px-3 py-2.5 font-mono text-[9px] uppercase tracking-[0.12em] transition disabled:cursor-default disabled:opacity-30"
              style={{
                color:
                  'rgba(255,255,255,0.72)',

                background:
                  'rgba(255,255,255,0.07)',

                border:
                  '1px solid rgba(255,255,255,0.08)',
              }}
            >
              Вернуть купон
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={onToggle}
        className="rounded-xl px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-white/55 transition hover:text-white/85"
        style={{
          background:
            'rgba(8,9,10,0.7)',

          backdropFilter:
            'blur(14px)',

          border:
            '1px solid rgba(255,255,255,0.09)',

          boxShadow:
            '0 8px 22px rgba(0,0,0,0.28)',
        }}
      >
        {isOpen
          ? 'Закрыть отладку'
          : 'Отладка'}
      </button>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                      Кнопка варианта перфорации                            */
/* -------------------------------------------------------------------------- */

interface PerforationStyleButtonProps {
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

const PerforationStyleButton: React.FC<
  PerforationStyleButtonProps
> = ({
  label,
  description,
  selected,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl px-3 py-2.5 text-left transition"
      style={{
        color: selected
          ? 'rgba(255,255,255,0.92)'
          : 'rgba(255,255,255,0.48)',

        background: selected
          ? 'rgba(255,255,255,0.11)'
          : 'rgba(255,255,255,0.035)',

        border: selected
          ? '1px solid rgba(255,255,255,0.18)'
          : '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <span className="block font-mono text-[9px] font-semibold uppercase tracking-[0.1em]">
        {label}
      </span>

      <span className="mt-1 block text-[8px] text-white/30">
        {description}
      </span>
    </button>
  );
};

/* -------------------------------------------------------------------------- */
/*                             Заголовок панели                               */
/* -------------------------------------------------------------------------- */

interface PanelLabelProps {
  children: React.ReactNode;
}

const PanelLabel: React.FC<
  PanelLabelProps
> = ({ children }) => {
  return (
    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">
      {children}
    </span>
  );
};

/* -------------------------------------------------------------------------- */
/*                                Ползунок                                    */
/* -------------------------------------------------------------------------- */

interface DebugSliderProps {
  label: string;
  value: number;

  min: number;
  max: number;
  step: number;

  suffix?: string;

  onChange: (
    value: number,
  ) => void;
}

const DebugSlider: React.FC<
  DebugSliderProps
> = ({
  label,
  value,
  min,
  max,
  step,
  suffix = '',
  onChange,
}) => {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between font-mono text-[10px]">
        <span className="text-white/45">
          {label}
        </span>

        <span className="text-white/72">
          {Number.isInteger(value)
            ? value
            : value.toFixed(2)}
          {suffix}
        </span>
      </div>

      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) =>
          onChange(
            Number(
              event.target.value,
            ),
          )
        }
        className="h-1 w-full cursor-pointer accent-[#C4B998]"
      />
    </label>
  );
};

/* -------------------------------------------------------------------------- */
/*                                   Стол                                     */
/* -------------------------------------------------------------------------- */

const TableBackground: React.FC = () => {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${tableTexture})`,

          backgroundPosition:
            'center',

          backgroundSize:
            'cover',
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(
              ellipse at 25% 15%,
              rgba(255,255,255,0.12) 0%,
              transparent 55%
            ),
            radial-gradient(
              ellipse at 50% 45%,
              rgba(255,255,255,0.035) 0%,
              transparent 42%
            ),
            rgba(0,0,0,0.22)
          `,
        }}
      />
    </>
  );
};

export default SandboxCompletionCoupon;