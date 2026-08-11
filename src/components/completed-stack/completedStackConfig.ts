export interface CompletedStackConfig {
  baseX: number;
  baseY: number;
  rotationStep: number;
  offsetX: number;
  offsetY: number;
  previousTailX: number;
  tailX: number;
  tailY: number;
  previousTailRotation: number;
  tailRotation: number;
  scale: number;
  scaleStep: number;
  completedCount: number;
  shadowX: number;
  shadowY: number;
  shadowBlur: number;
  shadowOpacity: number;
}

export const COMPLETED_STACK_MAX_LAYERS = 10;

export const INITIAL_COMPLETED_STACK_CONFIG: CompletedStackConfig = {
  baseX: 54.5,
  baseY: 8,
  rotationStep: 0.5,
  offsetX: 0.5,
  offsetY: -3.6,
  previousTailX: 12.5,
  tailX: 23,
  tailY: 36,
  previousTailRotation: 5.8,
  tailRotation: 8.9,
  scale: 0.995,
  scaleStep: 0,
  completedCount: 10,
  shadowX: 2,
  shadowY: 6,
  shadowBlur: 13.5,
  shadowOpacity: 0.6,
};