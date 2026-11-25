import { describe, expect, it } from "vitest";
import { focusOffset, nearestIndex, shortestRotation, wrapAngle } from "./math";

const N = 8;
const STEP = (Math.PI * 2) / N;

describe("wrapAngle", () => {
  it("keeps angles in (-PI, PI]", () => {
    expect(wrapAngle(3 * Math.PI)).toBeCloseTo(Math.PI);
    expect(wrapAngle(-3 * Math.PI)).toBeCloseTo(Math.PI);
    expect(wrapAngle(0.5)).toBeCloseTo(0.5);
  });
});

describe("nearestIndex (drag release settles on the nearest industry)", () => {
  it("rounds a drag that stops between two industries", () => {
    expect(nearestIndex(-1.4 * STEP, N)).toBe(1);
    expect(nearestIndex(-1.6 * STEP, N)).toBe(2);
  });
  it("wraps rotations past a full turn and in the other direction", () => {
    expect(nearestIndex(-9 * STEP, N)).toBe(1);
    expect(nearestIndex(1 * STEP, N)).toBe(7);
  });
});

describe("shortestRotation (clicking an industry turns the short way)", () => {
  it("goes one step back instead of seven forward", () => {
    expect(shortestRotation(0, 7, N)).toBeCloseTo(STEP);
  });
  it("stays continuous with an accumulated rotation", () => {
    const from = -16 * STEP + 0.1; // two full turns plus a nudge
    expect(shortestRotation(from, 1, N)).toBeCloseTo(-17 * STEP);
  });
  it("is a no-op when the industry is already in front", () => {
    expect(shortestRotation(-3 * STEP, 3, N)).toBeCloseTo(-3 * STEP);
  });
});

describe("focusOffset (selected industry sits in the middle of the left 60%)", () => {
  it("shifts the camera target by 20% of the visible width", () => {
    expect(focusOffset(10, 1)).toBeCloseTo(2);
  });
  it("accounts for the push-in zoom", () => {
    expect(focusOffset(10, 1.2)).toBeCloseTo(2 / 1.2);
  });
});
