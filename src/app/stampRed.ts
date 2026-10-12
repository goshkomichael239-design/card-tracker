/**
 * The one red of the app: the red of a rubber stamp. Everything that is
 * overdue, deleted or a warning is this red, in its light and dark variants.
 */
export const STAMP_RED = '#B8483A';
export const STAMP_RED_LIGHT = '#E0705F';
export const STAMP_RED_DARK = '#8F3025';
/** The red of lettering on paper (darker than the stamp, for reading). */
export const STAMP_RED_INK = '#7A2519';
/** A glint of the stamp red on a dark ground (rings, edges). */
export const STAMP_RED_GLOW = '#F0907F';

/** The wax-like body of a red dot. */
export const STAMP_RED_DOT_BACKGROUND = `radial-gradient(circle at 32% 28%, ${STAMP_RED_LIGHT} 0%, ${STAMP_RED} 55%, ${STAMP_RED_DARK} 100%)`;
