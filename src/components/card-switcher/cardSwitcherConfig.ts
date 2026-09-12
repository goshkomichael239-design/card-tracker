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

export const INITIAL_CARD_SWITCHER_CONFIG: CardSwitcherConfig = {
  width: 480,
  positionX: -1,
  positionY: 43,
  height: 131,
  borderRadius: 18,
  backgroundSize: 502,
  backgroundX: -13,
  backgroundY: -142,
  paddingLeft: 31,
  paddingRight: 87,
  paddingTop: 8,
  paddingBottom: 56,
  rowHeight: 27,
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
