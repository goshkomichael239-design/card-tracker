import React, { useEffect } from 'react';

import { SETTINGS, useSettings } from '../../app/settings';
import { MotionSetting } from './MotionSetting';
import { SearchHitsSetting } from './SearchHitsSetting';
import { SwipeStyleSetting } from './SwipeStyleSetting';
import { playSound } from '../../app/sounds';

interface SettingsViewProps {
  isOpen: boolean;
  onClose: () => void;
}

const lit = (delayMs: number): React.CSSProperties =>
  ({ ['--lit-delay' as string]: `${delayMs}ms` }) as React.CSSProperties;

/**
 * The settings, lit straight onto the cloth: the table's own interface fades
 * away and the lines light up one after another like lettering in warm light,
 * each with a switch that glows when it is on.
 */
export const SettingsView: React.FC<SettingsViewProps> = ({
  isOpen,
  onClose,
}) => {
  const { values, set } = useSettings();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <div
      data-settings-keep=""
      className="absolute inset-0 z-40 flex flex-col items-center overflow-y-auto px-5"
      style={{
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none',
        transition: 'opacity 260ms ease-out',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Настройки"
      aria-hidden={!isOpen}
    >
      {isOpen && (
        <div className="my-auto w-full max-w-[440px] py-12">
          <h2
            className="lit-in lit-text mb-7 text-center font-mono text-[15px] font-bold uppercase tracking-[0.3em]"
            style={lit(60)}
          >
            Настройки
          </h2>

          <MotionSetting style={lit(110)} />
          <SwipeStyleSetting style={lit(135)} />
          <SearchHitsSetting style={lit(150)} />

          <ul>
            {SETTINGS.map((setting, index) => {
              const isOn = values[setting.id];

              return (
                <li
                  key={setting.id}
                  className="lit-in lit-row flex items-center gap-4"
                  style={lit(160 + index * 90)}
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className={`lit-text${isOn ? '' : ' lit-text--dim'} text-[19px] font-semibold leading-[1.2]`}
                    >
                      {setting.label}
                      {setting.isStub && (
                        <span className="lit-soon">скоро</span>
                      )}
                    </p>
                    <p className="lit-hint mt-1 text-[13px] leading-[1.35]">
                      {setting.hint}
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={isOn}
                    aria-label={setting.label}
                    onClick={() => {
                      playSound('toggle');
                      set(setting.id, !isOn);
                    }}
                    onTouchStart={() => undefined}
                    className="lit-switch shrink-0"
                  >
                    <span className="lit-switch__knob" />
                  </button>
                </li>
              );
            })}
          </ul>

          <p
            className="lit-in lit-hint mt-6 text-center text-[12.5px]"
            style={lit(160 + SETTINGS.length * 90 + 60)}
          >
            Выключатели с пометкой «скоро» пока ничего не меняют.
          </p>

          <button
            type="button"
            onClick={onClose}
            onTouchStart={() => undefined}
            className="lit-in lit-text lit-done mx-auto mt-6 block font-mono text-[13px] font-bold uppercase tracking-[0.24em]"
            style={lit(160 + SETTINGS.length * 90 + 140)}
          >
            Готово
          </button>
        </div>
      )}
    </div>
  );
};
