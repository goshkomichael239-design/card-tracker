import React from 'react';

import {
  SWIPE_STYLES,
  setSwipeStyle,
  useSwipeStyle,
  type SwipeStyle,
} from '../../app/swipeStyle';

const LABELS: Record<SwipeStyle, string> = {
  stamp: 'Штамп',
  coupon: 'Купон',
};

const HINTS: Record<SwipeStyle, string> = {
  stamp: 'Тянете карточку вбок: на ней проступает штамп «Готово» или «Убрать»',
  coupon: 'Тянете карточку вбок: купон заполняется и отрывается на пороге',
};

/** A trial control: the two ways the sideways swipe can look. */
export const SwipeStyleSetting: React.FC<{ style?: React.CSSProperties }> = ({
  style,
}) => {
  const current = useSwipeStyle();

  return (
    <div className="lit-in lit-row" style={style}>
      <p className="lit-text text-[19px] font-semibold leading-[1.2]">
        Свайп карточки
        <span className="lit-soon">пробный</span>
      </p>

      <div className="lit-seg mt-2" role="radiogroup" aria-label="Свайп карточки">
        {SWIPE_STYLES.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={current === option}
            onClick={() => setSwipeStyle(option)}
            onTouchStart={() => undefined}
            className={`lit-seg__item${current === option ? ' lit-seg__item--on' : ''}`}
          >
            {LABELS[option]}
          </button>
        ))}
      </div>

      <p className="lit-hint mt-2 text-[13px] leading-[1.35]">
        {HINTS[current]}
      </p>
    </div>
  );
};
