import type { CSSProperties } from 'react';

/**
 * The backs ("рубашки") a deck can have. A back is seen on the lower layers
 * of the stack and on the deck's tab. Each is a drawn paper (colour, pattern,
 * frame); a back made as a picture is added by giving it `image`.
 */
export interface DeckBack {
  id: string;
  name: string;
  /** The tab's colour and the ink of its letter. */
  tab: string;
  tabInk: string;
  /** How the back lies on the stack's lower layers; none: the card papers. */
  paper?: CSSProperties;
  /** A picture of the back (PNG), used in place of the drawn paper. */
  image?: string;
}

const FRAME = (colour: string, gold = 'rgba(232,201,120,0.85)') =>
  `inset 0 0 0 7px ${colour}, inset 0 0 0 8.5px ${gold}, inset 0 0 0 12px ${colour}`;

const diagonal = (tint: string) =>
  `repeating-linear-gradient(45deg, ${tint} 0 5px, transparent 5px 11px), repeating-linear-gradient(-45deg, ${tint} 0 5px, transparent 5px 11px)`;

export const DECK_BACKS: DeckBack[] = [
  {
    id: 'plain',
    name: 'Бумага',
    tab: '#E9E1CE',
    tabInk: '#4D4130',
  },
  {
    id: 'emerald',
    name: 'Изумруд',
    tab: '#2A7A4F',
    tabInk: '#FFF6D6',
    paper: {
      backgroundColor: '#1F6B45',
      backgroundImage: diagonal('rgba(255,255,255,0.07)'),
      boxShadow: FRAME('#1F6B45'),
    },
  },
  {
    id: 'burgundy',
    name: 'Бордо',
    tab: '#8E2F3F',
    tabInk: '#F8E7D0',
    paper: {
      backgroundColor: '#7A2434',
      backgroundImage: diagonal('rgba(255,225,200,0.08)'),
      boxShadow: FRAME('#7A2434'),
    },
  },
  {
    id: 'navy',
    name: 'Ночь',
    tab: '#2D4A7C',
    tabInk: '#EAF0FA',
    paper: {
      backgroundColor: '#1F3560',
      backgroundImage: diagonal('rgba(210,225,255,0.08)'),
      boxShadow: FRAME('#1F3560'),
    },
  },
  {
    id: 'kraft',
    name: 'Крафт',
    tab: '#B98F5B',
    tabInk: '#3A2A14',
    paper: {
      backgroundColor: '#A87C49',
      backgroundImage: diagonal('rgba(70,40,10,0.10)'),
      boxShadow: FRAME('#A87C49', 'rgba(70,40,10,0.45)'),
    },
  },
  {
    id: 'graphite',
    name: 'Графит',
    tab: '#4B4F55',
    tabInk: '#F1F1EE',
    paper: {
      backgroundColor: '#35383D',
      backgroundImage: diagonal('rgba(255,255,255,0.06)'),
      boxShadow: FRAME('#35383D'),
    },
  },
];

export const getDeckBack = (id: string | undefined): DeckBack =>
  DECK_BACKS.find((back) => back.id === id) ?? DECK_BACKS[0]!;
