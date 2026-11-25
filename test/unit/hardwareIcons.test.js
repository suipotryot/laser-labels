import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { drawHardwareIcon } from '../../src/icons/hardwareIcons.js';

const DRAWN_HARDWARE = ['screw', 'nail', 'bolt', 'nut'];
const FLOATING_POINT_TOLERANCE = 1e-9;

function contoursOf(commands) {
  const contours = [];
  for (const command of commands) {
    if (command.type === 'M') {
      contours.push([]);
    }
    contours.at(-1).push(command);
  }
  return contours;
}

function cornersOf(contour) {
  return contour.filter((command) => command.type === 'M' || command.type === 'L');
}

function extentOf(points) {
  const xs = points.map(({ x }) => x);
  const ys = points.map(({ y }) => y);
  return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
}

function isAlmostEqual(actual, expected) {
  return Math.abs(actual - expected) < FLOATING_POINT_TOLERANCE;
}

function cornersAt(corners, x) {
  return corners.filter((corner) => isAlmostEqual(corner.x, x));
}

function windingOf(contour) {
  const points = contour.filter((command) => command.type !== 'Z');
  const signedArea = points.reduce((area, point, index) => {
    const next = points[(index + 1) % points.length];
    return area + (point.x * next.y - next.x * point.y) / 2;
  }, 0);
  return signedArea > 0 ? 'clockwise' : 'counterclockwise';
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

  it('should draw a screw lying with its head on the left, a pointed tip, a sawtooth thread and thread strokes', () => {
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
    assert.ok(directionChangesAlong(corners, true) > 10, 'no sawtooth thread along the top edge');
    assert.ok(strokes.length > 0, 'no thread strokes');
    assert.ok(strokes.every((command) => command.type !== 'Z'), 'thread strokes are closed');
  });

  it('should draw a nail lying with a flat thin head on the left and a pointed tip, without strokes', () => {
    const { outline, strokes } = drawHardwareIcon('nail');

    const [contour, ...others] = contoursOf(outline);
    assert.equal(others.length, 0);
    const corners = cornersOf(contour);
    const extent = extentOf(corners);
    const length = extent.right - extent.left;
    assert.ok(length > 3 * (extent.bottom - extent.top), 'the nail is not lying');
    const headCorners = corners.filter(({ y }) => isAlmostEqual(y, extent.top) || isAlmostEqual(y, extent.bottom));
    assert.ok(extentOf(headCorners).right - extent.left < length / 10, 'the head is not thin');
    const tip = cornersAt(corners, extent.right);
    assert.equal(tip.length, 1);
    assert.ok(isAlmostEqual(tip[0].y, 0), 'the tip is not on the axis');
    assert.equal(strokes.length, 0);
  });

  it('should draw a bolt lying with its head on the left, a nut along its shank, a flat end and straight thread strokes', () => {
    const { outline, strokes } = drawHardwareIcon('bolt');

    const [contour, ...others] = contoursOf(outline);
    assert.equal(others.length, 0);
    const corners = cornersOf(contour);
    const extent = extentOf(corners);
    const length = extent.right - extent.left;
    assert.ok(length > 3 * (extent.bottom - extent.top), 'the bolt is not lying');
    const tallestCorners = corners.filter(({ y }) => isAlmostEqual(y, extent.top));
    assert.ok(tallestCorners.some(({ x }) => x < extent.left + length / 4), 'no head on the left');
    assert.ok(tallestCorners.some(({ x }) => x > extent.left + length / 2), 'no nut along the shank');
    assert.equal(cornersAt(corners, extent.right).length, 2, 'the end is not flat');
    const straightThreads = strokesOf(strokes).filter(([start, end]) => isAlmostEqual(start.x, end.x));
    assert.ok(straightThreads.length > 5, 'no straight thread strokes');
  });

  it('should draw a nut seen from the front as a hexagon with a hollow round hole and an open thread arc', () => {
    const { outline, strokes } = drawHardwareIcon('nut');

    const [hexagon, hole, ...others] = contoursOf(outline);
    assert.equal(others.length, 0);
    assert.equal(cornersOf(hexagon).length, 6);
    assert.ok(hole.some(({ type }) => type === 'C'), 'the hole is not round');
    assert.notEqual(windingOf(hole), windingOf(hexagon), 'the hole would be filled');
    assert.ok(strokes.length > 0, 'no thread arc');
    assert.ok(strokes.every((command) => command.type !== 'Z'), 'the thread arc is closed');
  });
});
