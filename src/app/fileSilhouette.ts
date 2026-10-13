/**
 * The outline of the card file's box together with the tab of the deck on the
 * table: one piece, so the tab is part of the box and not stuck on it. Every
 * corner is rounded, and where the tab meets the box's top edge the outline
 * flows into it by a small concave curve (as the tab of a real folder does).
 *
 * Coordinates: x across, y down, from the top-left of the file; the tab stands
 * from `tabTop` down, the box's top edge is at `boxTop`.
 */
export interface SilhouetteSpec {
  width: number;
  bottom: number;
  boxTop: number;
  tabTop: number;
  tabLeft: number;
  tabRight: number;
}

/** The outer corners of the box, the tab's top corners and the curve into the box. */
export const SILHOUETTE_RADIUS = 10;
export const SILHOUETTE_TAB_RADIUS = 8;
export const SILHOUETTE_FILLET = 4;

const n = (value: number): string => String(Math.round(value * 100) / 100);

export const buildSilhouettePath = ({
  width,
  bottom,
  boxTop,
  tabTop,
  tabLeft,
  tabRight,
}: SilhouetteSpec): string => {
  const r = SILHOUETTE_RADIUS;
  const rt = Math.min(SILHOUETTE_TAB_RADIUS, (tabRight - tabLeft) / 2);
  const f = SILHOUETTE_FILLET;
  // The curve may not run into the box's own corner.
  const left = Math.max(tabLeft, r + f);
  const right = Math.min(tabRight, width - r - f);

  return [
    `M ${n(r)} ${n(boxTop)}`,
    `H ${n(left - f)}`,
    `A ${f} ${f} 0 0 0 ${n(left)} ${n(boxTop - f)}`,
    `V ${n(tabTop + rt)}`,
    `A ${rt} ${rt} 0 0 1 ${n(left + rt)} ${n(tabTop)}`,
    `H ${n(right - rt)}`,
    `A ${rt} ${rt} 0 0 1 ${n(right)} ${n(tabTop + rt)}`,
    `V ${n(boxTop - f)}`,
    `A ${f} ${f} 0 0 0 ${n(right + f)} ${n(boxTop)}`,
    `H ${n(width - r)}`,
    `A ${r} ${r} 0 0 1 ${n(width)} ${n(boxTop + r)}`,
    `V ${n(bottom - r)}`,
    `A ${r} ${r} 0 0 1 ${n(width - r)} ${n(bottom)}`,
    `H ${n(r)}`,
    `A ${r} ${r} 0 0 1 0 ${n(bottom - r)}`,
    `V ${n(boxTop + r)}`,
    `A ${r} ${r} 0 0 1 ${n(r)} ${n(boxTop)}`,
    'Z',
  ].join(' ');
};
