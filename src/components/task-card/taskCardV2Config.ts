export interface TaskCardV2Config {
  width: number;
  height: number;
  borderRadius: number;
  paperTint: string;
  paperTextureOpacity: number;
  shadowX: number;
  shadowY: number;
  shadowBlur: number;
  shadowOpacity: number;
  stackOffsetX: number;
  stackOffsetY: number;
  stackRotation: number;
  contentPadding: number;
  titleSize: number;
  titleGap: number;
  infoGap: number;
  couponHeight: number;
  couponBottom: number;
}

export const INITIAL_TASK_CARD_V2_CONFIG: TaskCardV2Config = {
  width: 396,
  height: 466,
  borderRadius: 25,
  paperTint: '#F7F2E8',
  paperTextureOpacity: 0.14,
  shadowX: 20,
  shadowY: 24,
  shadowBlur: 34,
  shadowOpacity: 0.33,
  stackOffsetX: 11,
  stackOffsetY: 9,
  stackRotation: 1.8,
  contentPadding: 32,
  titleSize: 36,
  titleGap: 34,
  infoGap: 26,
  couponHeight: 46,
  couponBottom: 32,
};
