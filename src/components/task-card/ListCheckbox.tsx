import React, { useEffect, useRef, useState } from 'react';

interface ListCheckboxProps {
  checked: boolean;
  size: number;
  accent: string;
  accentDark: string;
}

const TEAR_MS = 520;

/**
 * A list item's box, as a small coupon on the card: a square paper tab with a
 * dashed edge. Ticked, the tab is torn away (it flies off, as the big coupon
 * does) and leaves the dented base with its shadows and a check pressed in.
 */
export const ListCheckbox: React.FC<ListCheckboxProps> = ({
  checked,
  size,
  accent,
  accentDark,
}) => {
  const wasCheckedRef = useRef(checked);
  const [isTearing, setIsTearing] = useState(false);

  useEffect(() => {
    const wasChecked = wasCheckedRef.current;

    wasCheckedRef.current = checked;

    if (!checked || wasChecked) {
      return;
    }

    // Only the moment of ticking shows the tab leaving, not every redraw.
    const start = window.setTimeout(() => setIsTearing(true), 0);
    const stop = window.setTimeout(() => setIsTearing(false), TEAR_MS);

    return () => {
      window.clearTimeout(start);
      window.clearTimeout(stop);
    };
  }, [checked]);

  const style = {
    width: size,
    height: size,
    ['--check-accent' as string]: accent,
    ['--check-ink' as string]: accentDark,
  } as React.CSSProperties;

  return (
    <span
      aria-hidden="true"
      className={`list-check${checked ? ' list-check--done' : ''}`}
      style={style}
    >
      {checked && (
        <svg
          viewBox="0 0 24 24"
          width={size * 0.62}
          height={size * 0.62}
          className="list-check__mark"
        >
          <path
            d="M5 12.8l4.4 4.4L19 7.4"
            fill="none"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {!checked && <span className="list-check__tab" />}
      {isTearing && <span className="list-check__tab list-check__tab--flying" />}
    </span>
  );
};
