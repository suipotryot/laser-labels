import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { drawUsageIcon, thinnestUsageIconDetail } from '../../src/icons/usageIcons.js';
import { usageTypes } from '../../src/catalog/usageTypes.js';
import { contoursOf, cornersOf, extentOf, isAlmostEqual, onCurvePointsOf, sampledPointsOf, windingOf } from './helpers/geometry.js';

const UNIT_HALF_SIZE = 1;
const CURVE_SAMPLING_TOLERANCE = 0.01;

function silhouetteOf(usageKey) {
  const { outline, strokes } = drawUsageIcon(usageKey);
  const [body, ...holes] = contoursOf(outline);
  return { body, holes, strokes: contoursOf(strokes), extent: extentOf(onCurvePointsOf(body)) };
}

function lengthOf(extent) {
  return extent.right - extent.left;
}

function heightOf(extent) {
  return extent.bottom - extent.top;
}

function centerOf(points) {
  const { left, right, top, bottom } = extentOf(points);
  return { x: (left + right) / 2, y: (top + bottom) / 2 };
}

function distanceBetween(first, second) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function isVertical([start, end]) {
  return isAlmostEqual(start.x, end.x);
}

function isHorizontal([start, end]) {
  return isAlmostEqual(start.y, end.y);
}

function leanOf(hole) {
  const points = sampledPointsOf(hole);
  const center = centerOf(points);
  const farthest = points.reduce((best, point) => (distanceBetween(point, center) > distanceBetween(best, center) ? point : best));
  return Math.sign((farthest.x - center.x) * (farthest.y - center.y));
}

function smallestGapBetween(sortedValues) {
  return Math.min(...sortedValues.slice(1).map((value, index) => value - sortedValues[index]));
}

describe('drawUsageIcon', () => {
  it('should close every contour of the outlines and leave every stroke open, for every usage of the catalog', () => {
    for (const { key } of usageTypes) {
      const { outline, strokes } = drawUsageIcon(key);
      assert.ok(contoursOf(outline).every((contour) => contour.at(-1).type === 'Z'), `${key} has an open outline`);
      assert.ok(strokes.every(({ type }) => type !== 'Z'), `${key} has a closed stroke`);
    }
  });

  it('should draw the holes of every usage against the winding of its body so that they stay hollow in Fill', () => {
    for (const { key } of usageTypes) {
      const { body, holes } = silhouetteOf(key);
      assert.ok(holes.every((hole) => windingOf(hole) !== windingOf(body)), `${key} has a hole that would be filled`);
    }
  });

  it('should draw every usage of the catalog as tall as the unit square, centered on it', () => {
    for (const { key } of usageTypes) {
      const { extent } = silhouetteOf(key);
      assert.ok(isAlmostEqual(extent.top, -UNIT_HALF_SIZE) && isAlmostEqual(extent.bottom, UNIT_HALF_SIZE), `${key} is not as tall as the unit square`);
      assert.ok(isAlmostEqual(extent.left, -extent.right), `${key} is not centered horizontally`);
    }
  });

  it('should refuse a usage it cannot draw', () => {
    assert.throws(() => drawUsageIcon('underwater'), /No icon for usage: underwater/);
  });

  it('should refuse a name inherited by every object rather than a usage', () => {
    assert.throws(() => drawUsageIcon('constructor'), /No icon for usage: constructor/);
  });

  it('should draw the metal as a square plate with four hollow ellipses, no stroke', () => {
    const plate = silhouetteOf('metal');

    assert.equal(cornersOf(plate.body).length, 4);
    assert.ok(isAlmostEqual(lengthOf(plate.extent), heightOf(plate.extent)), 'the plate is not square');
    assert.equal(plate.holes.length, 4);
    assert.equal(plate.strokes.length, 0);
  });

  it('should spread the ellipses of the metal plate on a grid, well inside the plate', () => {
    const { holes } = silhouetteOf('metal');

    const centers = holes.map((hole) => centerOf(sampledPointsOf(hole)));
    assert.deepEqual(centers.map(({ x }) => Math.sign(x)).sort(), [-1, -1, 1, 1]);
    assert.deepEqual(centers.map(({ y }) => Math.sign(y)).sort(), [-1, -1, 1, 1]);
    for (const point of holes.flatMap(sampledPointsOf)) {
      assert.ok(Math.abs(point.x) < UNIT_HALF_SIZE && Math.abs(point.y) < UNIT_HALF_SIZE, 'an ellipse leaves the plate');
    }
  });

  it('should lean the ellipses of the metal plate one way then the other, like a tread plate', () => {
    const { holes } = silhouetteOf('metal');

    const leanAt = (sideX, sideY) => leanOf(holes.find((hole) => {
      const center = centerOf(sampledPointsOf(hole));
      return Math.sign(center.x) === sideX && Math.sign(center.y) === sideY;
    }));
    assert.notEqual(leanAt(-1, -1), leanAt(1, -1), 'two neighbours lean the same way');
    assert.notEqual(leanAt(-1, -1), leanAt(-1, 1), 'two neighbours lean the same way');
    assert.equal(leanAt(-1, -1), leanAt(1, 1));
  });

  it('should draw the outdoor usage as a water drop, pointed at the top and round at the bottom', () => {
    const { body } = silhouetteOf('outdoor');

    assert.ok(body.some(({ type }) => type === 'C'), 'the bottom of the drop is not round');
    const topPoints = onCurvePointsOf(body).filter(({ y }) => isAlmostEqual(y, -UNIT_HALF_SIZE));
    assert.equal(topPoints.length, 1, 'the drop is not pointed at the top');
    assert.ok(isAlmostEqual(topPoints[0].x, 0), 'the point of the drop is not above its middle');
  });

  it('should join the tip of the drop to its round bottom by straight sides tangent to the bottom', () => {
    const { body, extent } = silhouetteOf('outdoor');

    const bulbRadius = lengthOf(extent) / 2;
    const bulbCenter = { x: 0, y: UNIT_HALF_SIZE - bulbRadius };
    const [tip, tangentPoint] = onCurvePointsOf(body);
    const sideDirection = { x: tangentPoint.x - tip.x, y: tangentPoint.y - tip.y };
    const radiusDirection = { x: tangentPoint.x - bulbCenter.x, y: tangentPoint.y - bulbCenter.y };
    assert.ok(tangentPoint.x > 0, 'the first side is not on the right of the tip');
    assert.ok(isAlmostEqual(Math.hypot(radiusDirection.x, radiusDirection.y), bulbRadius), 'the side does not end on the round bottom');
    assert.ok(isAlmostEqual(sideDirection.x * radiusDirection.x + sideDirection.y * radiusDirection.y, 0), 'the side is not tangent to the round bottom');
  });

  it('should draw a hollow curved reflection on the lower right inside the water drop', () => {
    const { holes, extent } = silhouetteOf('outdoor');

    const bulbRadius = lengthOf(extent) / 2;
    const bulbCenter = { x: 0, y: UNIT_HALF_SIZE - bulbRadius };
    assert.equal(holes.length, 1);
    for (const point of sampledPointsOf(holes[0])) {
      assert.ok(point.x > 0, 'the reflection is not on the right');
      assert.ok(distanceBetween(point, bulbCenter) < bulbRadius, 'the reflection leaves the round bottom');
    }
    assert.ok(centerOf(sampledPointsOf(holes[0])).y > bulbCenter.y, 'the reflection is not in the lower half of the round bottom');
  });

  it('should draw the masonry as a square with the joints of two staggered rows of bricks', () => {
    const wall = silhouetteOf('masonry');

    assert.equal(cornersOf(wall.body).length, 4);
    assert.ok(isAlmostEqual(lengthOf(wall.extent), heightOf(wall.extent)), 'the wall is not square');
    assert.equal(wall.holes.length, 0);
    const [rowJoint, ...others] = wall.strokes.filter(isHorizontal);
    assert.equal(others.length, 0);
    assert.ok(isAlmostEqual(extentOf(rowJoint).left, wall.extent.left) && isAlmostEqual(extentOf(rowJoint).right, wall.extent.right), 'the joint between the rows does not span the wall');
    assert.ok(isAlmostEqual(rowJoint[0].y, 0), 'the rows are not of the same height');
  });

  it('should put one vertical joint in the top row and two, staggered, in the bottom row of the masonry', () => {
    const { strokes } = silhouetteOf('masonry');

    const verticalJoints = strokes.filter(isVertical);
    const topJoints = verticalJoints.filter(([start, end]) => Math.max(start.y, end.y) <= 0 + 1e-9);
    const bottomJoints = verticalJoints.filter(([start, end]) => Math.min(start.y, end.y) >= 0 - 1e-9);
    assert.equal(topJoints.length, 1);
    assert.equal(bottomJoints.length, 2);
    assert.ok(bottomJoints.every(([start]) => Math.abs(start.x - topJoints[0][0].x) > 0.25), 'a joint of the bottom row is aligned with the top one');
  });

  it('should draw every joint of the masonry from one side of its row to the other', () => {
    const { strokes, extent } = silhouetteOf('masonry');

    for (const [start, end] of strokes.filter(isVertical)) {
      const isTopRow = Math.min(start.y, end.y) < 0;
      assert.ok(isAlmostEqual(Math.min(start.y, end.y), isTopRow ? extent.top : 0), 'a joint does not start at the top of its row');
      assert.ok(isAlmostEqual(Math.max(start.y, end.y), isTopRow ? 0 : extent.bottom), 'a joint does not end at the bottom of its row');
    }
  });
});

describe('thinnestUsageIconDetail', () => {
  it('should give a positive detail, in unit square halves, for every usage of the catalog', () => {
    for (const { key } of usageTypes) {
      const thinnestDetail = thinnestUsageIconDetail(key);
      assert.ok(Number.isFinite(thinnestDetail) && thinnestDetail > 0, `no thinnest detail for ${key}`);
    }
  });

  it('should give the rim between the ellipses and the border of the plate for the metal', () => {
    const { holes } = silhouetteOf('metal');

    const farthestReach = Math.max(...holes.flatMap(sampledPointsOf).map(({ x, y }) => Math.max(Math.abs(x), Math.abs(y))));
    assert.ok(Math.abs(thinnestUsageIconDetail('metal') - (UNIT_HALF_SIZE - farthestReach)) < CURVE_SAMPLING_TOLERANCE);
  });

  it('should give the thickness of the reflection for the water drop', () => {
    const { holes, extent } = silhouetteOf('outdoor');

    const bulbRadius = lengthOf(extent) / 2;
    const bulbCenter = { x: 0, y: UNIT_HALF_SIZE - bulbRadius };
    const distances = onCurvePointsOf(holes[0]).map((point) => distanceBetween(point, bulbCenter));
    assert.ok(isAlmostEqual(thinnestUsageIconDetail('outdoor'), Math.max(...distances) - Math.min(...distances)));
  });

  it('should give the smallest gap between the joints and the border for the masonry', () => {
    const { strokes, extent } = silhouetteOf('masonry');

    const positions = [extent.left, extent.right, ...strokes.filter(isVertical).map(([start]) => start.x)];
    const sortedPositions = [...new Set(positions.map((position) => Math.round(position * 1e6) / 1e6))].sort((first, second) => first - second);
    assert.ok(isAlmostEqual(thinnestUsageIconDetail('masonry'), smallestGapBetween(sortedPositions)));
  });
});
