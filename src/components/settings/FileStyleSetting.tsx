import React from 'react';

import {
  FILE_STYLES,
  setFileStyle,
  useFileStyle,
  type FileStyle,
} from '../../app/fileStyle';

const LABELS: Record<FileStyle, string> = {
  current: 'Как было',
  box: 'Ящик',
  leather: 'Кожа',
  folder: 'Папка',
  flat: 'Плоско',
};

const HINTS: Record<FileStyle, string> = {
  current: 'Яркие язычки, цветная полоска, строки сами по себе',
  box: 'Строки лежат в ящике цвета рубашки колоды, язычки растут из него',
  leather: 'Тот же ящик, но из тёмной кожи у всех колод; язычки в своих цветах',
  folder: 'Язычок выбранной колоды из бумаги первой карточки, как её ушко',
  flat: 'Без цветных язычков: названия и линия под выбранной',
};

/** How the card file at the top is put together (to compare by eye). */
export const FileStyleSetting: React.FC<{ style?: React.CSSProperties }> = ({
  style,
}) => {
  const current = useFileStyle();

  return (
    <div className="lit-in lit-row" style={style}>
      <p className="lit-text text-[19px] font-semibold leading-[1.2]">
        Вид картотеки
      </p>

      <div
        className="lit-seg mt-2 flex-wrap"
        role="radiogroup"
        aria-label="Вид картотеки"
      >
        {FILE_STYLES.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={current === option}
            onClick={() => setFileStyle(option)}
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
