import { buildCouponEdge, type CouponEdge } from '../../app/couponEdge';
import { INITIAL_TASK_CARD_V2_CONFIG } from './taskCardV2Config';

/**
 * The size the coupon is laid out at inside the card (and drawn at while it
 * flies: it is scaled with the scene, never re-laid-out).
 */
export const COUPON_BOX_WIDTH =
  INITIAL_TASK_CARD_V2_CONFIG.width -
  INITIAL_TASK_CARD_V2_CONFIG.contentPadding * 2;
export const COUPON_BOX_HEIGHT = INITIAL_TASK_CARD_V2_CONFIG.couponHeight;

// The holes of the big coupon, in the card's own units.
const COUPON_HOLE_DIAMETER = 3.9;
const COUPON_HOLE_PITCH = 7.8;
const COUPON_CORNER_RADIUS = 6;

export const getCouponEdge = (
  seed: string,
  width = COUPON_BOX_WIDTH,
  height = COUPON_BOX_HEIGHT,
): CouponEdge =>
  buildCouponEdge({
    width,
    height,
    radius: COUPON_CORNER_RADIUS,
    hole: COUPON_HOLE_DIAMETER,
    pitch: COUPON_HOLE_PITCH,
    seed,
  });
