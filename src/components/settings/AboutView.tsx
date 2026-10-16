import React, { useState } from 'react';

import {
  APP_NAME,
  APP_VERSION,
  REPO_URL,
  DONATION_ADDRESSES,
} from '../../app/about';
import { t } from '../../app/i18n';

const lit = (delayMs: number): React.CSSProperties =>
  ({ ['--lit-delay' as string]: `${delayMs}ms` }) as React.CSSProperties;

const BODY: React.CSSProperties = {
  color: 'rgba(255,240,196,0.88)',
  fontSize: 15.5,
  lineHeight: 1.5,
};

const Heading: React.FC<{ children: React.ReactNode; delay: number }> = ({
  children,
  delay,
}) => (
  <h3
    className="lit-in lit-text mb-2 mt-7 text-[13px] font-bold uppercase tracking-[0.2em]"
    style={lit(delay)}
  >
    {children}
  </h3>
);

const Paragraph: React.FC<{ children: React.ReactNode; delay: number }> = ({
  children,
  delay,
}) => (
  <p className="lit-in mb-3" style={{ ...BODY, ...lit(delay) }}>
    {children}
  </p>
);

interface AboutViewProps {
  onBack: () => void;
}

/**
 * About the app: who made it and why, what sets it apart, what it is built
 * with and how to support it. Lit onto the cloth, like the settings.
 */
export const AboutView: React.FC<AboutViewProps> = ({ onBack }) => {
  const [copiedCoin, setCopiedCoin] = useState<string | null>(null);

  const copyAddress = (coin: string, address: string) => {
    void navigator.clipboard
      ?.writeText(address)
      .then(() => {
        setCopiedCoin(coin);
        window.setTimeout(() => setCopiedCoin(null), 1800);
      })
      .catch(() => undefined);
  };

  const features = [
    t('Всё как на настоящем столе: карточки, колоды, картотека, купон, штамп, штырь и корзина.'),
    t('Сделанное не исчезает: архив-«журнал» со сводкой и серией дней подряд.'),
    t('Быстрая запись одной строкой: «завтра в 9 позвонить маме».'),
    t('Без аккаунта и сервера: данные только на вашем устройстве, работает без сети.'),
    t('Русский и английский, звуки, вибрация и уведомления на телефоне.'),
  ];

  return (
    <div className="my-auto w-full max-w-[440px] py-12">
      <button
        type="button"
        onClick={onBack}
        onTouchStart={() => undefined}
        className="lit-in lit-text mb-5 block cursor-pointer border-0 bg-transparent p-0 text-[13px] font-bold uppercase tracking-[0.2em]"
        style={lit(40)}
      >
        ← {t('Настройки')}
      </button>

      <h2
        className="lit-in lit-text mb-1 text-[26px] font-semibold leading-tight"
        style={lit(70)}
      >
        {APP_NAME}
      </h2>
      <p className="lit-in lit-hint mb-6 text-[13px]" style={lit(90)}>
        {t('Версия {version}', { version: APP_VERSION })}
      </p>

      <Paragraph delay={110}>
        {t(
          'Меня зовут Михаил, я разработчик из России. Я вынашивал это приложение год, а довести его до конца мне помог Claude Sonnet 5.5.',
        )}
      </Paragraph>
      <Paragraph delay={140}>
        {t(
          'Идея появилась потому, что в других трекерах, когда я отмечаю дело сделанным, я не вижу результата: дела просто испаряются. Здесь всё сделанное остаётся в красивом «Журнале карточек» (архиве), и видно всё, что ты успел.',
        )}
      </Paragraph>
      <Paragraph delay={170}>
        {t(
          'И ещё чувство удовлетворения: дело сделано, купон оторвался по перфорации и лёг на штырь. В самых популярных трекерах (Todoist, TickTick, Microsoft To Do, Google Tasks, Any.do) это галочка и зачёркнутая строка; здесь это маленькое событие.',
        )}
      </Paragraph>

      <Heading delay={200}>{t('Чем отличается')}</Heading>
      <ul className="mb-3 list-disc pl-5">
        {features.map((feature, index) => (
          <li
            key={feature}
            className="lit-in mb-1.5"
            style={{ ...BODY, ...lit(230 + index * 30) }}
          >
            {feature}
          </li>
        ))}
      </ul>

      <Heading delay={400}>{t('Две версии')}</Heading>
      <Paragraph delay={420}>
        {t(
          'Приложение для Android и веб-версия. Сейчас всё хранится только на вашем устройстве; позже можно будет войти через аккаунт Google.',
        )}
      </Paragraph>

      <Heading delay={450}>{t('Поддержать')}</Heading>
      <Paragraph delay={470}>
        {t(
          'Приложение бесплатное для всех. В будущем я не отказываюсь от монетизации: новых функций или других режимов, например трекера привычек.',
        )}
      </Paragraph>
      {DONATION_ADDRESSES.length > 0 && (
        <div className="lit-in mb-3" style={lit(490)}>
          <p style={BODY}>
            {t('Если хотите поддержать автора, донат в сети TON (отправляйте только ту монету, что указана):')}
          </p>
          {DONATION_ADDRESSES.map(({ coin, address }) => (
            <div key={coin} className="mt-2">
              <p className="lit-hint text-[12px] font-bold">{coin}</p>
              <button
                type="button"
                onClick={() => copyAddress(coin, address)}
                onTouchStart={() => undefined}
                className="lit-text block w-full cursor-pointer break-all border-0 bg-transparent p-0 text-left text-[13px]"
                aria-label={t('Скопировать адрес')}
              >
                {address}
              </button>
              <p className="lit-hint text-[12px]">
                {copiedCoin === coin ? t('Скопировано') : t('Нажмите, чтобы скопировать')}
              </p>
            </div>
          ))}
        </div>
      )}

      <Heading delay={520}>{t('Из чего сделано')}</Heading>
      <Paragraph delay={540}>
        {t(
          'React, TypeScript, Vite, Tailwind, Framer Motion, Zustand, Capacitor. Шрифты Lora и Playfair Display, звуки CC0, картинки нарисованы с помощью нейросетей.',
        )}
      </Paragraph>
      <p className="lit-in lit-hint mb-8 break-all text-[13px]" style={lit(560)}>
        {t('Исходный код:')} {REPO_URL}
      </p>

      <button
        type="button"
        onClick={onBack}
        onTouchStart={() => undefined}
        className="lit-in lit-text lit-done mx-auto block text-[13px] font-bold uppercase tracking-[0.24em]"
        style={lit(580)}
      >
        {t('Готово')}
      </button>
    </div>
  );
};
