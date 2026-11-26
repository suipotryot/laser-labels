import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { drawUsageIcon, thinnestUsageIconDetail } from '../../src/icons/usageIcons.js';
import { usageTypes } from '../../src/catalog/usageTypes.js';
import { contoursOf, cornersOf, extentOf, isAlmostEqual, onCurvePointsOf, windingOf } from './helpers/geometry.js';

const UNIT_HALF_SIZE = 1;
const MORTAR_GAP = 0.1;

function widthOfIcon(usageKey) {
  const { left, right } = extentOfIcon(usageKey);
  return right - left;
}

function bricksOfMasonry() {
  return contoursOf(drawUsageIcon('masonry')).map((brick) => extentOf(onCurvePointsOf(brick)));
}

function overlapsOrTouches(first, second) {
  return first.left <= second.right && second.left <= first.right && first.top <= second.bottom && second.top <= first.bottom;
}

function extentOfIcon(usageKey) {
  return extentOf(drawUsageIcon(usageKey).filter(({ type }) => type !== 'Z'));
}

describe('drawUsageIcon', () => {
  it('should close every contour of every usage of the catalog', () => {
    for (const { key } of usageTypes) {
      assert.ok(contoursOf(drawUsageIcon(key)).every((contour) => contour.at(-1).type === 'Z'), `${key} has an open contour`);
    }
  });

  it('should draw every usage of the catalog as filled contours only, so that Line and Fill engrave the same shape', () => {
    for (const { key } of usageTypes) {
      const windings = contoursOf(drawUsageIcon(key)).map(windingOf);
      assert.ok(windings.every((winding) => winding === windings[0]), `${key} has a hole or an overlapping contour`);
    }
  });

  it('should draw every usage of the catalog as tall as the unit square, centered on it', () => {
    for (const { key } of usageTypes) {
      const extent = extentOfIcon(key);
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

  it('should draw the metal as the section of an I-beam, with twelve corners', () => {
    const [section, ...others] = contoursOf(drawUsageIcon('metal'));

    assert.equal(others.length, 0);
    assert.equal(cornersOf(section).length, 12);
  });

  it('should draw the metal section narrower than it is tall, with flanges as wide as four web thicknesses', () => {
    const [section] = contoursOf(drawUsageIcon('metal'));

    const webEdges = cornersOf(section).map(({ x }) => x).filter((x) => Math.abs(x) < UNIT_HALF_SIZE / 2);
    const webThickness = Math.max(...webEdges) - Math.min(...webEdges);
    assert.ok(isAlmostEqual(widthOfIcon('metal'), 4 * webThickness), 'the flanges are not four web thicknesses wide');
    assert.ok(widthOfIcon('metal') < 2 * UNIT_HALF_SIZE, 'the section is not narrower than it is tall');
  });

  it('should draw the outdoor usage as a water drop, pointed at the top and round at the bottom', () => {
    const [drop, ...others] = contoursOf(drawUsageIcon('outdoor'));

    assert.equal(others.length, 0);
    assert.ok(drop.some(({ type }) => type === 'C'), 'the bottom of the drop is not round');
    const extent = extentOfIcon('outdoor');
    const topPoints = onCurvePointsOf(drop).filter(({ y }) => isAlmostEqual(y, extent.top));
    assert.equal(topPoints.length, 1, 'the drop is not pointed at the top');
    assert.ok(isAlmostEqual(topPoints[0].x, 0), 'the point of the drop is not above its middle');
  });

  it('should join the tip of the drop to its round bottom by straight sides tangent to the bottom', () => {
    const [drop] = contoursOf(drawUsageIcon('outdoor'));

    const bulbRadius = widthOfIcon('outdoor') / 2;
    const bulbCenter = { x: 0, y: UNIT_HALF_SIZE - bulbRadius };
    const [tip, tangentPoint] = onCurvePointsOf(drop);
    const sideDirection = { x: tangentPoint.x - tip.x, y: tangentPoint.y - tip.y };
    const radiusDirection = { x: tangentPoint.x - bulbCenter.x, y: tangentPoint.y - bulbCenter.y };
    assert.ok(tangentPoint.x > 0, 'the first side is not on the right of the tip');
    assert.ok(isAlmostEqual(Math.hypot(radiusDirection.x, radiusDirection.y), bulbRadius), 'the side does not end on the round bottom');
    assert.ok(isAlmostEqual(sideDirection.x * radiusDirection.x + sideDirection.y * radiusDirection.y, 0), 'the side is not tangent to the round bottom');
  });

  it('should draw the masonry as five bricks laid in two staggered rows', () => {
    const bricks = contoursOf(drawUsageIcon('masonry'));

    assert.equal(bricks.length, 5);
    assert.ok(bricks.every((brick) => cornersOf(brick).length === 4), 'a brick is not a rectangle');
  });

  it('should leave the same gap of mortar around every brick of the masonry', () => {
    const bricks = bricksOfMasonry();

    for (const [index, brick] of bricks.entries()) {
      for (const other of bricks.slice(index + 1)) {
        assert.ok(!overlapsOrTouches(brick, other), 'two bricks touch each other');
      }
    }
    const [topLeft, topRight, bottomLeft, bottomMiddle, bottomRight] = bricks;
    assert.ok(isAlmostEqual(topRight.left - topLeft.right, MORTAR_GAP), 'the top bricks are not a mortar gap apart');
    assert.ok(isAlmostEqual(bottomMiddle.left - bottomLeft.right, MORTAR_GAP), 'the left bottom bricks are not a mortar gap apart');
    assert.ok(isAlmostEqual(bottomRight.left - bottomMiddle.right, MORTAR_GAP), 'the right bottom bricks are not a mortar gap apart');
    assert.ok(isAlmostEqual(bottomLeft.top - topLeft.bottom, MORTAR_GAP), 'the rows are not a mortar gap apart');
  });

  it('should stagger the joints of the second row of bricks of the masonry', () => {
    const [topLeft, topRight, bottomLeft, bottomMiddle] = bricksOfMasonry();

    const topJoint = (topLeft.right + topRight.left) / 2;
    const bottomJoint = (bottomLeft.right + bottomMiddle.left) / 2;
    assert.ok(Math.abs(bottomJoint - topJoint) > 4 * MORTAR_GAP, 'the joints of the two rows are aligned');
  });
});

describe('thinnestUsageIconDetail', () => {
  it('should give a positive detail, in unit square halves, for every usage of the catalog', () => {
    for (const { key } of usageTypes) {
      const thinnestDetail = thinnestUsageIconDetail(key);
      assert.ok(Number.isFinite(thinnestDetail) && thinnestDetail > 0, `no thinnest detail for ${key}`);
    }
  });

  it('should give the gap between the bricks for the masonry, as it is thinner than the bricks', () => {
    assert.ok(isAlmostEqual(thinnestUsageIconDetail('masonry'), MORTAR_GAP));
  });

  it('should give the width of the round bottom for the water drop', () => {
    assert.ok(isAlmostEqual(thinnestUsageIconDetail('outdoor'), widthOfIcon('outdoor')));
  });

  it('should give the thickness of the web of the I-beam for the metal', () => {
    const [section] = contoursOf(drawUsageIcon('metal'));
    const webEdges = cornersOf(section).map(({ x }) => x).filter((x) => Math.abs(x) < UNIT_HALF_SIZE / 2);

    assert.ok(isAlmostEqual(thinnestUsageIconDetail('metal'), Math.max(...webEdges) - Math.min(...webEdges)));
  });
});
