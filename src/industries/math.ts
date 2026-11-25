/** Pure turntable maths: kept separate so it can be unit-tested without WebGL. */

const TAU = Math.PI * 2;

/** Wrap an angle into (-PI, PI]. */
export function wrapAngle(a: number): number {
  let r = ((a + Math.PI) % TAU + TAU) % TAU - Math.PI;
  if (r <= -Math.PI + 1e-12) r += TAU;
  return r;
}

/** Industry i is in front when the disc rotation equals -i * step. */
export function nearestIndex(rotation: number, count: number): number {
  const step = TAU / count;
  const i = Math.round(-rotation / step);
  return ((i % count) + count) % count;
}

/** Rotation value nearest to `from` that brings `index` to the front (turns the short way). */
export function shortestRotation(from: number, index: number, count: number): number {
  const step = TAU / count;
  return from + wrapAngle(-index * step - from);
}

/**
 * How far (world units) to slide the camera target to the right so the focused industry
 * lands in the middle of the left `leftShare` of the screen.
 */
export function focusOffset(viewWidth: number, zoom: number, leftShare = 0.6): number {
  return ((0.5 - leftShare / 2) * viewWidth) / zoom;
}
