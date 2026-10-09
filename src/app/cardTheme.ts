export type CreationState = 'idle' | 'editing' | 'committing';
export type CardKind = 'single' | 'series' | 'list';
export type TimeMode = 'none' | 'deadline' | 'reminder';
export type DraftStep = 'title' | 'kind' | 'series-target' | 'list-items' | 'time' | 'date' | 'clock' | 'confirm';

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
}

export interface VisualCard {
  id: string;
  title: string;
  kind: 'single' | 'series' | 'list';
  timeMode: TimeMode;
  deadlineAt?: string;
  reminderAt?: string;
  createdAt: string;
  completedAt?: string;
  series?: SeriesData;
  list?: TaskListData;
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
}

export const CARD_RADIUS = 32;

export const GHOST_SETTINGS: GhostSettings = {
  x: -31,
  y: -41,
  rotate: -7,
  scale: 1,
  opacity: 0.2,
};

export const PALETTES: Record<TimeMode, CardPalette> = {
  none: {
    paper: '#E8D9C0',
    accent: '#CD5334',
    accentDark: '#8F3025',
    ink: '#1E1C1A',
  },
  deadline: {
    paper: '#CFD7E0',
    accent: '#4A6578',
    accentDark: '#2E4655',
    ink: '#1B242A',
  },
  reminder: {
    paper: '#CDD9C4',
    accent: '#5C7A5A',
    accentDark: '#3E583D',
    ink: '#1D251D',
  },
};

export const LIST_PALETTE: CardPalette = {
  paper: '#F7F2E8',
  accent: '#7B6D9C',
  accentDark: '#584B76',
  ink: '#28231D',
};

export const getCardPalette = (card: VisualCard): CardPalette =>
  card.kind === 'list' ? LIST_PALETTE : PALETTES[card.timeMode];

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
