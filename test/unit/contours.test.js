import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { arc, circle, hollow, placeTogetherInBox, polyline, rectangle, solid, starOfArms } from '../../src/icons/contours.js';
import { extentOf, isAlmostEqual, windingOf } from './helpers/geometry.js';

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

describe('placeTogetherInBox', () => {
  it('should scale drawings to fit the box, keeping their proportions, and center them', () => {
    const lyingDrawing = rectangle({ halfWidth: 2, halfHeight: 0.5 });
    const box = { x: 10, y: 20, width: 8, height: 6 };

    const { placedDrawings: [placed] } = placeTogetherInBox([lyingDrawing], box);

    const extent = extentOf(placed);
    const drawingAspectRatio = 4;
    assert.ok(isAlmostEqual(extent.left, box.x) && isAlmostEqual(extent.right, box.x + box.width));
    assert.ok(isAlmostEqual(extent.bottom - extent.top, box.width / drawingAspectRatio));
    assert.ok(isAlmostEqual((extent.top + extent.bottom) / 2, box.y + box.height / 2));
  });

  it('should give the same scale to all the drawings and tell it', () => {
    const outline = rectangle({ halfWidth: 2, halfHeight: 0.5 });
    const strokes = polyline([{ x: -1, y: -0.5 }, { x: -1, y: 0.5 }]);
    const box = { x: 0, y: 0, width: 8, height: 6 };

    const { placedDrawings: [, placedStrokes], scale } = placeTogetherInBox([outline, strokes], box);

    assert.equal(scale, 2);
    assert.ok(isAlmostEqual(placedStrokes[1].y - placedStrokes[0].y, 1 * scale));
  });

  it('should keep a curve bulging between its ends inside the box', () => {
    const bulgingDrawing = [{ type: 'M', x: 0, y: 0 }, { type: 'Q', x1: 1, y1: -2, x: 2, y: 0 }, { type: 'L', x: 2, y: 1 }, { type: 'Z' }];
    const box = { x: 0, y: 0, width: 10, height: 10 };

    const { placedDrawings: [[start, curve]] } = placeTogetherInBox([bulgingDrawing], box);

    const middleOfCurveY = 0.25 * start.y + 0.5 * curve.y1 + 0.25 * curve.y;
    assert.ok(middleOfCurveY >= box.y, `the curve bulges out of the box, up to y=${middleOfCurveY}`);
  });

  it('should refuse a drawing without any extent', () => {
    const singlePoint = [{ type: 'M', x: 1, y: 1 }];

    assert.throws(() => placeTogetherInBox([singlePoint], { x: 0, y: 0, width: 10, height: 10 }), /Cannot place a drawing without extent/);
  });
});

function pointOnCubicCurve(start, { x1, y1, x2, y2, x, y }, progress) {
  const remaining = 1 - progress;
  return {
    x: remaining ** 3 * start.x + 3 * remaining ** 2 * progress * x1 + 3 * remaining * progress ** 2 * x2 + progress ** 3 * x,
    y: remaining ** 3 * start.y + 3 * remaining ** 2 * progress * y1 + 3 * remaining * progress ** 2 * y2 + progress ** 3 * y,
  };
}

describe('arc', () => {
  it('should follow the circle from one angle to the other, on screen counterclockwise', () => {
    const center = { x: 1, y: 2 };
    const segments = arc({ center, radius: 3, fromAngle: 0, toAngle: Math.PI * 1.5 });

    let start = { x: 4, y: 2 };
    for (const segment of segments) {
      for (const progress of [0.25, 0.5, 0.75, 1]) {
        const point = pointOnCubicCurve(start, segment, progress);
        assert.ok(Math.abs(Math.hypot(point.x - center.x, point.y - center.y) - 3) < 0.01, 'the arc leaves the circle');
      }
      start = segment;
    }
    assert.ok(isAlmostEqual(start.x, 1) && isAlmostEqual(start.y, 5), 'the arc does not end at the last angle');
  });
});
