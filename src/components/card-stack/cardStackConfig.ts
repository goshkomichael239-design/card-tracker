export interface CardStackConfig {
  layerOffsetX: number;
  layerOffsetY: number;
  rotationStep: number;
  visibleEdge: number;
  visibleLayers: number;
  nextPreviewX: number;
  nextPreviewY: number;
  nextPreviewRotation: number;
  nextPreviewReveal: number;
  shadowX: number;
  shadowY: number;
  shadowBlur: number;
  shadowOpacity: number;
  scaleStep: number;
}

export const INITIAL_CARD_STACK_CONFIG: CardStackConfig = {
  layerOffsetX: 1.1,
  layerOffsetY: 1.4,
  rotationStep: -0.2,
  visibleEdge: 5.9,
  visibleLayers: 6,
  nextPreviewX: 40,
  nextPreviewY: 11.9,
  nextPreviewRotation: 4.04,
  nextPreviewReveal: 6.1,
  shadowX: 6,
  shadowY: 10.5,
  shadowBlur: 16,
  shadowOpacity: 0.24,
  scaleStep: 0,
};
