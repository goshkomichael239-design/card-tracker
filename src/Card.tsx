// src/Card.tsx
import React from 'react';

// Типы карточек
export type CardType = 'single' | 'batch' | 'checklist' | 'timer';

interface CardProps {
  title: string;
  type: CardType;
  progress?: number; // 0..1 для batch и checklist
  metadata?: string; // время, количество и т.д.
}

// Конфигурация для каждого типа
const typeConfig = {
  single: {
    color: '#E3E0D8',    // Овсяный
    icon: '📄',
    label: 'ЗАДАЧА',
  },
  batch: {
    color: '#D4E8D0',    // Шалфейный
    icon: '🔁',
    label: 'СЕРИЯ',
  },
  checklist: {
    color: '#F0D5C8',    // Терракотовый
    icon: '📋',
    label: 'СПИСОК',
  },
  timer: {
    color: '#F0E0B0',    // Мягкий жёлтый
    icon: '⏱️',
    label: 'ТАЙМЕР',
  },
};

export const Card: React.FC<CardProps> = ({
  title,
  type,
  progress = 0,
  metadata = '',
}) => {
  const config = typeConfig[type];

  return (
    <div
      className="card"
      style={{
        width: '320px',
        minHeight: '420px',
        background: config.color,
        borderRadius: '24px',
        // Основная тень (создаёт эффект парения)
        boxShadow: `
          0 30px 50px -20px rgba(0,0,0,0.7),
          0 0 0 1px rgba(255,255,255,0.08) inset,
          0 0 0 1px rgba(0,0,0,0.04)
        `,
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        // Наклон для изометрического эффекта
        transform: 'rotateX(6deg) rotateY(-2deg) translateY(-4px)',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        cursor: 'default',
        // Текстура бумаги (микро-шум)
        backgroundImage: `
          url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E"),
          linear-gradient(145deg, ${config.color}, ${config.color})
        `,
        backgroundBlendMode: 'normal, normal',
        backgroundSize: 'cover, auto',
      }}
    >
      {/* Верхняя часть: иконка + бейдж */}
      <div>
        <div style={{ fontSize: '34px', marginBottom: '12px' }}>{config.icon}</div>
        <span
          style={{
            background: 'rgba(0,0,0,0.05)',
            padding: '4px 16px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.5px',
            color: '#3A3A3A',
            display: 'inline-block',
          }}
        >
          {config.label}
        </span>
      </div>

      {/* Заголовок */}
      <h2
        style={{
          fontSize: '26px',
          fontWeight: 600,
          color: '#1A1A1A',
          margin: '16px 0 0 0',
          lineHeight: 1.2,
          letterSpacing: '-0.3px',
          flex: '1',
        }}
      >
        {title}
      </h2>

      {/* Нижняя часть: прогресс, таймер или метаданные */}
      <div style={{ marginTop: '24px' }}>
        {/* Прогресс-бар для Batch и Checklist */}
        {(type === 'batch' || type === 'checklist') && (
          <div>
            <div
              style={{
                height: '6px',
                background: 'rgba(0,0,0,0.08)',
                borderRadius: '10px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(progress * 100, 100)}%`,
                  height: '100%',
                  background: '#A89888',
                  borderRadius: '10px',
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '10px',
                fontSize: '14px',
                color: '#4A4A4A',
              }}
            >
              <span>{metadata || `${Math.round(progress * 100)}%`}</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
          </div>
        )}

        {/* Таймер для Timer */}
        {type === 'timer' && (
          <div
            style={{
              fontSize: '40px',
              fontWeight: 300,
              letterSpacing: '2px',
              color: '#1A1A1A',
              textAlign: 'center',
              padding: '8px 0',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {metadata || '25:00'}
          </div>
        )}

        {/* Метаданные для Single */}
        {type === 'single' && metadata && (
          <div
            style={{
              fontSize: '16px',
              color: '#4A4A4A',
              borderTop: '1px solid rgba(0,0,0,0.06)',
              paddingTop: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '18px' }}>⏱️</span> {metadata}
          </div>
        )}
      </div>
    </div>
  );
};