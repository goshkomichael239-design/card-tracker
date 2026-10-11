import React from 'react';

interface SettingsGearProps {
  isOpen: boolean;
  onToggle: () => void;
}

// A gear outline (the Material "settings" glyph, 24 x 24).
const GEAR_PATH =
  'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z';

/**
 * A gear pressed into the cloth in the top right corner: a recess with the
 * gear cut into its floor, dark with a thin light edge below it. While the
 * settings are open it glows, and pressing it again puts the table back.
 */
export const SettingsGear: React.FC<SettingsGearProps> = ({
  isOpen,
  onToggle,
}) => (
  <button
    type="button"
    data-settings-keep=""
    onClick={onToggle}
    onTouchStart={() => undefined}
    aria-label={isOpen ? 'Закрыть настройки' : 'Открыть настройки'}
    aria-expanded={isOpen}
    className={`settings-gear${isOpen ? ' settings-gear--lit' : ''}`}
  >
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
      style={{
        transform: isOpen ? 'rotate(60deg)' : 'rotate(0deg)',
        transition: 'transform 420ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      }}
    >
      <path
        className="settings-gear__edge"
        transform="translate(0 0.9)"
        d={GEAR_PATH}
      />
      <path className="settings-gear__cut" d={GEAR_PATH} />
    </svg>
  </button>
);
