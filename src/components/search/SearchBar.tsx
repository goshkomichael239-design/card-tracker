import React, { useCallback, useEffect, useRef, useState } from 'react';
import { t } from '../../app/i18n';

interface SearchBarProps {
  isOpen: boolean;
  /** Hidden altogether (for instance while the archive is open). */
  isHidden: boolean;
  query: string;
  /** How many cards the query found, and which of them is shown. */
  matchCount: number;
  matchPosition: number;
  onToggle: () => void;
  onChange: (value: string) => void;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

// A magnifying glass (the Material "search" glyph, 24 x 24).
const LUPA_PATH =
  'M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z';

/**
 * The search: a magnifying glass beside the gear, cut into the cloth the same
 * way. Pressed, a field grows out of it to the left (a recess in the cloth
 * with a gold caret) and the keyboard comes up at once. The field has the
 * count of what was found and a cross; the glass, the cross and Escape all
 * close it.
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  isOpen,
  isHidden,
  query,
  matchCount,
  matchPosition,
  onToggle,
  onChange,
  onClose,
  onNext,
  onPrevious,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mirrorRef = useRef<HTMLSpanElement | null>(null);
  const steadyTimerRef = useRef<number | null>(null);
  const hasQuery = query.trim() !== '';
  // The caret is drawn by hand (gold, gliding, breathing). It is only used
  // while its place is certain: no selection, text that fits the field.
  // Otherwise the input's own caret stays.
  const [caret, setCaret] = useState<{ x: number; visible: boolean }>({
    x: 0,
    visible: false,
  });
  const [isSteady, setIsSteady] = useState(false);

  const updateCaret = useCallback(() => {
    const input = inputRef.current;
    const mirror = mirrorRef.current;

    if (!input || !mirror) {
      return;
    }

    const isUsable =
      document.activeElement === input &&
      input.selectionStart !== null &&
      input.selectionStart === input.selectionEnd &&
      input.scrollWidth <= input.clientWidth + 1;

    if (!isUsable) {
      setCaret((previous) =>
        previous.visible ? { ...previous, visible: false } : previous,
      );
      return;
    }

    mirror.textContent = input.value.slice(0, input.selectionStart ?? 0);
    setCaret({ x: input.offsetLeft + mirror.offsetWidth, visible: true });
  }, []);

  // It stands still while typing and starts breathing again a moment later.
  const holdCaretSteady = () => {
    setIsSteady(true);

    if (steadyTimerRef.current !== null) {
      window.clearTimeout(steadyTimerRef.current);
    }

    steadyTimerRef.current = window.setTimeout(() => {
      steadyTimerRef.current = null;
      setIsSteady(false);
    }, 520);
  };

  useEffect(
    () => () => {
      if (steadyTimerRef.current !== null) {
        window.clearTimeout(steadyTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    // Moving the caret with the arrows or a tap changes only the selection.
    document.addEventListener('selectionchange', updateCaret);
    return () => document.removeEventListener('selectionchange', updateCaret);
  }, [updateCaret]);

  const handleToggle = () => {
    if (!isOpen) {
      // Focus inside the press itself, so a phone raises the keyboard.
      inputRef.current?.focus({ preventScroll: true });
    }

    onToggle();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    } else if (event.key === 'Enter') {
      event.preventDefault();

      if (event.shiftKey) {
        onPrevious();
      } else {
        onNext();
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      onNext();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      onPrevious();
    }
  };

  return (
    <div
      className="search-root"
      style={{
        opacity: isHidden ? 0 : 1,
        pointerEvents: isHidden ? 'none' : 'auto',
        transition: 'opacity 240ms ease-out',
      }}
    >
      <div
        className={`search-field${isOpen ? ' search-field--open' : ''}`}
        aria-hidden={!isOpen}
      >
        <input
          ref={inputRef}
          type="text"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={query}
          tabIndex={isOpen ? 0 : -1}
          onChange={(event) => {
            onChange(event.target.value);
            holdCaretSteady();
            updateCaret();
          }}
          onKeyDown={handleKeyDown}
          onKeyUp={updateCaret}
          onSelect={updateCaret}
          onFocus={updateCaret}
          onBlur={updateCaret}
          placeholder={t('Найти карточку…')}
          aria-label={t('Поиск по карточкам')}
          className={`search-input${caret.visible ? ' search-input--own-caret' : ''}`}
        />

        {/* Measures the text before the caret; never seen. */}
        <span ref={mirrorRef} aria-hidden="true" className="search-input search-mirror" />

        {caret.visible && (
          <span
            aria-hidden="true"
            className={`search-caret${isSteady ? ' search-caret--steady' : ''}`}
            style={{ transform: `translate3d(${caret.x}px, 0, 0)` }}
          />
        )}

        {hasQuery && matchCount > 0 && (
          <span className="search-count" aria-live="polite">
            {matchPosition} / {matchCount}
          </span>
        )}

        <button
          type="button"
          onClick={onClose}
          onTouchStart={() => undefined}
          tabIndex={isOpen ? 0 : -1}
          aria-label={t('Закрыть поиск')}
          className="search-cross"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </button>
      </div>

      <button
        type="button"
        onClick={handleToggle}
        onTouchStart={() => undefined}
        aria-label={isOpen ? t('Закрыть поиск') : t('Поиск по карточкам')}
        aria-expanded={isOpen}
        className={`settings-gear search-lupa${isOpen ? ' settings-gear--lit' : ''}`}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            className="settings-gear__edge"
            transform="translate(0 0.9)"
            d={LUPA_PATH}
          />
          <path className="settings-gear__cut" d={LUPA_PATH} />
        </svg>
      </button>
    </div>
  );
};
