import React from 'react';

import {
  addDemoData,
  removeDemoData,
  useHasDemoData,
} from '../../app/demoData';
import { playSound } from '../../app/sounds';
import { t } from '../../app/i18n';

/** A die, drawn as a rounded square with five pips, in the colour of the text. */
const Dice: React.FC = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="4.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
    {[
      [8, 8],
      [16, 8],
      [12, 12],
      [8, 16],
      [16, 16],
    ].map(([cx, cy]) => (
      <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.6" fill="currentColor" />
    ))}
  </svg>
);

/**
 * Test decks and cards on request: a die adds them (in the language of the
 * app), the other button removes exactly them again.
 */
export const DemoDataSetting: React.FC<{ style?: React.CSSProperties }> = ({
  style,
}) => {
  const hasDemo = useHasDemoData();

  return (
    <div className="lit-in lit-row" style={style}>
      <p className="lit-text text-[19px] font-semibold leading-[1.2]">
        {t('Тестовые колоды и карточки')}
      </p>

      <div className="lit-seg mt-2" role="group">
        <button
          type="button"
          disabled={hasDemo}
          onClick={() => {
            playSound('toggle');
            addDemoData();
          }}
          onTouchStart={() => undefined}
          className={`lit-seg__item${hasDemo ? '' : ' lit-seg__item--on'}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            opacity: hasDemo ? 0.4 : 1,
          }}
        >
          <Dice />
          {t('Добавить')}
        </button>

        <button
          type="button"
          disabled={!hasDemo}
          onClick={() => {
            playSound('toggle');
            removeDemoData();
          }}
          onTouchStart={() => undefined}
          className={`lit-seg__item${hasDemo ? ' lit-seg__item--on' : ''}`}
          style={{ opacity: hasDemo ? 1 : 0.4 }}
        >
          {t('Удалить их')}
        </button>
      </div>

      <p className="lit-hint mt-2 text-[13px] leading-[1.35]">
        {hasDemo
          ? t('Тестовый набор добавлен. Удаляются только его колоды и карточки.')
          : t('Две колоды и три десятка карточек всех видов, чтобы всё посмотреть. Удалить можно одним нажатием.')}
      </p>
    </div>
  );
};
