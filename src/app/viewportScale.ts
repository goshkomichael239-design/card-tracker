import { useEffect, useState } from 'react';

interface ViewportSize {
  width: number;
  height: number;
}

const getViewportSize = (): ViewportSize =>
  typeof window === 'undefined'
    ? { width: 1280, height: 800 }
    : { width: window.innerWidth, height: window.innerHeight };

export const useViewportSize = (): ViewportSize => {
  const [size, setSize] = useState(getViewportSize);

  useEffect(() => {
    let frameId: number | null = null;
    const handleResize = () => {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        setSize(getViewportSize());
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  return size;
};

export const MIN_CARD_SCALE = 0.55;

/**
 * Uniform scale that fits the fixed-size card scene into the free area. The
 * scene is designed at 1:1 and never grows past it, so the baseline look of the
 * card is unchanged on normal screens.
 */
export const getCardScale = (
  availableWidth: number,
  availableHeight: number,
  cardWidth: number,
  cardHeight: number,
): number => {
  const scale = Math.min(
    1,
    availableWidth / cardWidth,
    availableHeight / cardHeight,
  );

  return Math.max(MIN_CARD_SCALE, Number.isFinite(scale) ? scale : 1);
};
