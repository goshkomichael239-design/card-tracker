import React, { useEffect, useState } from 'react';

import { SETTINGS, useSettings } from '../../app/settings';
import { AboutView } from './AboutView';
import { MotionSetting } from './MotionSetting';
import { FileStyleSetting } from './FileStyleSetting';
import { LanguageSetting } from './LanguageSetting';
import { SearchHitsSetting } from './SearchHitsSetting';
import { SwipeStyleSetting } from './SwipeStyleSetting';
import { canVibrate } from '../../app/haptics';
import { isNotificationsAvailable } from '../../app/notifications';
import { playSound } from '../../app/sounds';
import { t } from '../../app/i18n';

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
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Closing the settings also closes "About" (adjusting state while rendering,
  // as React advises for state that follows a prop).
  const [wasOpen, setWasOpen] = useState(isOpen);

  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);

    if (!isOpen) {
      setIsAboutOpen(false);
    }
  }

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
        transition: 'opacity 240ms ease-out',
      }}
      role="dialog"
      aria-modal="true"
      aria-label={t('Настройки')}
      aria-hidden={!isOpen}
    >
      {isOpen && isAboutOpen && (
        <AboutView onBack={() => setIsAboutOpen(false)} />
      )}

      {isOpen && !isAboutOpen && (
        <div className="my-auto w-full max-w-[440px] py-12">
          <h2
            className="lit-in lit-text mb-7 text-center font-mono text-[15px] font-bold uppercase tracking-[0.3em]"
            style={lit(60)}
          >{t('Настройки')}</h2>

          <LanguageSetting style={lit(100)} />
          <MotionSetting style={lit(110)} />
          <SwipeStyleSetting style={lit(135)} />
          <SearchHitsSetting style={lit(150)} />
          <FileStyleSetting style={lit(155)} />

          <ul>
            {SETTINGS.filter(
              // A phone that cannot vibrate (an iPhone) has nothing to switch,
              // and notifications exist only inside the phone's app.
              (setting) =>
                (setting.id !== 'haptics' || canVibrate()) &&
                (setting.id !== 'reminders' || isNotificationsAvailable()),
            ).map((setting, index) => {
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

          <button
            type="button"
            onClick={() => setIsAboutOpen(true)}
            onTouchStart={() => undefined}
            className="lit-in lit-text lit-done mx-auto mt-5 block font-mono text-[13px] font-bold uppercase tracking-[0.24em]"
            style={lit(160 + SETTINGS.length * 90 + 30)}
          >
            {t('О программе')}
          </button>

          <button
            type="button"
            onClick={onClose}
            onTouchStart={() => undefined}
            className="lit-in lit-text lit-done mx-auto mt-6 block font-mono text-[13px] font-bold uppercase tracking-[0.24em]"
            style={lit(160 + SETTINGS.length * 90 + 60)}
          >{t('Готово')}</button>
        </div>
      )}
    </div>
  );
};
