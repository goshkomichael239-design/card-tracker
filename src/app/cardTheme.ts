export type CreationState = 'idle' | 'editing' | 'committing';
export type CardKind = 'single' | 'series' | 'list';
export type TimeMode = 'none' | 'deadline' | 'reminder';
export type DraftStep = 'title' | 'kind' | 'series-target' | 'list-items' | 'time' | 'repeat' | 'date' | 'clock' | 'confirm';

export interface GhostSettings {
  x: number;
  y: number;
  rotate: number;
  scale: number;
  opacity: number;
}

export interface CardPalette {
  paper: string;
  accent: string;
  accentDark: string;
  ink: string;
  /**
   * Second accent: a brighter, still pastel sibling of `accent`. It "lights up"
   * under hovered actions and fills progress, while `accent` carries lettering.
   */
  glow: string;
}

export interface CardColorScheme extends CardPalette {
  id: string;
}

export interface VisualCard {
  id: string;
  title: string;
  /** Chosen colour scheme; derived from the id for cards that have none. */
  colorId?: string;
  kind: 'single' | 'series' | 'list';
  timeMode: TimeMode;
  deadlineAt?: string;
  reminderAt?: string;
  createdAt: string;
  completedAt?: string;
  series?: SeriesData;
  list?: TaskListData;
  /** Every time the card was put off, oldest first (each leaves a stamp). */
  postponements?: Postponement[];
  /**
   * For a card without its own time: the day it was put off to. Cards with a
   * deadline or reminder move that time instead.
   */
  postponedUntil?: string;
  /** Repeats on a schedule; the next occurrence is kept in `reminderAt`. */
  recurrence?: RecurrenceRule;
}

export interface Postponement {
  /** When it was put off. */
  at: string;
  /** What it was put off to. */
  until: string;
}

/**
 * - daily: every day
 * - weekdays: Monday to Friday
 * - weekly: on the given days of the week (0 = Monday … 6 = Sunday)
 * - interval: every N days
 */
export type RecurrenceKind = 'daily' | 'weekdays' | 'weekly' | 'interval';

export interface RecurrenceRule {
  kind: RecurrenceKind;
  weekdays?: number[];
  intervalDays?: number;
}

export interface SeriesEntry {
  completedAt: string;
  durationMs: number;
}

export interface SeriesData {
  targetCount: number;
  entries: SeriesEntry[];
  startedAt: string;
  timingAnchorAt: string;
  finishedAt?: string;
  finishReason?: 'completed' | 'manual';
}

export interface TaskListItem {
  id: string;
  text: string;
  completedAt?: string;
}

export interface TaskListData {
  items: TaskListItem[];
}

export interface DetachedCoupon {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  palette: CardPalette;
  label?: string;
  /**
   * 0..1 share shown as the fill the coupon had on the card; undefined for a
   * coupon that had none. Must match what the on-card coupon displayed.
   */
  progress?: number;
}

export const CARD_RADIUS = 32;

export const GHOST_SETTINGS: GhostSettings = {
  x: -31,
  y: -41,
  rotate: -7,
  scale: 1,
  opacity: 0.2,
};

// Colours of the time-mode choice in the creation flow (and the "alert" tone of
// an overdue countdown). They are not the colours of finished cards.
export const PALETTES: Record<TimeMode, CardPalette> = {
  none: {
    paper: '#E8D9C0',
    accent: '#CD5334',
    accentDark: '#8F3025',
    ink: '#1E1C1A',
    glow: '#FFC2A6',
  },
  deadline: {
    paper: '#CFD7E0',
    accent: '#4A6578',
    accentDark: '#2E4655',
    ink: '#1B242A',
    glow: '#A9CBEA',
  },
  reminder: {
    paper: '#CDD9C4',
    accent: '#5C7A5A',
    accentDark: '#3E583D',
    ink: '#1D251D',
    glow: '#B6E0B0',
  },
};

export const LIST_PALETTE: CardPalette = {
  paper: '#F7F2E8',
  accent: '#7B6D9C',
  accentDark: '#584B76',
  ink: '#28231D',
  glow: '#CBB8F2',
};

/**
 * Pastel colour schemes for finished cards: a pale paper, a muted accent for
 * lettering and a brighter pastel "glow" from the same family. Order matters
 * only for the hash fallback below.
 */
export const CARD_COLOR_SCHEMES: CardColorScheme[] = [
  { id: 'cream', paper: '#F7F2E8', accent: '#C9694B', accentDark: '#8A3F2A', ink: '#28231D', glow: '#FFBFA0' },
  { id: 'peach', paper: '#F9ECE2', accent: '#D98B6F', accentDark: '#8F4A38', ink: '#2B211C', glow: '#FFC9A8' },
  { id: 'mint', paper: '#E7F3EB', accent: '#6FAE8A', accentDark: '#3A6B52', ink: '#1F2A24', glow: '#9FE5C0' },
  { id: 'sky', paper: '#E5EFF8', accent: '#6E9CC4', accentDark: '#37607F', ink: '#1E2730', glow: '#9CCBF7' },
  { id: 'lavender', paper: '#EEE8F6', accent: '#9A86C4', accentDark: '#5C4B88', ink: '#25212E', glow: '#CBB7FF' },
  { id: 'rose', paper: '#F8E8EE', accent: '#D07F9B', accentDark: '#86405B', ink: '#2D2025', glow: '#FFB5D0' },
  { id: 'butter', paper: '#F8F2DA', accent: '#C9A94A', accentDark: '#765F1E', ink: '#2B2717', glow: '#FFE58C' },
  { id: 'pistachio', paper: '#EDF2DD', accent: '#8DAA5B', accentDark: '#52703A', ink: '#232A1C', glow: '#C8ED8C' },
  { id: 'aqua', paper: '#E2F2F1', accent: '#5FA7A3', accentDark: '#2D6966', ink: '#1B2928', glow: '#8FEAE2' },
];

const hashString = (value: string): number => {
  let hash = 5381;

  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
};

export const getCardPalette = (card: VisualCard): CardColorScheme =>
  CARD_COLOR_SCHEMES.find((scheme) => scheme.id === card.colorId) ??
  CARD_COLOR_SCHEMES[hashString(card.id) % CARD_COLOR_SCHEMES.length]!;

/** A scheme for a new card that differs from the one used by the last card. */
export const pickNewCardColorId = (previousColorId?: string): string => {
  const options = CARD_COLOR_SCHEMES.filter(
    (scheme) => scheme.id !== previousColorId,
  );

  return options[Math.floor(Math.random() * options.length)]!.id;
};

export const CARD_SHADOW = `
  18px 28px 50px -8px rgba(0,0,0,0.72),
  8px 14px 24px -4px rgba(0,0,0,0.42),
  inset 0 1.5px 1px rgba(255,255,255,0.7),
  inset 0 -2px 4px rgba(0,0,0,0.1)
`;

export const DRAFT_SHADOW = `
  0 5px 0 -1px rgba(105,82,59,0.92),
  0 8px 0 -2px rgba(62,47,34,0.78),
  0 11px 10px -4px rgba(0,0,0,0.68),
  25px 38px 70px -10px rgba(0,0,0,0.78),
  12px 20px 34px -6px rgba(0,0,0,0.55),
  inset 0 1.5px 1px rgba(255,255,255,0.7),
  inset 0 -2px 4px rgba(0,0,0,0.1)
`;

export const GHOST_SHADOW = `
  8px 14px 28px rgba(0,0,0,0.18),
  inset 2px 2px 5px rgba(255,255,255,0.18),
  inset -2px -2px 5px rgba(0,0,0,0.12)
`;

export const PHYSICAL_SPRING = {
  type: 'spring' as const,
  stiffness: 220,
  damping: 22,
  mass: 0.95,
};

export const COUPON_WIDTH = 236;
export const COUPON_HEIGHT = 38;
export const COUPON_RADIUS = 6;
export const COUPON_DASH_LENGTH = 4.2;
export const COUPON_DASH_GAP = 3;
export const COUPON_CORE_THICKNESS = 1.15;
export const COUPON_SHOULDER_THICKNESS = 2.8;
export const COUPON_SHOULDER_OPACITY = 0.52;
export const COUPON_STROKE_INSET =
  COUPON_SHOULDER_THICKNESS / 2 + 0.35;
