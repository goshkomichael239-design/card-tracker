import { describe, expect, it } from 'vitest';

import {
  buildCouponEdge,
  getCouponSeed,
  piecePath,
  slotPath,
} from '../src/app/couponEdge';
import { makeCard } from './helpers';

type Pt = [number, number];

const parse = (path: string): Pt[] =>
  path
    .replace(/Z/g, '')
    .split(/(?=[ML])/)
    .filter(Boolean)
    .map((part) => {
      const [x, y] = part.slice(1).split(/[ ,]/).filter(Boolean).map(Number);

      return [x!, y!] as Pt;
    });

const inside = (polygon: Pt[], x: number, y: number): boolean => {
  let result = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]!;
    const [xj, yj] = polygon[j]!;

    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      result = !result;
    }
  }

  return result;
};

const spec = (seed: string, width = 340, height = 49) => ({
  width,
  height,
  radius: 6,
  hole: 3.9,
  pitch: 7.8,
  seed,
});

describe('coupon perforation', () => {
  it('lays the holes evenly on the contour', () => {
    const edge = buildCouponEdge(spec('a'));
    const gaps = edge.holes.map((hole, index) => {
      const next = edge.holes[(index + 1) % edge.holes.length]!;

      return Math.hypot(next.x - hole.x, next.y - hole.y);
    });

    expect(edge.holes.length).toBeGreaterThan(80);
    // Straight stretches are equal to the pitch (corners are shorter chords).
    expect(Math.max(...gaps)).toBeLessThan(8.2);
    expect(Math.min(...gaps)).toBeGreaterThan(6.5);
  });

  it('tears the same way every time for the same card, differently for another', () => {
    const one = piecePath(buildCouponEdge(spec('card one')));
    const again = piecePath(buildCouponEdge(spec('card one')));
    const other = piecePath(buildCouponEdge(spec('card two')));

    expect(again).toBe(one);
    expect(other).not.toBe(one);
  });

  it('draws the tear from the fields the archive copy keeps', () => {
    const card = makeCard({ id: 'one', reminderAt: '2026-10-16T09:00:00.000Z' });
    const archived = { ...card, id: 'two', completedAt: '2026-10-16T10:00:00.000Z' };

    expect(getCouponSeed(archived)).toBe(getCouponSeed(card));
    expect(getCouponSeed(makeCard({ title: 'Another' }))).not.toBe(
      getCouponSeed(makeCard()),
    );
  });

  it('fits the slot exactly to the piece (what is torn off is what is missing)', () => {
    for (const seed of ['a', 'b|c', 'x y z']) {
      for (const progress of [1, 0.5]) {
        const edge = buildCouponEdge(spec(seed));
        const piece = parse(piecePath(edge, progress));
        const slot = parse(slotPath(edge, progress));
        let pieceOutsideSlot = 0;

        // The piece lies wholly inside the slot...
        for (let y = -2; y < 51; y += 1) {
          for (let x = -2; x < 342; x += 1) {
            if (inside(piece, x, y) && !inside(slot, x, y)) {
              pieceOutsideSlot += 1;
            }
          }
        }

        // ...and every hole is in the slot and not in the piece.
        let holeNotInSlot = 0;
        let holeInPiece = 0;
        let samples = 0;

        for (const hole of edge.holes) {
          for (const [dx, dy] of [
            [0, 0],
            [0.7, 0],
            [-0.7, 0],
            [0, 0.7],
            [0, -0.7],
            [0.5, 0.5],
            [-0.5, -0.5],
            [0.5, -0.5],
            [-0.5, 0.5],
          ] as Pt[]) {
            const x = hole.x + dx * edge.holeRadius * 0.8;
            const y = hole.y + dy * edge.holeRadius * 0.8;

            samples += 1;

            if (!inside(slot, x, y)) holeNotInSlot += 1;
            if (inside(piece, x, y)) holeInPiece += 1;
          }
        }

        expect(samples).toBeGreaterThan(500);
        // A handful of boundary samples is allowed; anything more is a gap.
        expect(pieceOutsideSlot).toBeLessThan(4);
        expect(holeNotInSlot).toBeLessThan(4);
        expect(holeInPiece).toBeLessThan(4);
      }
    }
  }, 60_000);
});
