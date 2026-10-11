import React from 'react';

import {
  MOTION_LEVELS,
  setMotionLevel,
  useMotionLevel,
  type MotionLevel,
} from '../../app/motion';

const LABELS: Record<MotionLevel, string> = {
  full: 'Все',
  calm: 'Спокойно',
  off: 'Выкл',
};

const HINTS: Record<MotionLevel, string> = {
  full: 'Отрыв купона, смена карточек, штампы и блики — как задумано',
  calm: 'Короче и тише: без бликов, подпрыгиваний и «дыхания»',
  off: 'Всё происходит сразу, без секунды зрелища — для тех, кто спешит',
};

/**
 * The amount of movement, in three steps: everything, calm, none. Lit on the
 * cloth like the switches below it.
 */
export const MotionSetting: React.FC<{ style?: React.CSSProperties }> = ({
  style,
}) => {
  const level = useMotionLevel();

  return (
    <div className="lit-in lit-row" style={style}>
      <p
        className={`lit-text${level === 'off' ? ' lit-text--dim' : ''} text-[19px] font-semibold leading-[1.2]`}
      >
        Анимации
      </p>

      <div className="lit-seg mt-2" role="radiogroup" aria-label="Анимации">
        {MOTION_LEVELS.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={level === option}
            onClick={() => setMotionLevel(option)}
            onTouchStart={() => undefined}
            className={`lit-seg__item${level === option ? ' lit-seg__item--on' : ''}`}
          >
            {LABELS[option]}
          </button>
        ))}
      </div>

      <p className="lit-hint mt-2 text-[13px] leading-[1.35]">{HINTS[level]}</p>
    </div>
  );
};
