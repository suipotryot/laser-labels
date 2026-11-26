import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { arc, circle, hollow, placeTogetherInBox, polygonWithRoundedCorners, polyline, rectangle, solid, starOfArms } from '../../src/icons/contours.js';
import { extentOf, isAlmostEqual, pointOnCubicCurve, windingOf } from './helpers/geometry.js';

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

const CIRCLE_TOLERANCE = 0.01;

function samplesAlong(start, segments) {
  const samples = [];
  let segmentStart = start;
  for (const segment of segments) {
    for (const progress of [0.25, 0.5, 0.75, 1]) {
      samples.push(pointOnCubicCurve(segmentStart, segment, progress));
    }
    segmentStart = { x: segment.x, y: segment.y };
  }
  return samples;
}

function angleOnScreen(center, point) {
  return Math.atan2(center.y - point.y, point.x - center.x);
}

describe('arc', () => {
  const circleOnScreen = { center: { x: 1, y: 2 }, radius: 3 };

  function pointAt(angle) {
    return {
      x: circleOnScreen.center.x + circleOnScreen.radius * Math.cos(angle),
      y: circleOnScreen.center.y - circleOnScreen.radius * Math.sin(angle),
    };
  }

  function assertFollowsTheCircle(samples) {
    for (const sample of samples) {
      const distance = Math.hypot(sample.x - circleOnScreen.center.x, sample.y - circleOnScreen.center.y);
      assert.ok(Math.abs(distance - circleOnScreen.radius) < CIRCLE_TOLERANCE, 'the arc leaves the circle');
    }
  }

  it('should follow the circle counterclockwise on screen when the end angle is larger', () => {
    const samples = samplesAlong(pointAt(0), arc({ ...circleOnScreen, fromAngle: 0, toAngle: (3 * Math.PI) / 2 }));

    assertFollowsTheCircle(samples);
    const firstSampleAngle = angleOnScreen(circleOnScreen.center, samples[0]);
    assert.ok(firstSampleAngle > 0 && firstSampleAngle < Math.PI / 2, 'the arc does not start counterclockwise');
    const end = samples.at(-1);
    assert.ok(isAlmostEqual(end.x, pointAt((3 * Math.PI) / 2).x) && isAlmostEqual(end.y, pointAt((3 * Math.PI) / 2).y), 'the arc does not end at the last angle');
  });

  it('should follow the circle clockwise on screen when the end angle is smaller', () => {
    const samples = samplesAlong(pointAt(Math.PI / 2), arc({ ...circleOnScreen, fromAngle: Math.PI / 2, toAngle: -Math.PI }));

    assertFollowsTheCircle(samples);
    const firstSampleAngle = angleOnScreen(circleOnScreen.center, samples[0]);
    assert.ok(firstSampleAngle > 0 && firstSampleAngle < Math.PI / 2, 'the arc does not start clockwise');
    const end = samples.at(-1);
    assert.ok(isAlmostEqual(end.x, pointAt(-Math.PI).x) && isAlmostEqual(end.y, pointAt(-Math.PI).y), 'the arc does not end at the last angle');
  });

  it('should draw nothing when the arc starts and ends at the same angle', () => {
    assert.deepEqual(arc({ ...circleOnScreen, fromAngle: 1, toAngle: 1 }), []);
  });

  it('should refuse an angle that is not a finite number', () => {
    assert.throws(() => arc({ ...circleOnScreen, fromAngle: 0, toAngle: Number.NaN }), /Arc angles must be finite numbers/);
    assert.throws(() => arc({ ...circleOnScreen, fromAngle: 0, toAngle: Infinity }), /Arc angles must be finite numbers/);
  });
});

describe('polygonWithRoundedCorners', () => {
  it('should refuse roundings longer together than the side they share', () => {
    const corners = [
      { x: 0, y: 0, rounding: 0.6 },
      { x: 1, y: 0, rounding: 0.6 },
      { x: 1, y: 2 },
      { x: 0, y: 2 },
    ];

    assert.throws(() => polygonWithRoundedCorners(corners), /Roundings longer than their side/);
  });
});
