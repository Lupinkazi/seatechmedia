import assert from "node:assert/strict";
import { test } from "node:test";
import { cardPose, poolSize, slotIndex } from "../src/components/ui/tumble-deck-math.ts";

const DEPTH = 5;
const visibleCards = (n: number, pos = 0) => {
  const pool = poolSize(n, DEPTH);
  return Array.from({ length: pool }, (_, j) => slotIndex(j, pos, pool, n))
    .filter((k) => cardPose(k, n > 1 ? pos : 0, DEPTH).opacity > 0);
};

test("single-item filters (Wedding, Bartabanda, Pasni, Puran, Birthday, Engagement) show their card", () => {
  assert.deepEqual(visibleCards(1), [0]);
  const pose = cardPose(slotIndex(0, 0, 1, 1), 0, DEPTH);
  assert.equal(pose.angle, 0);
  assert.equal(pose.opacity, 1);
});

test("single card stays put at any deck position", () => {
  for (const pos of [0, 0.5, 3, 12.7]) assert.deepEqual(visibleCards(1, pos), [0]);
});

test("two-item decks are not blank", () => {
  assert.ok(visibleCards(2).length >= 1);
});

test("multi-card decks keep the original window (front card plus depth)", () => {
  const n = 12;
  const pool = poolSize(n, DEPTH);
  assert.equal(pool, 10);
  assert.equal(slotIndex(0, 0, pool, n), -2 + ((0 + 2) % pool));
  assert.ok(visibleCards(n).includes(0));
  assert.equal(visibleCards(n).length, 6);
});
