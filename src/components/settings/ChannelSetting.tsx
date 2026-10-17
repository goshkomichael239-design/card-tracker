import React from 'react';

import { CHANNEL, switchChannel } from '../../app/channel';
import { playSound } from '../../app/sounds';
import { t } from '../../app/i18n';

/**
 * A switch between the main web version and the experimental one (the newer
 * look and features, still being tried). It is on in the experimental version.
 */
export const ChannelSetting: React.FC<{ style?: React.CSSProperties }> = ({
  style,
}) => {
  const isNext = CHANNEL === 'next';

  return (
    <div className="lit-in lit-row flex items-center gap-4" style={style}>
      <div className="min-w-0 flex-1">
        <p
          className={`lit-text${isNext ? '' : ' lit-text--dim'} text-[19px] font-semibold leading-[1.2]`}
        >
          {t('Экспериментальная версия')}
        </p>
        <p className="lit-hint mt-1 text-[13px] leading-[1.35]">
          {isNext
            ? t('Вы в экспериментальной версии. Выключите, чтобы вернуться в основную. Карточки те же.')
            : t('Новый вид и новые возможности, которые ещё проверяются. Страница откроется заново, карточки те же.')}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={isNext}
        aria-label={t('Экспериментальная версия')}
        onClick={() => {
          playSound('toggle');
          void switchChannel();
        }}
        onTouchStart={() => undefined}
        className="lit-switch shrink-0"
      >
        <span className="lit-switch__knob" />
      </button>
    </div>
  );
};
