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
/** The card scene may grow 15% past its design size when there is room. */
export const MAX_CARD_SCALE = 1.15;

/**
 * Uniform scale that fits the fixed-size card scene into the free area: shrinks
 * on small screens and grows up to MAX_CARD_SCALE on roomy ones. Everything on
 * the card scales with it, since the scene is scaled as one piece.
 */
export const getCardScale = (
  availableWidth: number,
  availableHeight: number,
  cardWidth: number,
  cardHeight: number,
): number => {
  const scale = Math.min(
    MAX_CARD_SCALE,
    availableWidth / cardWidth,
    availableHeight / cardHeight,
  );

  return Math.max(MIN_CARD_SCALE, Number.isFinite(scale) ? scale : 1);
};
