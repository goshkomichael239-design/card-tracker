export interface CardSwitcherConfig {
  width: number;
  positionX: number;
  positionY: number;
  height: number;
  borderRadius: number;
  backgroundSize: number;
  backgroundX: number;
  backgroundY: number;
  paddingLeft: number;
  paddingRight: number;
  paddingTop: number;
  paddingBottom: number;
  rowHeight: number;
  rowGap: number;
  fontSize: number;
  textX: number;
  dotsX: number;
  dotSize: number;
  dotGap: number;
  activeWidth: number;
  activeHeight: number;
  activeRadius: number;
  activeOpacity: number;
  textureOpacity: number;
}

/** The card file's top: a row of deck tabs and the divider under it. */
export const CARD_FILE_TAB_ROW_HEIGHT = 36;
export const CARD_FILE_DIVIDER_HEIGHT = 7;
/** The widest the file gets (px); it never exceeds its container. */
export const CARD_FILE_MAX_WIDTH = 408;

export interface SwitcherMetrics {
  /** Height of one card's edge (the whole of it, with the part that lies
   *  under the card above). */
  rowHeight: number;
  /** How much of each edge lies under the card above it. */
  overlap: number;
  /** What each next edge adds: the row height less the overlap. */
  rowStep: number;
  /** How many edges show at once (fewer on a short screen). */
  visibleRows: number;
  fontSize: number;
}

/**
 * Edge size and how many edges show at once. On a phone an edge is at least
 * 36 px tall (a finger needs that) and the list scrolls under the finger; a
 * tall screen shows one more edge.
 */
export const getSwitcherMetrics = (
  isPhone: boolean,
  viewportHeight = 800,
): SwitcherMetrics => {
  if (isPhone) {
    return {
      rowHeight: 38,
      overlap: 10,
      rowStep: 28,
      visibleRows: viewportHeight >= 760 ? 5 : 4,
      fontSize: 15,
    };
  }

  return {
    rowHeight: 34,
    overlap: 8,
    rowStep: 26,
    visibleRows: viewportHeight >= 820 ? 6 : 5,
    fontSize: 13.5,
  };
};

/**
 * Height of the list of edges for `count` cards. A list that scrolls is
 * scrolled so that the part of the top edge that lies under the card above it
 * is out of sight: every edge shows one step, and the last one ends at the
 * bottom. A list that does not scroll shows all its edges whole.
 */
export const getEdgesHeight = (
  metrics: SwitcherMetrics,
  count: number,
): number => {
  if (count > metrics.visibleRows) {
    return metrics.visibleRows * metrics.rowStep;
  }

  return (Math.max(1, count) - 1) * metrics.rowStep + metrics.rowHeight;
};

/** The whole card file: tabs, divider and the edges. */
export const getCardFileHeight = (
  metrics: SwitcherMetrics,
  count: number,
): number =>
  CARD_FILE_TAB_ROW_HEIGHT +
  CARD_FILE_DIVIDER_HEIGHT +
  (count > 0 ? getEdgesHeight(metrics, count) : 0);

export const INITIAL_CARD_SWITCHER_CONFIG: CardSwitcherConfig = {
  width: CARD_FILE_MAX_WIDTH,
  positionX: -1,
  positionY: 0,
  height: 131,
  borderRadius: 15,
  backgroundSize: 502,
  backgroundX: -13,
  backgroundY: -142,
  paddingLeft: 31,
  paddingRight: 87,
  paddingTop: 8,
  paddingBottom: 56,
  rowHeight: 26,
  rowGap: -2,
  fontSize: 12,
  textX: -4,
  dotsX: 376,
  dotSize: 7,
  dotGap: 12,
  activeWidth: 264,
  activeHeight: 29,
  activeRadius: 9,
  activeOpacity: 0.28,
  textureOpacity: 1,
};
