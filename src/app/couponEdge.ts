import type { VisualCard } from './cardTheme';

/**
 * The geometry of a coupon's perforation, shared by everything that draws one
 * (the coupon on the card, the slot it leaves, the piece that flies away, the
 * slip on the spike, the list ticks, the swipe coupon).
 *
 * A row of round holes is laid exactly on the contour of a rounded rectangle,
 * at an equal pitch all round (corners included). Between two holes lies a
 * neck of paper. Tearing breaks every neck somewhere across its length, and
 * where it breaks is drawn from a seed, so:
 *  - the piece that comes away and the slot it leaves are cut by one and the
 *    same line (every tooth on one is a notch in the other);
 *  - the same card always tears the same way, on the card, in the air, on the
 *    spike and in the archive: nothing here uses Math.random.
 *
 * Coordinates: the box is [0, width] x [0, height]. The contour is the box
 * inset by `inset` (so the holes' outer halves stay inside the box).
 */
export interface CouponEdgeSpec {
  width: number;
  height: number;
  /** Corner radius of the contour. */
  radius: number;
  /** Diameter of a hole. */
  hole: number;
  /** Wanted pitch of the holes; the real one is fitted to the perimeter. */
  pitch: number;
  /** Deterministic source of the tear's look. */
  seed: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface CouponHole {
  x: number;
  y: number;
  /** Unit outward normal and unit tangent (clockwise) of the contour here. */
  nx: number;
  ny: number;
  tx: number;
  ty: number;
}

export interface CouponEdge {
  spec: CouponEdgeSpec;
  holeRadius: number;
  inset: number;
  holes: CouponHole[];
  /** Where each neck is torn: along the normal, + is outward (tooth on the piece). */
  tears: number[];
  /** Slight slant of each tear (difference between its two ends). */
  slants: number[];
  /** A fibre sticking out of the tear of this neck (0 = none), length in px. */
  burrs: number[];
  /** 0..1: when in the wave a neck lets go (nearest the start corner first). */
  order: number[];
  /** The contour of the whole coupon: holes' centres lie on it. */
  contour: { x: number; y: number; w: number; h: number; r: number };
  /** Which corner the tear started from: 0 tl, 1 tr, 2 br, 3 bl. */
  startCorner: number;
}

// ---- seeded numbers -------------------------------------------------------

const hashString = (text: string): number => {
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

const makeRandom = (seed: string) => {
  let state = hashString(seed) || 1;

  return () => {
    // mulberry32
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * What a card's coupon is torn from: made of fields that an archived copy of
 * the card keeps unchanged (its id may be new), and, for a repeating card, of
 * the sheet being torn (its date).
 */
export const getCouponSeed = (card: VisualCard): string =>
  [
    card.createdAt,
    card.title,
    card.kind,
    card.reminderAt ?? '',
    card.series ? card.series.targetCount : '',
  ].join('|');

// ---- the contour ----------------------------------------------------------

const buildContour = (spec: CouponEdgeSpec, inset: number) => {
  const w = Math.max(1, spec.width - inset * 2);
  const h = Math.max(1, spec.height - inset * 2);
  const r = Math.max(0, Math.min(spec.radius, w / 2, h / 2));

  return { x: inset, y: inset, w, h, r };
};

/** Point, outward normal and tangent at distance s along the contour (clockwise from the top edge's start). */
const pointAt = (
  contour: CouponEdge['contour'],
  s: number,
): CouponHole => {
  const { x, y, w, h, r } = contour;
  const top = w - 2 * r;
  const side = h - 2 * r;
  const arc = (Math.PI * r) / 2;
  const total = 2 * top + 2 * side + 4 * arc;
  let d = ((s % total) + total) % total;

  const onArc = (cx: number, cy: number, startAngle: number, along: number) => {
    const angle = startAngle + along / Math.max(r, 1e-6);
    const nx = Math.cos(angle);
    const ny = Math.sin(angle);

    return {
      x: cx + nx * r,
      y: cy + ny * r,
      nx,
      ny,
      tx: -ny,
      ty: nx,
    };
  };

  if (d < top) {
    return { x: x + r + d, y, nx: 0, ny: -1, tx: 1, ty: 0 };
  }

  d -= top;

  if (d < arc) {
    return onArc(x + w - r, y + r, -Math.PI / 2, d);
  }

  d -= arc;

  if (d < side) {
    return { x: x + w, y: y + r + d, nx: 1, ny: 0, tx: 0, ty: 1 };
  }

  d -= side;

  if (d < arc) {
    return onArc(x + w - r, y + h - r, 0, d);
  }

  d -= arc;

  if (d < top) {
    return { x: x + w - r - d, y: y + h, nx: 0, ny: 1, tx: -1, ty: 0 };
  }

  d -= top;

  if (d < arc) {
    return onArc(x + r, y + h - r, Math.PI / 2, d);
  }

  d -= arc;

  if (d < side) {
    return { x, y: y + h - r - d, nx: -1, ny: 0, tx: 0, ty: -1 };
  }

  d -= side;

  return onArc(x + r, y + r, Math.PI, d);
};

const contourLength = (contour: CouponEdge['contour']): number => {
  const { w, h, r } = contour;
  return 2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r;
};

// ---- building -------------------------------------------------------------

const cache = new Map<string, CouponEdge>();

export const buildCouponEdge = (spec: CouponEdgeSpec): CouponEdge => {
  const key = [
    spec.width,
    spec.height,
    spec.radius,
    spec.hole,
    spec.pitch,
    spec.seed,
  ].join('/');
  const cached = cache.get(key);

  if (cached) {
    return cached;
  }

  const holeRadius = spec.hole / 2;
  const inset = holeRadius + 0.6;
  const contour = buildContour(spec, inset);
  const length = contourLength(contour);
  const count = Math.max(8, Math.round(length / spec.pitch));
  const pitch = length / count;
  // The first hole sits half a pitch from the top edge's start, so the row is
  // symmetric about the middle of the top edge and the seam is a plain gap.
  const first = pitch / 2;
  const holes: CouponHole[] = [];

  for (let index = 0; index < count; index += 1) {
    holes.push(pointAt(contour, first + index * pitch));
  }

  const random = makeRandom(spec.seed);
  const startCorner = Math.floor(random() * 4);
  const corners: Point[] = [
    { x: contour.x, y: contour.y },
    { x: contour.x + contour.w, y: contour.y },
    { x: contour.x + contour.w, y: contour.y + contour.h },
    { x: contour.x, y: contour.y + contour.h },
  ];
  const origin = corners[startCorner]!;
  const diagonal = Math.hypot(contour.w, contour.h) || 1;

  const tears: number[] = [];
  const slants: number[] = [];
  const burrs: number[] = [];
  const order: number[] = [];
  const reach = holeRadius * 0.82;
  // How many necks stay with the piece: about half, but never all or none.
  let withPiece = 0;

  for (let index = 0; index < count; index += 1) {
    const here = holes[index]!;
    const next = holes[(index + 1) % count]!;
    const mid = { x: (here.x + next.x) / 2, y: (here.y + next.y) / 2 };
    const goesWithPiece = random() < 0.5;
    const depth = (0.28 + random() * 0.62) * reach;

    withPiece += goesWithPiece ? 1 : 0;
    tears.push(goesWithPiece ? depth : -depth);
    slants.push((random() - 0.5) * 0.8);
    burrs.push(random() < 2.2 / count ? 0.9 + random() * 0.9 : 0);
    order.push(Math.min(1, Math.hypot(mid.x - origin.x, mid.y - origin.y) / diagonal));
  }

  if (withPiece === 0) {
    tears[0] = Math.abs(tears[0]!);
  } else if (withPiece === count) {
    tears[0] = -Math.abs(tears[0]!);
  }

  const edge: CouponEdge = {
    spec,
    holeRadius,
    inset,
    holes,
    tears,
    slants,
    burrs,
    order,
    contour,
    startCorner,
  };

  if (cache.size > 200) {
    cache.clear();
  }

  cache.set(key, edge);
  return edge;
};

// ---- paths ----------------------------------------------------------------

const fmt = (value: number): string => {
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? '0' : String(rounded);
};

/** All holes as circles of one compound path (for fills, clips and rims). */
export const holesPath = (
  edge: CouponEdge,
  dx = 0,
  dy = 0,
  grow = 0,
): string => {
  const radius = edge.holeRadius + grow;

  return edge.holes
    .map(
      (hole) =>
        `M${fmt(hole.x + dx - radius)} ${fmt(hole.y + dy)}a${fmt(radius)} ${fmt(radius)} 0 1 0 ${fmt(radius * 2)} 0a${fmt(radius)} ${fmt(radius)} 0 1 0 ${fmt(-radius * 2)} 0z`,
    )
    .join('');
};

/** The plain (untorn) contour as a rounded rectangle path. */
export const contourPath = (edge: CouponEdge): string => {
  const { x, y, w, h, r } = edge.contour;

  return `M${fmt(x + r)} ${fmt(y)}H${fmt(x + w - r)}A${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(x + w)} ${fmt(y + r)}V${fmt(y + h - r)}A${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(x + w - r)} ${fmt(y + h)}H${fmt(x + r)}A${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(x)} ${fmt(y + h - r)}V${fmt(y + r)}A${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(x + r)} ${fmt(y)}Z`;
};

/** Ease of one neck's tear for the wave (0 = holding, 1 = torn). */
const tearedAmount = (
  edge: CouponEdge,
  index: number,
  progress: number,
): number => {
  if (progress >= 1) {
    return 1;
  }

  if (progress <= 0) {
    return 0;
  }

  // Every neck takes a fifth of the wave to give; the farthest one starts last.
  const start = edge.order[index]! * 0.8;
  const t = Math.min(1, Math.max(0, (progress - start) / 0.2));
  return t * t * (3 - 2 * t);
};

const ARC_STEPS = 9;

interface Cut {
  /** The two ends of the tear across a neck, in the box. */
  a: Point;
  b: Point;
  burr: { at: Point; tip: Point } | null;
}

const cutsOf = (edge: CouponEdge, progress: number): Cut[] => {
  const { holes, holeRadius } = edge;
  const count = holes.length;
  const cuts: Cut[] = [];

  for (let index = 0; index < count; index += 1) {
    const here = holes[index]!;
    const next = holes[(index + 1) % count]!;
    const amount = tearedAmount(edge, index, progress);
    const t = edge.tears[index]! * amount;
    const slant = edge.slants[index]! * amount;
    // The neck's two walls are the holes' circles, cut at height t.
    const run = Math.sqrt(Math.max(0, holeRadius * holeRadius - t * t));
    const a = {
      x: here.x + here.tx * run + here.nx * (t + slant),
      y: here.y + here.ty * run + here.ny * (t + slant),
    };
    const b = {
      x: next.x - next.tx * run + next.nx * (t - slant),
      y: next.y - next.ty * run + next.ny * (t - slant),
    };
    let burr: Cut['burr'] = null;

    if (edge.burrs[index]! > 0 && amount > 0.6) {
      const at = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const push = (t >= 0 ? 1 : -1) * edge.burrs[index]! * amount;
      burr = {
        at,
        tip: {
          x: at.x + here.nx * push + here.tx * 0.5,
          y: at.y + here.ny * push + here.ty * 0.5,
        },
      };
    }

    cuts.push({ a, b, burr });
  }

  return cuts;
};

/**
 * Points of the arc of one hole between the end of the neck before it and
 * the start of the neck after it: on the side facing the piece (its inner
 * half) or the card (its outer half). Angles are measured in the hole's own
 * frame: the tangent is the x axis, the outward normal the y axis.
 */
const holeArcPoints = (
  edge: CouponEdge,
  index: number,
  cuts: Cut[],
  side: 'piece' | 'card',
): Point[] => {
  const count = edge.holes.length;
  const hole = edge.holes[index]!;
  const before = cuts[(index - 1 + count) % count]!.b; // arrives at this hole
  const after = cuts[index]!.a; // leaves this hole
  const local = (point: Point) => {
    const dx = point.x - hole.x;
    const dy = point.y - hole.y;
    return {
      u: dx * hole.tx + dy * hole.ty,
      v: dx * hole.nx + dy * hole.ny,
    };
  };
  const from = local(before);
  const to = local(after);
  // Angles with u to the right and v outward.
  const fromAngle = Math.atan2(from.v, from.u);
  const toAngle = Math.atan2(to.v, to.u);
  let start: number;
  let end: number;

  if (side === 'piece') {
    // From the left end, down through the inner side, to the right end.
    start = fromAngle > 0 ? fromAngle - 2 * Math.PI : fromAngle;
    end = toAngle;
    if (end < start) {
      end += 2 * Math.PI;
    }
  } else {
    // From the left end, up over the outer side, to the right end.
    start = fromAngle < 0 ? fromAngle + 2 * Math.PI : fromAngle;
    end = toAngle;
    if (end > start) {
      end -= 2 * Math.PI;
    }
  }

  const points: Point[] = [];
  const steps = Math.max(
    2,
    Math.ceil((Math.abs(end - start) / Math.PI) * ARC_STEPS),
  );
  const radius = edge.holeRadius;

  for (let step = 0; step <= steps; step += 1) {
    const angle = start + ((end - start) * step) / steps;
    const u = Math.cos(angle) * radius;
    const v = Math.sin(angle) * radius;

    points.push({
      x: hole.x + hole.tx * u + hole.nx * v,
      y: hole.y + hole.ty * u + hole.ny * v,
    });
  }

  return points;
};

const toPath = (points: Point[]): string =>
  points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${fmt(point.x)} ${fmt(point.y)}`)
    .join('') + 'Z';

/**
 * Walks the rim of the torn piece. The piece is what lies inside the contour,
 * so its rim runs in each hole's inner arc and across each neck at the tear.
 */
const rimPoints = (
  edge: CouponEdge,
  progress: number,
  side: 'piece' | 'card',
): Point[] => {
  const cuts = cutsOf(edge, progress);
  const count = edge.holes.length;
  const points: Point[] = [];

  for (let index = 0; index < count; index += 1) {
    points.push(...holeArcPoints(edge, index, cuts, side));
    const cut = cuts[index]!;

    if (cut.burr) {
      points.push(cut.a, cut.burr.at, cut.burr.tip, cut.burr.at, cut.b);
    } else {
      points.push(cut.a, cut.b);
    }
  }

  return points;
};

/** The torn piece itself: inside the contour, notched by the holes, teeth where the necks stayed. */
export const piecePath = (edge: CouponEdge, progress = 1): string =>
  toPath(rimPoints(edge, progress, 'piece'));

/**
 * The void the piece leaves in the card: the same rim, with the card's side of
 * every hole, so it is the piece's exact counterpart. It is returned as the
 * rim of the card's paper around the hole; the void is everything inside it.
 */
export const slotPath = (edge: CouponEdge, progress = 1): string =>
  toPath(rimPoints(edge, progress, 'card'));

/** The light line along the tear (the paper's core showing), as one open path per neck. */
export const tearLinesPath = (edge: CouponEdge, progress = 1): string =>
  cutsOf(edge, progress)
    .map((cut) => {
      let path = `M${fmt(cut.a.x)} ${fmt(cut.a.y)}L${fmt(cut.b.x)} ${fmt(cut.b.y)}`;

      if (cut.burr) {
        path += `M${fmt(cut.burr.at.x)} ${fmt(cut.burr.at.y)}L${fmt(cut.burr.tip.x)} ${fmt(cut.burr.tip.y)}`;
      }

      return path;
    })
    .join('');
