export interface CardSwitcherConfig {
  width: number;
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
  width: 331,
  height: 127,
  borderRadius: 16,
  backgroundSize: 502,
  backgroundX: -4,
  backgroundY: 0,
  paddingLeft: 28,
  paddingRight: 53,
  paddingTop: 23,
  paddingBottom: 49,
  rowHeight: 24,
  rowGap: 1,
  fontSize: 12,
  textX: 0,
  dotsX: 370,
  dotSize: 8,
  dotGap: 14,
  activeWidth: 264,
  activeHeight: 27,
  activeRadius: 7,
  activeOpacity: 0.33,
  textureOpacity: 1,
};
