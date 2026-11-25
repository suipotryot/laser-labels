import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { circle, hollow, placeInBox, rectangle, solid, starOfArms } from '../../src/icons/contours.js';

function signedAreaOf(contour) {
  const points = contour.filter((command) => command.type !== 'Z');
  return points.reduce((area, point, index) => {
    const next = points[(index + 1) % points.length];
    return area + (point.x * next.y - next.x * point.y) / 2;
  }, 0);
}

function windingOf(contour) {
  return signedAreaOf(contour) > 0 ? 'clockwise' : 'counterclockwise';
}

describe('hollow', () => {
  it('should wind a contour counterclockwise on screen whatever the way it was drawn', () => {
    assert.equal(windingOf(hollow(circle(1))), 'counterclockwise');
    assert.equal(windingOf(hollow(rectangle({ halfWidth: 1, halfHeight: 0.5 }))), 'counterclockwise');
  });
});

describe('solid', () => {
  it('should wind a contour clockwise on screen whatever the way it was drawn', () => {
    assert.equal(windingOf(solid(circle(1))), 'clockwise');
    assert.equal(windingOf(solid(rectangle({ halfWidth: 1, halfHeight: 0.5 }))), 'clockwise');
  });
});

describe('starOfArms', () => {
  it('should refuse to join two neighbor arms pointing in opposite directions', () => {
    const arms = [
      { angle: 0, length: 1, halfWidth: 0.1 },
      { angle: Math.PI, length: 1, halfWidth: 0.1 },
    ];

    assert.throws(() => starOfArms(arms), /Cannot join two parallel arms/);
  });
});

function extentOf(commands) {
  const points = commands.filter((command) => command.type !== 'Z');
  const xs = points.map(({ x }) => x);
  const ys = points.map(({ y }) => y);
  return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
}

function isAlmostEqual(actual, expected) {
  return Math.abs(actual - expected) < 1e-9;
}

describe('placeInBox', () => {
  it('should scale a drawing to fit the box, keeping its proportions, and center it', () => {
    const lyingDrawing = rectangle({ halfWidth: 2, halfHeight: 0.5 });
    const box = { x: 10, y: 20, width: 8, height: 6 };

    const extent = extentOf(placeInBox(lyingDrawing, box, { upright: false }));

    assert.ok(isAlmostEqual(extent.left, 10) && isAlmostEqual(extent.right, 18));
    assert.ok(isAlmostEqual(extent.bottom - extent.top, 2));
    assert.ok(isAlmostEqual((extent.top + extent.bottom) / 2, 23));
  });

  it('should turn the drawing upright, its left end on top, when asked', () => {
    const lyingDrawing = [...rectangle({ halfWidth: 2, halfHeight: 0.5 }), { type: 'M', x: -2, y: 0 }, { type: 'L', x: -1.9, y: 0 }];
    const box = { x: 0, y: 0, width: 6, height: 20 };

    const placed = placeInBox(lyingDrawing, box, { upright: true });

    const extent = extentOf(placed);
    assert.ok(extent.bottom - extent.top > 3 * (extent.right - extent.left), 'the drawing is not upright');
    const leftEndMarker = placed.at(-2);
    assert.ok(isAlmostEqual(leftEndMarker.y, extent.top), 'the left end is not on top');
  });
});
