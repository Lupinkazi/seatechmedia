// Pure layout math for TumbleDeckShowcase (no React/DOM so it can be unit tested).

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const wrap = (k: number, n: number) => (n ? ((k % n) + n) % n : 0);

/** Hinge angle (deg, CSS rotateX): 0 upright, -90 flat. Gravity eases in, then one small kick. */
export function fallAngle(t: number): number {
  const u = clamp01(t);
  const land = 0.78;
  if (u <= land) {
    const k = u / land;
    return -90 * k * k * k;
  }
  const k = (u - land) / (1 - land);
  return -90 + 6 * Math.sin(Math.PI * k) * (1 - k);
}

/** How far the deck has slid forward, in card gaps, at deck position `pos`. */
export function deckAdvance(pos: number): number {
  const i = Math.floor(pos);
  const f = pos - i;
  const k = clamp01((f - 0.28) / 0.6);
  return i + k * k * (3 - 2 * k);
}

export type Pose = { angle: number; z: number; lift: number; opacity: number; flat: boolean };

export function cardPose(k: number, pos: number, depth: number): Pose {
  const t = pos - k;
  const lift = (k - Math.floor(pos) + 3) * 0.6;
  if (t >= 1) return { angle: -90, z: 0, lift, opacity: t < 3 && k >= 0 ? 1 : 0, flat: true };
  if (t > 0) return { angle: fallAngle(t), z: 0, lift, opacity: 1, flat: false };
  const rel = k - deckAdvance(pos);
  return { angle: 0, z: -Math.max(rel, 0), lift: 0, opacity: clamp01(depth + 1 - rel), flat: false };
}

/** Number of recycled card elements for `n` cards. */
export const poolSize = (n: number, depth: number) => Math.min(n, depth + 5);

/**
 * Deck index `k` shown by pool slot `j` at deck position `pos`. The window
 * normally starts 2 cards behind the front, but a small pool must start nearer
 * the front or every slot lands on a negative (hidden) index and the deck is blank.
 * A single card never moves: it is pinned to index 0.
 */
export function slotIndex(j: number, pos: number, pool: number, n: number): number {
  if (n <= 1) return 0;
  const base = Math.floor(pos) - Math.min(2, pool - 1);
  return base + wrap(j - base, pool);
}
