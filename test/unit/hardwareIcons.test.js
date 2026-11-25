import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { aspectRatioOfHardwareIcon, drawHardwareIcon, isHardwareDrawingPending, thinnestHardwareDetail } from '../../src/icons/hardwareIcons.js';
import { hardwareTypes } from '../../src/catalog/hardwareTypes.js';
import { contoursOf, cornersOf, extentOf, isAlmostEqual, onCurvePointsOf, windingOf } from './helpers/geometry.js';

const DRAWN_HARDWARE = ['screw', 'nail', 'bolt', 'nut'];

function cornersAt(corners, x) {
  return corners.filter((corner) => isAlmostEqual(corner.x, x));
}

function shankStartOf(points) {
  const shankRadius = Math.min(...points.filter(({ y }) => y < 0).map(({ y }) => -y));
  return Math.min(...points.filter(({ y }) => isAlmostEqual(y, -shankRadius)).map(({ x }) => x));
}

function strokesOf(commands) {
  return contoursOf(commands).map((stroke) => stroke.map(({ x, y }) => ({ x, y })));
}

function directionChangesAlong(corners, edgeIsTop) {
  const edge = corners
    .filter(({ y }) => (edgeIsTop ? y < 0 : y > 0))
    .sort((first, second) => first.x - second.x);
  return edge.slice(1, -1).filter((corner, index) => {
    const previous = edge[index];
    const next = edge[index + 2];
    return (corner.y - previous.y) * (next.y - corner.y) < 0;
  }).length;
}

describe('drawHardwareIcon', () => {
  it('should draw an outline for the screw, the nail, the bolt and the nut', () => {
    for (const key of DRAWN_HARDWARE) {
      assert.ok(drawHardwareIcon(key).outline.length > 0, `no outline for ${key}`);
    }
  });

  it('should close every contour of the outlines and leave every stroke open', () => {
    for (const key of DRAWN_HARDWARE) {
      const { outline, strokes } = drawHardwareIcon(key);
      assert.ok(contoursOf(outline).every((contour) => contour.at(-1).type === 'Z'), `${key} has an open outline`);
      assert.ok(strokes.every(({ type }) => type !== 'Z'), `${key} has a closed stroke`);
    }
  });

  it('should refuse a hardware type it cannot draw', () => {
    assert.throws(() => drawHardwareIcon('spaceship'), /No icon for hardware type: spaceship/);
  });

  it('should refuse a name inherited by every object rather than a hardware type', () => {
    assert.throws(() => drawHardwareIcon('constructor'), /No icon for hardware type: constructor/);
  });

  it('should draw a screw lying with its head on the left, straight edges, a pointed tip and diagonal threads crossing its edges', () => {
    const { outline, strokes } = drawHardwareIcon('screw');

    const [contour, ...others] = contoursOf(outline);
    assert.equal(others.length, 0);
    const corners = cornersOf(contour);
    const extent = extentOf(corners);
    assert.ok(extent.right - extent.left > 3 * (extent.bottom - extent.top), 'the screw is not lying');
    const headCorners = cornersAt(corners, extent.left);
    assert.deepEqual(extentOf(headCorners).top, extent.top);
    assert.deepEqual(extentOf(headCorners).bottom, extent.bottom);
    const tip = cornersAt(corners, extent.right);
    assert.equal(tip.length, 1);
    assert.ok(isAlmostEqual(tip[0].y, 0), 'the tip is not on the axis');
    assert.equal(directionChangesAlong(corners, true), 0, 'the top edge is not straight');
    const shankRadius = Math.min(...corners.filter(({ y }) => y < 0).map(({ y }) => -y));
    const threads = strokesOf(strokes).filter(([start, end]) => !isAlmostEqual(start.x, end.x));
    assert.ok(threads.length > 5, 'no thread strokes');
    for (const [start, end] of threads) {
      assert.ok(Math.abs(start.y) > shankRadius && Math.abs(end.y) > shankRadius, 'a thread stroke does not cross the edges');
    }
  });

  it('should draw a line across the shank where the head of the screw ends', () => {
    const { outline, strokes } = drawHardwareIcon('screw');

    const corners = cornersOf(contoursOf(outline)[0]);
    const shankCorners = corners.filter(({ y }) => y < 0 && !isAlmostEqual(y, extentOf(corners).top));
    const headEnd = Math.min(...shankCorners.map(({ x }) => x));
    const shankRadius = -shankCorners[0].y;
    const lineAtHeadEnd = strokesOf(strokes).find(([start, end]) => isAlmostEqual(start.x, headEnd) && isAlmostEqual(end.x, headEnd));
    assert.ok(lineAtHeadEnd, 'no line where the head ends');
    assert.ok(isAlmostEqual(Math.abs(lineAtHeadEnd[1].y - lineAtHeadEnd[0].y), 2 * shankRadius), 'the line does not span exactly the shank');
  });

  it('should draw a nail lying with a flat thin head on the left and a pointed tip', () => {
    const { outline } = drawHardwareIcon('nail');

    const [contour, ...others] = contoursOf(outline);
    assert.equal(others.length, 0);
    const points = onCurvePointsOf(contour);
    const extent = extentOf(points);
    const length = extent.right - extent.left;
    assert.ok(length > 3 * (extent.bottom - extent.top), 'the nail is not lying');
    const headPoints = points.filter(({ y }) => isAlmostEqual(y, extent.top) || isAlmostEqual(y, extent.bottom));
    assert.ok(extentOf(headPoints).right - extent.left < length / 10, 'the head is not thin');
    const tip = cornersAt(points, extent.right);
    assert.equal(tip.length, 1);
    assert.ok(isAlmostEqual(tip[0].y, 0), 'the tip is not on the axis');
  });

  it('should draw a line across the shank where the head of the nail ends', () => {
    const { outline, strokes } = drawHardwareIcon('nail');

    const points = onCurvePointsOf(contoursOf(outline)[0]);
    const shankRadius = Math.min(...points.filter(({ y }) => y < 0).map(({ y }) => -y));
    const headEnd = shankStartOf(points);
    const lineAtHeadEnd = strokesOf(strokes).find(([start, end]) => isAlmostEqual(start.x, headEnd) && isAlmostEqual(end.x, headEnd));
    assert.ok(lineAtHeadEnd, 'no line where the head ends');
    assert.ok(isAlmostEqual(Math.abs(lineAtHeadEnd[1].y - lineAtHeadEnd[0].y), 2 * shankRadius), 'the line does not span exactly the shank');
  });

  it('should round the four corners of the nail head', () => {
    const { outline } = drawHardwareIcon('nail');

    const contour = contoursOf(outline)[0];
    const extent = extentOf(onCurvePointsOf(contour));
    const roundedHeadCorners = contour.filter(({ type, y1 }) => type === 'Q' && (isAlmostEqual(y1, extent.top) || isAlmostEqual(y1, extent.bottom)));
    assert.equal(roundedHeadCorners.length, 4);
  });

  it('should draw a curved bevel in the shape of a V inside the tip of the nail', () => {
    const { outline, strokes } = drawHardwareIcon('nail');

    const points = onCurvePointsOf(contoursOf(outline)[0]);
    const tipEnd = extentOf(points).right;
    const shankRadius = Math.min(...points.filter(({ y }) => y < 0).map(({ y }) => -y));
    const bevel = contoursOf(strokes).find((stroke) => stroke.some(({ type }) => type === 'Q'));
    assert.ok(bevel, 'no curved bevel');
    const [start, ...rest] = bevel;
    const end = rest.at(-1);
    const pointOfTheV = rest.find(({ y }) => isAlmostEqual(y, 0));
    assert.ok(isAlmostEqual(start.y, -shankRadius) && isAlmostEqual(end.y, shankRadius), 'the bevel does not start and end on the edges');
    assert.ok(pointOfTheV && pointOfTheV.x > start.x && pointOfTheV.x < tipEnd, 'the bevel does not point towards the tip');
  });

  it('should draw six short notches on one side of the first third of the nail shank', () => {
    const { outline, strokes } = drawHardwareIcon('nail');

    const points = onCurvePointsOf(contoursOf(outline)[0]);
    const shankRadius = Math.min(...points.filter(({ y }) => y < 0).map(({ y }) => -y));
    const headEnd = shankStartOf(points);
    const shankEnd = Math.max(...points.filter(({ y }) => isAlmostEqual(y, -shankRadius)).map(({ x }) => x));
    const firstThirdEnd = headEnd + (shankEnd - headEnd) / 3;
    const straightStrokes = strokesOf(strokes).filter((stroke) => stroke.length === 2);
    const notches = straightStrokes.filter(([start, end]) => isAlmostEqual(start.y, -shankRadius) && end.y > start.y && end.y < shankRadius);
    assert.equal(notches.length, 6);
    assert.ok(notches.every(([start]) => start.x > headEnd && start.x < firstThirdEnd), 'a notch is outside the first third of the shank');
  });

  it('should draw a bolt lying with a hexagonal head on the left, a flat end and straight threads along all its shank', () => {
    const { outline, strokes } = drawHardwareIcon('bolt');

    const [contour, ...others] = contoursOf(outline);
    assert.equal(others.length, 0);
    const corners = cornersOf(contour);
    const extent = extentOf(corners);
    const length = extent.right - extent.left;
    assert.ok(length > 3 * (extent.bottom - extent.top), 'the bolt is not lying');
    const tallestCorners = corners.filter(({ y }) => isAlmostEqual(y, extent.top));
    assert.ok(tallestCorners.every(({ x }) => x < extent.left + length / 4), 'something else than the head is as tall');
    assert.equal(cornersAt(corners, extent.right).length, 2, 'the end is not flat');
    const headEnd = Math.max(...tallestCorners.map(({ x }) => x));
    const verticalStrokes = strokesOf(strokes).filter(([start, end]) => isAlmostEqual(start.x, end.x));
    const shankRadius = Math.abs(cornersAt(corners, headEnd).find(({ y }) => !isAlmostEqual(y, extent.top) && y < 0).y);
    const spanOf = ([start, end]) => Math.abs(end.y - start.y);
    const lineBetweenHeadAndShank = verticalStrokes.find(([start]) => isAlmostEqual(start.x, headEnd));
    assert.ok(lineBetweenHeadAndShank, 'no line between the head and the shank');
    assert.ok(isAlmostEqual(spanOf(lineBetweenHeadAndShank), 2 * shankRadius), 'the line between head and shank goes over the outline');
    assert.ok(verticalStrokes.some((stroke) => stroke[0].x < headEnd && isAlmostEqual(spanOf(stroke), extent.bottom - extent.top)), 'no line at the chamfered corner of the head');
    const threads = verticalStrokes.filter(([start]) => start.x > headEnd);
    assert.ok(threads.every(([start, end]) => Math.abs(start.y) > shankRadius && Math.abs(end.y) > shankRadius), 'threads do not cross the edges');
    assert.ok(Math.min(...threads.map(([start]) => start.x)) < headEnd + length / 10, 'threads do not start near the head');
    assert.ok(Math.max(...threads.map(([start]) => start.x)) > extent.right - length / 10, 'threads do not reach the end');
  });

  it('should draw a nut seen from the front as a hexagon with a hollow round hole, without strokes', () => {
    const { outline, strokes } = drawHardwareIcon('nut');

    const [hexagon, hole, ...others] = contoursOf(outline);
    assert.equal(others.length, 0);
    assert.equal(cornersOf(hexagon).length, 6);
    assert.ok(hole.some(({ type }) => type === 'C'), 'the hole is not round');
    assert.notEqual(windingOf(hole), windingOf(hexagon), 'the hole would be filled');
    assert.equal(strokes.length, 0);
  });
});

describe('isHardwareDrawingPending', () => {
  it('should tell apart every hardware type of the catalog that still waits for its drawing from the drawn ones', () => {
    for (const { key } of hardwareTypes) {
      if (isHardwareDrawingPending(key)) {
        assert.throws(() => drawHardwareIcon(key), `${key} is drawn but still listed as pending`);
      } else {
        assert.doesNotThrow(() => drawHardwareIcon(key), `${key} has no drawing and is not listed as pending`);
      }
    }
  });
});

describe('thinnestHardwareDetail', () => {
  it('should give the thickness of the head of a nail', () => {
    const points = onCurvePointsOf(contoursOf(drawHardwareIcon('nail').outline)[0]);
    const extent = extentOf(points);

    assert.ok(isAlmostEqual(thinnestHardwareDetail('nail'), shankStartOf(points) - extent.left));
  });

  it('should give the width of the chamfer of the head of a bolt', () => {
    const corners = cornersOf(contoursOf(drawHardwareIcon('bolt').outline)[0]);
    const extent = extentOf(corners);
    const chamferEnd = Math.min(...corners.filter(({ y }) => isAlmostEqual(y, extent.top)).map(({ x }) => x));

    assert.ok(isAlmostEqual(thinnestHardwareDetail('bolt'), chamferEnd - extent.left));
  });
});

describe('aspectRatioOfHardwareIcon', () => {
  it('should give the width over the height of the lying drawing, strokes included', () => {
    for (const key of DRAWN_HARDWARE) {
      const { outline, strokes } = drawHardwareIcon(key);
      const extent = extentOf([...outline, ...strokes]);

      assert.ok(isAlmostEqual(aspectRatioOfHardwareIcon(key), (extent.right - extent.left) / (extent.bottom - extent.top)), key);
    }
  });
});
