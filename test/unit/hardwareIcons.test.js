import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { aspectRatioOfHardwareIcon, drawHardwareIcon, thinnestHardwareDetail } from '../../src/icons/hardwareIcons.js';
import { hardwareTypes } from '../../src/catalog/hardwareTypes.js';
import { contoursOf, cornersOf, extentOf, isAlmostEqual, onCurvePointsOf, windingOf } from './helpers/geometry.js';

const HARDWARE_SEEN_FROM_THE_FRONT = ['nut', 'washer'];
const HARDWARE_WITH_HOLES = ['nut', 'washer', 'eyeScrew', 'mollyAnchor'];

function silhouetteOf(hardwareTypeKey) {
  const { outline, strokes } = drawHardwareIcon(hardwareTypeKey);
  const [body, ...holes] = contoursOf(outline);
  const points = onCurvePointsOf(body);
  return { body, holes, points, corners: cornersOf(body), extent: extentOf(points), strokes: contoursOf(strokes) };
}

function lengthOf(extent) {
  return extent.right - extent.left;
}

function heightOf(extent) {
  return extent.bottom - extent.top;
}

function halfHeightOf(extent) {
  return heightOf(extent) / 2;
}

function fractionAlong(extent, fraction) {
  return extent.left + lengthOf(extent) * fraction;
}

function isLying(extent) {
  return lengthOf(extent) > 3 * heightOf(extent);
}

function pointsAt(points, x) {
  return points.filter((point) => isAlmostEqual(point.x, x));
}

function isAboveAxis({ y }) {
  return y < 0 && !isAlmostEqual(y, 0);
}

function distanceFromAxisOf({ y }) {
  return Math.abs(y);
}

function tallestPointsOf({ points, extent }) {
  return points.filter(({ y }) => isAlmostEqual(y, extent.top));
}

function tallestSpanOf(silhouette) {
  const { left, right } = extentOf(tallestPointsOf(silhouette));
  return { start: left, end: right };
}

function hasPointedTipOnAxis({ points, extent }) {
  const tip = pointsAt(points, extent.right);
  return tip.length === 1 && isAlmostEqual(tip[0].y, 0);
}

function hasFlatEnd({ points, extent }) {
  return pointsAt(points, extent.right).length === 2;
}

function hasFlatStart({ points, extent }) {
  return pointsAt(points, extent.left).length === 2;
}

function shankRadiusOf(points) {
  return Math.min(...points.filter(isAboveAxis).map(distanceFromAxisOf));
}

function shankEdgeOf(points) {
  const shankRadius = shankRadiusOf(points);
  return extentOf(points.filter(({ y }) => isAlmostEqual(y, -shankRadius)));
}

function shankStartOf(points) {
  return shankEdgeOf(points).left;
}

function distinctValues(values) {
  return values.filter((value, index) => !values.slice(0, index).some((earlier) => isAlmostEqual(earlier, value)));
}

function sortedDistinctValues(values) {
  return distinctValues(values).sort((first, second) => first - second);
}

function smallestGapBetween(sortedValues) {
  return Math.min(...sortedValues.slice(1).map((value, index) => value - sortedValues[index]));
}

function stepsAlongTopEdge(points) {
  const topEdge = points.filter(isAboveAxis);
  return sortedDistinctValues(topEdge.map(({ x }) => x))
    .map((x) => ({ x, distances: distinctValues(pointsAt(topEdge, x).map(distanceFromAxisOf)) }))
    .filter(({ distances }) => distances.length >= 2)
    .map(({ x, distances }) => ({ x, narrowerRadius: Math.min(...distances), stepHeight: Math.max(...distances) - Math.min(...distances) }));
}

function firstStepAlongTopEdge(points) {
  return stepsAlongTopEdge(points)[0];
}

function isAtOrBefore(x, limit) {
  return x < limit || isAlmostEqual(x, limit);
}

function isStrictlyBetween(value, low, high) {
  return value > low && value < high && !isAlmostEqual(value, low) && !isAlmostEqual(value, high);
}

function anchorBoltPartsOf(anchorBolt) {
  const shankRadius = firstStepAlongTopEdge(anchorBolt.points).narrowerRadius;
  const washer = tallestSpanOf(anchorBolt);
  const isNutPoint = (point) => isAboveAxis(point)
    && isAtOrBefore(point.x, washer.start)
    && isStrictlyBetween(distanceFromAxisOf(point), shankRadius, halfHeightOf(anchorBolt.extent));
  const nut = extentOf(anchorBolt.points.filter(isNutPoint));
  const isClipPoint = (point) => isAboveAxis(point) && point.x > washer.end && distanceFromAxisOf(point) > shankRadius && point.x < anchorBolt.extent.right;
  const clip = extentOf(anchorBolt.points.filter(isClipPoint));
  return {
    shankRadius,
    washer,
    nut: { start: nut.left, end: nut.right, radius: -nut.top },
    clip: { start: clip.left, end: clip.right },
  };
}

function threadsOfAnchorBolt(anchorBolt) {
  const { shankRadius, nut } = anchorBoltPartsOf(anchorBolt);
  const isShorterThanTheNut = (stroke) => verticalSpanOf(stroke) < 2 * nut.radius;
  return anchorBolt.strokes.filter((stroke) => isVertical(stroke) && crossesEdges(stroke, shankRadius) && isShorterThanTheNut(stroke));
}

function isStraight(stroke) {
  return stroke.length === 2;
}

function isVertical(stroke) {
  return isStraight(stroke) && isAlmostEqual(stroke[0].x, stroke[1].x);
}

function isHorizontal(stroke) {
  return isStraight(stroke) && isAlmostEqual(stroke[0].y, stroke[1].y);
}

function isDiagonal(stroke) {
  return isStraight(stroke) && !isVertical(stroke) && !isHorizontal(stroke);
}

function verticalSpanOf([start, end]) {
  return Math.abs(end.y - start.y);
}

function verticalLineAt(strokes, x) {
  return strokes.find((stroke) => isVertical(stroke) && isAlmostEqual(stroke[0].x, x));
}

function crossesEdges([start, end], shankRadius) {
  return Math.abs(start.y) > shankRadius && Math.abs(end.y) > shankRadius;
}

function directionChangesAlongTopEdge(corners) {
  const edge = corners.filter(isAboveAxis).sort((first, second) => first.x - second.x);
  return edge.slice(1, -1).filter((corner, index) => {
    const previous = edge[index];
    const next = edge[index + 2];
    return (corner.y - previous.y) * (next.y - corner.y) < 0;
  }).length;
}

function distanceFromAxisAlong([from, to], x) {
  const progress = (x - from.x) / (to.x - from.x);
  return distanceFromAxisOf(from) + (distanceFromAxisOf(to) - distanceFromAxisOf(from)) * progress;
}

function gapBetweenParallelStrokes(first, second) {
  const direction = { x: first[1].x - first[0].x, y: first[1].y - first[0].y };
  const length = Math.hypot(direction.x, direction.y);
  const offset = { x: second[0].x - first[0].x, y: second[0].y - first[0].y };
  return Math.abs(offset.x * direction.y - offset.y * direction.x) / length;
}

function thinnestDetailOfThreadedShank({ points, strokes }) {
  const [firstThread, secondThread] = strokes.filter(isDiagonal);
  return Math.min(gapBetweenParallelStrokes(firstThread, secondThread), 2 * shankRadiusOf(points));
}

function collarEndOf(wallPlug) {
  return firstStepAlongTopEdge(wallPlug.points).x;
}

function coneThreadsOf(molly) {
  return molly.strokes.filter((stroke) => isVertical(stroke) && stroke[0].x > fractionAlong(molly.extent, 7 / 8));
}

describe('drawHardwareIcon', () => {
  it('should draw an outline for every hardware type of the catalog', () => {
    for (const { key } of hardwareTypes) {
      assert.ok(drawHardwareIcon(key).outline.length > 0, `no outline for ${key}`);
    }
  });

  it('should draw every hardware type of the catalog lying, except those seen from the front', () => {
    for (const { key } of hardwareTypes.filter(({ key }) => !HARDWARE_SEEN_FROM_THE_FRONT.includes(key))) {
      assert.ok(isLying(silhouetteOf(key).extent), `${key} is not lying`);
    }
  });

  it('should close every contour of the outlines and leave every stroke open', () => {
    for (const { key } of hardwareTypes) {
      const { outline, strokes } = drawHardwareIcon(key);
      assert.ok(contoursOf(outline).every((contour) => contour.at(-1).type === 'Z'), `${key} has an open outline`);
      assert.ok(strokes.every(({ type }) => type !== 'Z'), `${key} has a closed stroke`);
    }
  });

  it('should draw every hardware type of the catalog without holes in a single contour', () => {
    for (const { key } of hardwareTypes.filter(({ key }) => !HARDWARE_WITH_HOLES.includes(key))) {
      assert.equal(contoursOf(drawHardwareIcon(key).outline).length, 1, `${key} is not drawn in a single contour`);
    }
  });

  it('should refuse a hardware type it cannot draw', () => {
    assert.throws(() => drawHardwareIcon('spaceship'), /No icon for hardware type: spaceship/);
  });

  it('should refuse a name inherited by every object rather than a hardware type', () => {
    assert.throws(() => drawHardwareIcon('constructor'), /No icon for hardware type: constructor/);
  });

  it('should draw a screw with its head as tall as the drawing on the left and a pointed tip', () => {
    const screw = silhouetteOf('screw');

    const head = extentOf(pointsAt(screw.corners, screw.extent.left));
    assert.equal(head.top, screw.extent.top);
    assert.equal(head.bottom, screw.extent.bottom);
    assert.ok(hasPointedTipOnAxis(screw), 'the tip is not pointed on the axis');
  });

  it('should draw a screw with straight edges and diagonal threads crossing them', () => {
    const screw = silhouetteOf('screw');

    assert.equal(directionChangesAlongTopEdge(screw.corners), 0, 'the top edge is not straight');
    const threads = screw.strokes.filter(isDiagonal);
    assert.ok(threads.length > 5, 'no thread strokes');
    assert.ok(threads.every((thread) => crossesEdges(thread, shankRadiusOf(screw.points))), 'a thread does not cross the edges');
  });

  it('should draw a line across the shank where the head of the screw ends', () => {
    const screw = silhouetteOf('screw');

    const lineAtHeadEnd = verticalLineAt(screw.strokes, shankStartOf(screw.points));
    assert.ok(lineAtHeadEnd, 'no line where the head ends');
    assert.ok(isAlmostEqual(verticalSpanOf(lineAtHeadEnd), 2 * shankRadiusOf(screw.points)), 'the line does not span exactly the shank');
  });

  it('should draw a nail with a flat thin head on the left and a pointed tip', () => {
    const nail = silhouetteOf('nail');

    assert.ok(extentOf(tallestPointsOf(nail)).right < fractionAlong(nail.extent, 1 / 10), 'the head is not thin');
    assert.ok(hasPointedTipOnAxis(nail), 'the tip is not pointed on the axis');
  });

  it('should draw a line across the shank where the head of the nail ends', () => {
    const nail = silhouetteOf('nail');

    const lineAtHeadEnd = verticalLineAt(nail.strokes, shankStartOf(nail.points));
    assert.ok(lineAtHeadEnd, 'no line where the head ends');
    assert.ok(isAlmostEqual(verticalSpanOf(lineAtHeadEnd), 2 * shankRadiusOf(nail.points)), 'the line does not span exactly the shank');
  });

  it('should round the four corners of the nail head', () => {
    const nail = silhouetteOf('nail');

    const isOnTheHeadSide = (y) => isAlmostEqual(y, nail.extent.top) || isAlmostEqual(y, nail.extent.bottom);
    const roundedHeadCorners = nail.body.filter(({ type, y1 }) => type === 'Q' && isOnTheHeadSide(y1));
    assert.equal(roundedHeadCorners.length, 4);
  });

  it('should draw a curved bevel in the shape of a V inside the tip of the nail', () => {
    const nail = silhouetteOf('nail');

    const shankRadius = shankRadiusOf(nail.points);
    const bevel = nail.strokes.find((stroke) => stroke.some(({ type }) => type === 'Q'));
    assert.ok(bevel, 'no curved bevel');
    const [start, ...rest] = bevel;
    const pointOfTheV = rest.find(({ y }) => isAlmostEqual(y, 0));
    assert.ok(isAlmostEqual(start.y, -shankRadius) && isAlmostEqual(rest.at(-1).y, shankRadius), 'the bevel does not start and end on the edges');
    assert.ok(pointOfTheV && pointOfTheV.x > start.x && pointOfTheV.x < nail.extent.right, 'the bevel does not point towards the tip');
  });

  it('should draw six short notches on one side of the first third of the nail shank', () => {
    const nail = silhouetteOf('nail');

    const shankRadius = shankRadiusOf(nail.points);
    const { left: headEnd, right: shankEnd } = shankEdgeOf(nail.points);
    const firstThirdEnd = headEnd + (shankEnd - headEnd) / 3;
    const notches = nail.strokes.filter((stroke) => isVertical(stroke) && isAlmostEqual(stroke[0].y, -shankRadius) && verticalSpanOf(stroke) < 2 * shankRadius);
    assert.equal(notches.length, 6);
    assert.ok(notches.every(([start]) => start.x > headEnd && start.x < firstThirdEnd), 'a notch is outside the first third of the shank');
  });

  it('should draw a bolt with only its hexagonal head as tall as the drawing and a flat end', () => {
    const bolt = silhouetteOf('bolt');

    assert.ok(tallestPointsOf(bolt).every(({ x }) => x < fractionAlong(bolt.extent, 1 / 4)), 'something else than the head is as tall');
    assert.ok(hasFlatEnd(bolt), 'the end is not flat');
  });

  it('should draw a line at the chamfered corner of the bolt head and another across the shank where the head ends', () => {
    const bolt = silhouetteOf('bolt');

    const { x: headEnd, narrowerRadius: shankRadius } = firstStepAlongTopEdge(bolt.corners);
    const lineAtHeadEnd = verticalLineAt(bolt.strokes, headEnd);
    assert.ok(lineAtHeadEnd, 'no line between the head and the shank');
    assert.ok(isAlmostEqual(verticalSpanOf(lineAtHeadEnd), 2 * shankRadius), 'the line between head and shank goes over the outline');
    const chamferLine = bolt.strokes.find((stroke) => isVertical(stroke) && stroke[0].x < headEnd && isAlmostEqual(verticalSpanOf(stroke), heightOf(bolt.extent)));
    assert.ok(chamferLine, 'no line at the chamfered corner of the head');
  });

  it('should draw straight threads crossing the edges along the whole bolt shank', () => {
    const bolt = silhouetteOf('bolt');

    const { x: headEnd, narrowerRadius: shankRadius } = firstStepAlongTopEdge(bolt.corners);
    const threads = bolt.strokes.filter((stroke) => isVertical(stroke) && stroke[0].x > headEnd);
    const threadSpan = extentOf(threads.flat());
    assert.ok(threads.every((thread) => crossesEdges(thread, shankRadius)), 'threads do not cross the edges');
    assert.ok(threadSpan.left < headEnd + lengthOf(bolt.extent) / 10, 'threads do not start near the head');
    assert.ok(threadSpan.right > fractionAlong(bolt.extent, 9 / 10), 'threads do not reach the end');
  });

  it('should draw an eye screw with a round hollow eye on the left and a pointed tip', () => {
    const eyeScrew = silhouetteOf('eyeScrew');

    const [eyeHole, ...others] = eyeScrew.holes;
    assert.equal(others.length, 0);
    assert.notEqual(windingOf(eyeHole), windingOf(eyeScrew.body), 'the eye would be filled');
    assert.ok(eyeScrew.body.some(({ type }) => type === 'C'), 'the eye is not round');
    assert.ok(extentOf(onCurvePointsOf(eyeHole)).right < fractionAlong(eyeScrew.extent, 1 / 3), 'the eye is not on the left');
    assert.ok(hasPointedTipOnAxis(eyeScrew), 'the tip is not pointed on the axis');
  });

  it('should draw diagonal threads on the shank of the eye screw', () => {
    assert.ok(silhouetteOf('eyeScrew').strokes.filter(isDiagonal).length > 5, 'no diagonal threads');
  });

  it('should draw a screw hook in a single contour with a round loop rising above a pointed shank', () => {
    const hook = silhouetteOf('hook');

    assert.equal(hook.holes.length, 0);
    assert.ok(hook.body.some(({ type }) => type === 'C'), 'the hook is not curved');
    assert.ok(hook.extent.top < -3 * shankRadiusOf(hook.points), 'the hook does not rise above the shank');
    assert.ok(!hook.body.some(({ type, y }) => type === 'L' && y < -2 * shankRadiusOf(hook.points)), 'the hook has a straight part');
    assert.ok(hasPointedTipOnAxis(hook), 'the tip is not pointed on the axis');
  });

  it('should center the screw hook shank between the top and the bottom of its loop', () => {
    const hook = silhouetteOf('hook');

    assert.ok(isAlmostEqual(hook.extent.top, -hook.extent.bottom), 'the shank is not centered on the loop');
  });

  it('should put a collar and then the threads on the screw hook shank, clear of the loop', () => {
    const hook = silhouetteOf('hook');

    const shankRadius = shankRadiusOf(hook.points);
    assert.ok(hook.points.some(({ y }) => y > shankRadius * 1.2), 'no collar before the threads');
    const loopEnd = extentOf(hook.points.filter(({ y }) => y < -2 * shankRadius)).right;
    const threads = hook.strokes.filter(isDiagonal);
    assert.ok(threads.length > 5, 'no diagonal threads');
    assert.ok(extentOf(threads.flat()).left > loopEnd, 'the threads run under the loop');
  });

  it('should draw a wall plug with a collar on the left, small fins and a rounded end', () => {
    const wallPlug = silhouetteOf('wallPlug');

    assert.ok(extentOf(tallestPointsOf(wallPlug)).right < fractionAlong(wallPlug.extent, 1 / 10), 'no collar on the left');
    assert.ok(directionChangesAlongTopEdge(wallPlug.corners) > 6, 'no fins along the edges');
    assert.ok(wallPlug.body.some(({ type, x1 }) => type === 'Q' && x1 > fractionAlong(wallPlug.extent, 9 / 10)), 'the end is not rounded');
  });

  it('should draw a ladder along the axis of the wall plug', () => {
    const wallPlug = silhouetteOf('wallPlug');

    const nearAxis = heightOf(wallPlug.extent) / 4;
    const rails = wallPlug.strokes.filter((stroke) => isHorizontal(stroke) && lengthOf(extentOf(stroke)) > lengthOf(wallPlug.extent) / 2);
    const rungs = wallPlug.strokes.filter((stroke) => isVertical(stroke) && stroke.every(({ y }) => Math.abs(y) < nearAxis));
    assert.equal(rails.length, 2, 'no two rails along the axis');
    assert.ok(rungs.length > 4, 'no rungs between the rails');
  });

  it('should draw two anti-rotation wings spreading towards the collar of the wall plug', () => {
    const wallPlug = silhouetteOf('wallPlug');

    const wings = wallPlug.strokes.filter(isDiagonal);
    assert.equal(wings.length, 2);
    for (const [root, tip] of wings) {
      assert.ok(tip.x < root.x && tip.x > collarEndOf(wallPlug), 'a wing does not point towards the collar');
      assert.ok(Math.abs(tip.y) > Math.abs(root.y), 'a wing does not spread out');
    }
  });

  it('should draw a line across the wall plug body where the collar ends', () => {
    const wallPlug = silhouetteOf('wallPlug');

    assert.ok(verticalLineAt(wallPlug.strokes, collarEndOf(wallPlug)), 'no line where the collar ends');
  });

  it('should draw a Molly anchor with a head, then a flange as tall as the drawing with two spikes, and a flat end', () => {
    const molly = silhouetteOf('mollyAnchor');

    const flange = tallestSpanOf(molly);
    assert.ok(flange.end < fractionAlong(molly.extent, 1 / 6), 'no flange on the left');
    assert.ok(flange.start > molly.extent.left, 'no head before the flange');
    const isNearTheFlange = (x) => x > flange.end && x < fractionAlong(molly.extent, 1 / 4);
    const spikeTips = molly.points.filter(({ x, y }) => isNearTheFlange(x) && Math.abs(y) > heightOf(molly.extent) / 3);
    assert.ok(spikeTips.length >= 2, 'no spikes on the flange');
    assert.ok(hasFlatEnd(molly), 'the end is not flat');
  });

  it('should split the Molly anchor sleeve into three strips with two hollow slots', () => {
    const molly = silhouetteOf('mollyAnchor');

    assert.equal(molly.holes.length, 2);
    for (const slot of molly.holes) {
      assert.notEqual(windingOf(slot), windingOf(molly.body), 'a slot would be filled');
      const slotExtent = extentOf(onCurvePointsOf(slot));
      assert.ok(lengthOf(slotExtent) > 5 * heightOf(slotExtent), 'a slot is not long along the sleeve');
    }
  });

  it('should draw threads on the cone ending the Molly anchor', () => {
    assert.ok(coneThreadsOf(silhouetteOf('mollyAnchor')).length >= 2, 'no threads on the cone');
  });

  it('should draw the threads of the Molly anchor cone from edge to edge', () => {
    const molly = silhouetteOf('mollyAnchor');

    const [coneEnd, coneStart] = molly.corners.filter(isAboveAxis).sort((first, second) => second.x - first.x);
    const coneThreads = molly.strokes.filter((stroke) => isVertical(stroke) && stroke[0].x > coneStart.x && stroke[0].x < coneEnd.x);
    assert.ok(coneThreads.length >= 2, 'no threads on the cone');
    for (const thread of coneThreads) {
      const edgeDistanceAtThread = distanceFromAxisAlong([coneStart, coneEnd], thread[0].x);
      assert.ok(isAlmostEqual(verticalSpanOf(thread), 2 * edgeDistanceAtThread), 'a cone thread does not reach the outline');
    }
  });

  it('should draw lines across the Molly anchor where the head meets the flange and where the flange meets the sleeve', () => {
    const molly = silhouetteOf('mollyAnchor');

    const flange = tallestSpanOf(molly);
    const headRadius = Math.max(...molly.points.filter((point) => isAboveAxis(point) && point.x < flange.start).map(distanceFromAxisOf));
    const lineAtFlangeStart = verticalLineAt(molly.strokes, flange.start);
    assert.ok(lineAtFlangeStart, 'no line between the head and the flange');
    assert.ok(isAlmostEqual(verticalSpanOf(lineAtFlangeStart), 2 * headRadius), 'the line does not span exactly the head');
    assert.ok(verticalLineAt(molly.strokes, flange.end), 'no line between the flange and the sleeve');
  });

  it('should draw a threaded rod without head, with flat ends on both sides', () => {
    const rod = silhouetteOf('threadedRod');

    assert.ok(hasFlatEnd(rod), 'the right end is not flat');
    assert.ok(hasFlatStart(rod), 'the left end is not flat');
    const thickestPoints = rod.points.filter((point) => isAlmostEqual(distanceFromAxisOf(point), halfHeightOf(rod.extent)));
    assert.ok(lengthOf(extentOf(thickestPoints)) > 0.9 * lengthOf(rod.extent), 'the rod does not keep its thickness along its length');
  });

  it('should draw straight threads crossing the edges along the whole threaded rod', () => {
    const rod = silhouetteOf('threadedRod');

    const threads = rod.strokes.filter(isVertical);
    const threadSpan = extentOf(threads.flat());
    assert.ok(threads.every((thread) => crossesEdges(thread, halfHeightOf(rod.extent))), 'threads do not cross the edges');
    assert.ok(threadSpan.left < fractionAlong(rod.extent, 1 / 10), 'threads do not start near the left end');
    assert.ok(threadSpan.right > fractionAlong(rod.extent, 9 / 10), 'threads do not reach the right end');
  });

  it('should start and end the threads of the threaded rod on the corners of its chamfers', () => {
    const rod = silhouetteOf('threadedRod');

    const threadSpan = extentOf(rod.strokes.filter(isVertical).flat());
    const fullThickness = tallestSpanOf(rod);
    assert.ok(isAlmostEqual(threadSpan.left, fullThickness.start), 'the threads do not start on the left chamfer corner');
    assert.ok(isAlmostEqual(threadSpan.right, fullThickness.end), 'the threads do not end on the right chamfer corner');
  });

  it('should draw a blind rivet with a thin mandrel on the left, then the flange, then a body wider than the mandrel up to near its flat end', () => {
    const rivet = silhouetteOf('rivet');

    const flange = tallestSpanOf(rivet);
    const mandrelRadius = Math.max(...rivet.points.filter((point) => isAboveAxis(point) && point.x < flange.start).map(distanceFromAxisOf));
    const bodyRadius = stepsAlongTopEdge(rivet.points).find(({ x }) => isAlmostEqual(x, flange.end)).narrowerRadius;
    const bodyEnd = extentOf(rivet.points.filter((point) => isAboveAxis(point) && isAlmostEqual(distanceFromAxisOf(point), bodyRadius))).right;
    assert.ok(flange.start > fractionAlong(rivet.extent, 1 / 4), 'the mandrel is not on the left');
    assert.ok(mandrelRadius < heightOf(rivet.extent) / 4, 'the mandrel is not thin');
    assert.ok(bodyRadius > mandrelRadius && bodyRadius < halfHeightOf(rivet.extent), 'the body is not between the mandrel and the flange');
    assert.ok(bodyEnd > fractionAlong(rivet.extent, 9 / 10), 'the body does not reach near the end');
    assert.ok(hasFlatEnd(rivet), 'the end is not flat');
  });

  it('should draw the mandrel of the blind rivet through its body', () => {
    const rivet = silhouetteOf('rivet');

    const flange = tallestSpanOf(rivet);
    const mandrelLines = rivet.strokes.filter((stroke) => isHorizontal(stroke) && stroke.every(({ x }) => x >= flange.end));
    assert.equal(mandrelLines.length, 2, 'the mandrel does not go through the body');
  });

  it('should draw an anchor bolt with a nut and then a washer, wider than the nut, near its flat left end', () => {
    const anchorBolt = silhouetteOf('anchorBolt');

    const { washer, nut } = anchorBoltPartsOf(anchorBolt);
    assert.ok(washer.end < fractionAlong(anchorBolt.extent, 1 / 3), 'the washer is not near the left end');
    assert.ok(nut.start < washer.start && isAlmostEqual(nut.end, washer.start), 'no nut just before the washer');
    assert.ok(hasFlatStart(anchorBolt), 'the shank does not end flat on the left');
  });

  it('should draw an expansion clip and a cone widening to a flat end on the right of the anchor bolt', () => {
    const anchorBolt = silhouetteOf('anchorBolt');

    const { shankRadius, clip } = anchorBoltPartsOf(anchorBolt);
    const endRadius = halfHeightOf(extentOf(pointsAt(anchorBolt.points, anchorBolt.extent.right)));
    assert.ok(clip.start > fractionAlong(anchorBolt.extent, 2 / 3), 'no expansion clip on the right');
    assert.ok(hasFlatEnd(anchorBolt), 'the end is not flat');
    assert.ok(endRadius > shankRadius, 'the cone does not widen');
  });

  it('should draw threads on the anchor bolt shank on both sides of the nut and washer, not under them', () => {
    const anchorBolt = silhouetteOf('anchorBolt');

    const { nut, washer } = anchorBoltPartsOf(anchorBolt);
    const threads = threadsOfAnchorBolt(anchorBolt);
    const isUnderTheNutOrTheWasher = ([start]) => start.x > nut.start && start.x < washer.end;
    assert.ok(threads.some(([start]) => start.x < nut.start), 'no threads left of the nut');
    assert.ok(threads.some(([start]) => start.x > washer.end), 'no threads right of the washer');
    assert.ok(threads.every((thread) => !isUnderTheNutOrTheWasher(thread)), 'threads run under the nut or the washer');
  });

  it('should draw the face edges of the anchor bolt nut along the nut, between the shank and the nut corners', () => {
    const anchorBolt = silhouetteOf('anchorBolt');

    const { shankRadius, nut } = anchorBoltPartsOf(anchorBolt);
    const faceEdges = anchorBolt.strokes.filter((stroke) => isHorizontal(stroke) && !isAlmostEqual(stroke[0].y, 0));
    assert.equal(faceEdges.length, 2);
    for (const faceEdge of faceEdges) {
      const { left, right } = extentOf(faceEdge);
      assert.ok(isAlmostEqual(left, nut.start) && isAlmostEqual(right, nut.end), 'a face edge does not run along the nut');
      assert.ok(isStrictlyBetween(distanceFromAxisOf(faceEdge[0]), shankRadius, nut.radius), 'a face edge is not between the shank and the corners');
    }
  });

  it('should draw a line across the anchor bolt where the nut meets the washer', () => {
    const anchorBolt = silhouetteOf('anchorBolt');

    const { nut, washer } = anchorBoltPartsOf(anchorBolt);
    const lineAtWasherStart = verticalLineAt(anchorBolt.strokes, washer.start);
    assert.ok(lineAtWasherStart, 'no line between the nut and the washer');
    assert.ok(isAlmostEqual(verticalSpanOf(lineAtWasherStart), 2 * nut.radius), 'the line does not span exactly the nut');
  });

  it('should draw the slit of the anchor bolt expansion clip along its axis', () => {
    const anchorBolt = silhouetteOf('anchorBolt');

    const { clip } = anchorBoltPartsOf(anchorBolt);
    const slit = anchorBolt.strokes.find((stroke) => isHorizontal(stroke) && isAlmostEqual(stroke[0].y, 0));
    assert.ok(slit, 'no slit along the axis');
    assert.ok(isAlmostEqual(extentOf(slit).left, clip.start) && isAlmostEqual(extentOf(slit).right, clip.end), 'the slit does not run along the clip');
  });

  it('should draw a line across the anchor bolt where the expansion clip meets the cone', () => {
    const anchorBolt = silhouetteOf('anchorBolt');

    const { shankRadius, clip } = anchorBoltPartsOf(anchorBolt);
    const lineAtClipEnd = verticalLineAt(anchorBolt.strokes, clip.end);
    assert.ok(lineAtClipEnd, 'no line between the clip and the cone');
    assert.ok(isAlmostEqual(verticalSpanOf(lineAtClipEnd), 2 * shankRadius), 'the line does not span exactly the start of the cone');
  });

  it('should draw a line across the blind rivet where the flange meets the body', () => {
    const rivet = silhouetteOf('rivet');

    const flange = tallestSpanOf(rivet);
    const bodyRadius = stepsAlongTopEdge(rivet.points).find(({ x }) => isAlmostEqual(x, flange.end)).narrowerRadius;
    const lineAtFlangeEnd = verticalLineAt(rivet.strokes, flange.end);
    assert.ok(lineAtFlangeEnd, 'no line between the flange and the body');
    assert.ok(isAlmostEqual(verticalSpanOf(lineAtFlangeEnd), 2 * bodyRadius), 'the line does not span exactly the body');
  });

  it('should draw a line across the blind rivet where the body meets the mandrel head, closing the mandrel lines', () => {
    const rivet = silhouetteOf('rivet');

    const mandrelHeadRadius = halfHeightOf(extentOf(pointsAt(rivet.points, rivet.extent.right)));
    const mandrelLinesEnd = extentOf(rivet.strokes.filter(isHorizontal).flat()).right;
    const lineAtMandrelHead = verticalLineAt(rivet.strokes, mandrelLinesEnd);
    assert.ok(lineAtMandrelHead, 'the mandrel lines end in the void');
    assert.ok(isAlmostEqual(verticalSpanOf(lineAtMandrelHead), 2 * mandrelHeadRadius), 'the line does not span exactly the mandrel head');
  });

  it('should draw a washer seen from the front as a round disc with a hollow round hole, without strokes', () => {
    const { outline, strokes } = drawHardwareIcon('washer');

    const [disc, hole, ...others] = contoursOf(outline);
    assert.equal(others.length, 0);
    for (const contour of [disc, hole]) {
      const extent = extentOf(onCurvePointsOf(contour));
      assert.ok(contour.some(({ type }) => type === 'C'), 'a contour is not round');
      assert.ok(isAlmostEqual(lengthOf(extent), heightOf(extent)), 'a contour is not a circle');
    }
    assert.notEqual(windingOf(hole), windingOf(disc), 'the hole would be filled');
    assert.equal(strokes.length, 0);
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

function firstFinStepOf(wallPlug) {
  return stepsAlongTopEdge(wallPlug.points).find(({ x }) => x > collarEndOf(wallPlug));
}

function finRiseOf(wallPlug) {
  return firstFinStepOf(wallPlug).stepHeight;
}

function shortestFlatBetweenFinsOf(wallPlug) {
  const finCorners = wallPlug.corners.filter((corner) => isAboveAxis(corner) && corner.x >= firstFinStepOf(wallPlug).x);
  return smallestGapBetween(sortedDistinctValues(finCorners.map(({ x }) => x)));
}

function gapBetweenRailsOf(wallPlug) {
  const [firstRail, secondRail] = wallPlug.strokes.filter(isHorizontal);
  return Math.abs(firstRail[0].y - secondRail[0].y);
}

function flangeThicknessOf(molly) {
  const flange = tallestSpanOf(molly);
  return flange.end - flange.start;
}

function slotWidthOf(molly) {
  return heightOf(extentOf(onCurvePointsOf(molly.holes[0])));
}

function coneThreadPitchOf(molly) {
  const [firstConeThread, secondConeThread] = coneThreadsOf(molly);
  return secondConeThread[0].x - firstConeThread[0].x;
}

function narrowestGapAroundSpikesOf(molly) {
  const cornersAtFlangeEnd = pointsAt(molly.corners, tallestSpanOf(molly).end).filter(isAboveAxis);
  return smallestGapBetween(sortedDistinctValues(cornersAtFlangeEnd.map(distanceFromAxisOf)));
}

describe('thinnestHardwareDetail', () => {
  it('should give a positive thinnest detail for every hardware type of the catalog', () => {
    for (const { key } of hardwareTypes) {
      const thinnestDetail = thinnestHardwareDetail(key);
      assert.ok(Number.isFinite(thinnestDetail) && thinnestDetail > 0, `no thinnest detail for ${key}`);
    }
  });

  it('should give the thickness of the head of a nail', () => {
    const nail = silhouetteOf('nail');

    assert.ok(isAlmostEqual(thinnestHardwareDetail('nail'), shankStartOf(nail.points) - nail.extent.left));
  });

  it('should give the width of the chamfer of the head of a bolt', () => {
    const bolt = silhouetteOf('bolt');

    const chamferEnd = extentOf(tallestPointsOf(bolt)).left;
    assert.ok(isAlmostEqual(thinnestHardwareDetail('bolt'), chamferEnd - bolt.extent.left));
  });

  it('should give the gap between the threads, or the shank width if thinner, of a screw', () => {
    assert.ok(isAlmostEqual(thinnestHardwareDetail('screw'), thinnestDetailOfThreadedShank(silhouetteOf('screw'))));
  });

  it('should give the thinnest of the collar step and the threaded shank details of a screw hook', () => {
    const hook = silhouetteOf('hook');

    const collarSteps = stepsAlongTopEdge(hook.points).filter(({ narrowerRadius }) => isAlmostEqual(narrowerRadius, shankRadiusOf(hook.points)));
    const collarStep = Math.min(...collarSteps.map(({ stepHeight }) => stepHeight));
    assert.ok(isAlmostEqual(thinnestHardwareDetail('hook'), Math.min(collarStep, thinnestDetailOfThreadedShank(hook))));
  });

  it('should give the thinnest of the eye ring and the threaded shank details of an eye screw', () => {
    const eyeScrew = silhouetteOf('eyeScrew');

    const eyeRing = extentOf(onCurvePointsOf(eyeScrew.holes[0])).left - eyeScrew.extent.left;
    assert.ok(isAlmostEqual(thinnestHardwareDetail('eyeScrew'), Math.min(eyeRing, thinnestDetailOfThreadedShank(eyeScrew))));
  });

  it('should give the thinnest of the fin rise, the flat between fins and the gap between rails of a wall plug', () => {
    const wallPlug = silhouetteOf('wallPlug');

    const expected = Math.min(finRiseOf(wallPlug), shortestFlatBetweenFinsOf(wallPlug), gapBetweenRailsOf(wallPlug));
    assert.ok(isAlmostEqual(thinnestHardwareDetail('wallPlug'), expected));
  });

  it('should give the thinnest of the flange, the slots, the cone thread pitch and the gaps around the spikes of a Molly anchor', () => {
    const molly = silhouetteOf('mollyAnchor');

    const expected = Math.min(flangeThicknessOf(molly), slotWidthOf(molly), coneThreadPitchOf(molly), narrowestGapAroundSpikesOf(molly));
    assert.ok(isAlmostEqual(thinnestHardwareDetail('mollyAnchor'), expected));
  });

  it('should give the width of the ring of a washer', () => {
    const washer = silhouetteOf('washer');

    const ringWidth = extentOf(onCurvePointsOf(washer.holes[0])).left - washer.extent.left;
    assert.ok(isAlmostEqual(thinnestHardwareDetail('washer'), ringWidth));
  });

  it('should give the width of the chamfers of a threaded rod', () => {
    const rod = silhouetteOf('threadedRod');

    const chamferWidth = tallestSpanOf(rod).start - rod.extent.left;
    assert.ok(isAlmostEqual(thinnestHardwareDetail('threadedRod'), chamferWidth));
  });

  it('should give the thinnest of the flange, the mandrel, the steps of the edge, the mandrel head rim and length of a blind rivet', () => {
    const rivet = silhouetteOf('rivet');

    const flange = tallestSpanOf(rivet);
    const mandrel = rivet.strokes.find(isHorizontal);
    const mandrelRadius = distanceFromAxisOf(mandrel[0]);
    const mandrelHeadRadius = halfHeightOf(extentOf(pointsAt(rivet.points, rivet.extent.right)));
    const mandrelHeadLength = rivet.extent.right - extentOf(mandrel).right;
    const smallestStep = Math.min(...stepsAlongTopEdge(rivet.points).map(({ stepHeight }) => stepHeight));
    const expected = Math.min(
      flange.end - flange.start,
      2 * mandrelRadius,
      smallestStep,
      mandrelHeadRadius - mandrelRadius,
      mandrelHeadLength,
    );
    assert.ok(isAlmostEqual(thinnestHardwareDetail('rivet'), expected));
  });

  it('should give the thinnest of the chamfer, the washer, the thread pitch, the steps of the edge and the gap between nut face edges and shank of an anchor bolt', () => {
    const anchorBolt = silhouetteOf('anchorBolt');

    const { shankRadius, washer } = anchorBoltPartsOf(anchorBolt);
    const shankEdgeStart = extentOf(anchorBolt.points.filter((point) => isAboveAxis(point) && isAlmostEqual(distanceFromAxisOf(point), shankRadius))).left;
    const chamferWidth = shankEdgeStart - anchorBolt.extent.left;
    const [firstThread, secondThread] = threadsOfAnchorBolt(anchorBolt);
    const threadPitch = secondThread[0].x - firstThread[0].x;
    const smallestStep = Math.min(...stepsAlongTopEdge(anchorBolt.points).map(({ stepHeight }) => stepHeight));
    const nutFaceEdge = anchorBolt.strokes.find((stroke) => isHorizontal(stroke) && !isAlmostEqual(stroke[0].y, 0));
    const gapBetweenNutFaceEdgeAndShank = distanceFromAxisOf(nutFaceEdge[0]) - shankRadius;
    const expected = Math.min(chamferWidth, washer.end - washer.start, threadPitch, smallestStep, gapBetweenNutFaceEdgeAndShank);
    assert.ok(isAlmostEqual(thinnestHardwareDetail('anchorBolt'), expected));
  });
});

describe('aspectRatioOfHardwareIcon', () => {
  it('should give the width over the height of the lying drawing, strokes included', () => {
    for (const { key } of hardwareTypes) {
      const { outline, strokes } = drawHardwareIcon(key);
      const extent = extentOf([...outline, ...strokes]);

      assert.ok(isAlmostEqual(aspectRatioOfHardwareIcon(key), lengthOf(extent) / heightOf(extent)), key);
    }
  });
});
