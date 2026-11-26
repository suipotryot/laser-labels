import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { drawUsageIcon, thinnestUsageIconDetail } from '../../src/icons/usageIcons.js';
import { usageTypes } from '../../src/catalog/usageTypes.js';
import { contoursOf, cornersOf, extentOf, isAlmostEqual, onCurvePointsOf, windingOf } from './helpers/geometry.js';

const UNIT_HALF_SIZE = 1;

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

  it('should draw the outdoor usage as a water drop, pointed at the top and round at the bottom', () => {
    const [drop, ...others] = contoursOf(drawUsageIcon('outdoor'));

    assert.equal(others.length, 0);
    assert.ok(drop.some(({ type }) => type === 'C'), 'the bottom of the drop is not round');
    const extent = extentOfIcon('outdoor');
    const topPoints = onCurvePointsOf(drop).filter(({ y }) => isAlmostEqual(y, extent.top));
    assert.equal(topPoints.length, 1, 'the drop is not pointed at the top');
    assert.ok(isAlmostEqual(topPoints[0].x, 0), 'the point of the drop is not above its middle');
  });

  it('should draw the masonry as five bricks laid in two staggered rows', () => {
    const bricks = contoursOf(drawUsageIcon('masonry'));

    assert.equal(bricks.length, 5);
    assert.ok(bricks.every((brick) => cornersOf(brick).length === 4), 'a brick is not a rectangle');
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
    const bricks = contoursOf(drawUsageIcon('masonry')).map((brick) => extentOf(onCurvePointsOf(brick)));
    const [topLeft, topRight] = bricks.filter(({ top }) => isAlmostEqual(top, -UNIT_HALF_SIZE));

    assert.ok(isAlmostEqual(thinnestUsageIconDetail('masonry'), topRight.left - topLeft.right));
  });

  it('should give the thickness of the web of the I-beam for the metal', () => {
    const [section] = contoursOf(drawUsageIcon('metal'));
    const webEdges = cornersOf(section).map(({ x }) => x).filter((x) => Math.abs(x) < UNIT_HALF_SIZE / 2);

    assert.ok(isAlmostEqual(thinnestUsageIconDetail('metal'), Math.max(...webEdges) - Math.min(...webEdges)));
  });
});
