import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { aspectRatioOfHardwareIcon, drawHardwareIcon, thinnestHardwareDetail } from '../../src/icons/hardwareIcons.js';
import { hardwareTypes } from '../../src/catalog/hardwareTypes.js';
import { contoursOf, cornersOf, extentOf, isAlmostEqual, onCurvePointsOf, windingOf } from './helpers/geometry.js';

function silhouetteOf(hardwareTypeKey) {
  const { outline, strokes } = drawHardwareIcon(hardwareTypeKey);
  const [body, ...holes] = contoursOf(outline);
  const points = onCurvePointsOf(body);
  return { body, holes, points, corners: cornersOf(body), extent: extentOf(points), strokes: strokesOf(strokes) };
}

function strokesOf(commands) {
  return contoursOf(commands).map((stroke) => stroke.map(({ x, y }) => ({ x, y })));
}

function lengthOf(extent) {
  return extent.right - extent.left;
}

function heightOf(extent) {
  return extent.bottom - extent.top;
}

function isLying(extent) {
  return lengthOf(extent) > 3 * heightOf(extent);
}

function pointsAt(points, x) {
  return points.filter((point) => isAlmostEqual(point.x, x));
}

function hasPointedTipOnAxis({ points, extent }) {
  const tip = pointsAt(points, extent.right);
  return tip.length === 1 && isAlmostEqual(tip[0].y, 0);
}

function hasFlatEnd({ points, extent }) {
  return pointsAt(points, extent.right).length === 2;
}

function shankRadiusOf(points) {
  const distancesAboveAxis = points.filter(({ y }) => y < 0 && !isAlmostEqual(y, 0)).map(({ y }) => -y);
  return Math.min(...distancesAboveAxis);
}

function shankStartOf(points) {
  const shankRadius = shankRadiusOf(points);
  return Math.min(...points.filter(({ y }) => isAlmostEqual(y, -shankRadius)).map(({ x }) => x));
}

function distinctValues(values) {
  return values.filter((value, index) => !values.slice(0, index).some((earlier) => isAlmostEqual(earlier, value)));
}

function stepsAlongTopEdge(points) {
  const topEdge = points.filter(({ y }) => y < 0 && !isAlmostEqual(y, 0));
  const xs = [...new Set(topEdge.map(({ x }) => x))].sort((first, second) => first - second);
  return xs
    .map((x) => ({ x, radii: distinctValues(pointsAt(topEdge, x).map(({ y }) => -y)) }))
    .filter(({ radii }) => radii.length >= 2)
    .map(({ x, radii }) => ({ x, radiusBefore: Math.max(...radii), radiusAfter: Math.min(...radii) }));
}

function firstStepAlongTopEdge(points) {
  return stepsAlongTopEdge(points)[0];
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
  const edge = corners.filter(({ y }) => y < 0).sort((first, second) => first.x - second.x);
  return edge.slice(1, -1).filter((corner, index) => {
    const previous = edge[index];
    const next = edge[index + 2];
    return (corner.y - previous.y) * (next.y - corner.y) < 0;
  }).length;
}

function gapBetweenParallelStrokes(first, second) {
  const direction = { x: first[1].x - first[0].x, y: first[1].y - first[0].y };
  const length = Math.hypot(direction.x, direction.y);
  const offset = { x: second[0].x - first[0].x, y: second[0].y - first[0].y };
  return Math.abs(offset.x * direction.y - offset.y * direction.x) / length;
}

function thinnestThreadedShankDetailOf({ points, strokes }) {
  const [firstThread, secondThread] = strokes.filter(isDiagonal);
  return Math.min(gapBetweenParallelStrokes(firstThread, secondThread), 2 * shankRadiusOf(points));
}

describe('drawHardwareIcon', () => {
  it('should draw an outline for every hardware type of the catalog', () => {
    for (const { key } of hardwareTypes) {
      assert.ok(drawHardwareIcon(key).outline.length > 0, `no outline for ${key}`);
    }
  });

  it('should draw every hardware type of the catalog lying', () => {
    for (const { key } of hardwareTypes.filter(({ key }) => key !== 'nut')) {
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
    assert.ok(threads.every((thread) => crossesEdges(thread, shankRadiusOf(screw.corners))), 'a thread does not cross the edges');
  });

  it('should draw a line across the shank where the head of the screw ends', () => {
    const screw = silhouetteOf('screw');

    const lineAtHeadEnd = verticalLineAt(screw.strokes, shankStartOf(screw.corners));
    assert.ok(lineAtHeadEnd, 'no line where the head ends');
    assert.ok(isAlmostEqual(verticalSpanOf(lineAtHeadEnd), 2 * shankRadiusOf(screw.corners)), 'the line does not span exactly the shank');
  });

  it('should draw a nail with a flat thin head on the left and a pointed tip', () => {
    const nail = silhouetteOf('nail');

    const headPoints = nail.points.filter(({ y }) => isAlmostEqual(y, nail.extent.top) || isAlmostEqual(y, nail.extent.bottom));
    assert.ok(extentOf(headPoints).right - nail.extent.left < lengthOf(nail.extent) / 10, 'the head is not thin');
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

    const roundedHeadCorners = nail.body.filter(({ type, y1 }) => type === 'Q' && (isAlmostEqual(y1, nail.extent.top) || isAlmostEqual(y1, nail.extent.bottom)));
    assert.equal(roundedHeadCorners.length, 4);
  });

  it('should draw a curved bevel in the shape of a V inside the tip of the nail', () => {
    const nail = silhouetteOf('nail');

    const shankRadius = shankRadiusOf(nail.points);
    const bevel = contoursOf(drawHardwareIcon('nail').strokes).find((stroke) => stroke.some(({ type }) => type === 'Q'));
    assert.ok(bevel, 'no curved bevel');
    const [start, ...rest] = bevel;
    const pointOfTheV = rest.find(({ y }) => isAlmostEqual(y, 0));
    assert.ok(isAlmostEqual(start.y, -shankRadius) && isAlmostEqual(rest.at(-1).y, shankRadius), 'the bevel does not start and end on the edges');
    assert.ok(pointOfTheV && pointOfTheV.x > start.x && pointOfTheV.x < nail.extent.right, 'the bevel does not point towards the tip');
  });

  it('should draw six short notches on one side of the first third of the nail shank', () => {
    const nail = silhouetteOf('nail');

    const shankRadius = shankRadiusOf(nail.points);
    const headEnd = shankStartOf(nail.points);
    const shankEnd = Math.max(...nail.points.filter(({ y }) => isAlmostEqual(y, -shankRadius)).map(({ x }) => x));
    const firstThirdEnd = headEnd + (shankEnd - headEnd) / 3;
    const notches = nail.strokes.filter((stroke) => isVertical(stroke) && isAlmostEqual(stroke[0].y, -shankRadius) && verticalSpanOf(stroke) < 2 * shankRadius);
    assert.equal(notches.length, 6);
    assert.ok(notches.every(([start]) => start.x > headEnd && start.x < firstThirdEnd), 'a notch is outside the first third of the shank');
  });

  it('should draw a bolt with only its hexagonal head as tall as the drawing and a flat end', () => {
    const bolt = silhouetteOf('bolt');

    const tallestCorners = bolt.corners.filter(({ y }) => isAlmostEqual(y, bolt.extent.top));
    assert.ok(tallestCorners.every(({ x }) => x < bolt.extent.left + lengthOf(bolt.extent) / 4), 'something else than the head is as tall');
    assert.ok(hasFlatEnd(bolt), 'the end is not flat');
  });

  it('should draw a line at the chamfered corner of the bolt head and another across the shank where the head ends', () => {
    const bolt = silhouetteOf('bolt');

    const { x: headEnd, radiusAfter: shankRadius } = firstStepAlongTopEdge(bolt.corners);
    const lineAtHeadEnd = verticalLineAt(bolt.strokes, headEnd);
    assert.ok(lineAtHeadEnd, 'no line between the head and the shank');
    assert.ok(isAlmostEqual(verticalSpanOf(lineAtHeadEnd), 2 * shankRadius), 'the line between head and shank goes over the outline');
    const chamferLine = bolt.strokes.find((stroke) => isVertical(stroke) && stroke[0].x < headEnd && isAlmostEqual(verticalSpanOf(stroke), heightOf(bolt.extent)));
    assert.ok(chamferLine, 'no line at the chamfered corner of the head');
  });

  it('should draw straight threads crossing the edges along the whole bolt shank', () => {
    const bolt = silhouetteOf('bolt');

    const { x: headEnd, radiusAfter: shankRadius } = firstStepAlongTopEdge(bolt.corners);
    const threads = bolt.strokes.filter((stroke) => isVertical(stroke) && stroke[0].x > headEnd);
    assert.ok(threads.every((thread) => crossesEdges(thread, shankRadius)), 'threads do not cross the edges');
    assert.ok(Math.min(...threads.map(([start]) => start.x)) < headEnd + lengthOf(bolt.extent) / 10, 'threads do not start near the head');
    assert.ok(Math.max(...threads.map(([start]) => start.x)) > bolt.extent.right - lengthOf(bolt.extent) / 10, 'threads do not reach the end');
  });

  it('should draw an eye screw with a round hollow eye on the left and a pointed tip', () => {
    const eyeScrew = silhouetteOf('eyeScrew');

    const [eyeHole, ...others] = eyeScrew.holes;
    assert.equal(others.length, 0);
    assert.notEqual(windingOf(eyeHole), windingOf(eyeScrew.body), 'the eye would be filled');
    assert.ok(eyeScrew.body.some(({ type }) => type === 'C'), 'the eye is not round');
    assert.ok(extentOf(onCurvePointsOf(eyeHole)).right < eyeScrew.extent.left + lengthOf(eyeScrew.extent) / 3, 'the eye is not on the left');
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
    const loopEnd = Math.max(...hook.points.filter(({ y }) => y < -2 * shankRadius).map(({ x }) => x));
    const threads = hook.strokes.filter(isDiagonal);
    assert.ok(threads.length > 5, 'no diagonal threads');
    assert.ok(Math.min(...threads.map(([start]) => start.x)) > loopEnd, 'the threads run under the loop');
  });

  it('should draw a wall plug with a collar on the left, small fins and a rounded end', () => {
    const wallPlug = silhouetteOf('wallPlug');

    const collarPoints = wallPlug.points.filter(({ y }) => isAlmostEqual(y, wallPlug.extent.top));
    assert.ok(Math.max(...collarPoints.map(({ x }) => x)) < wallPlug.extent.left + lengthOf(wallPlug.extent) / 10, 'no collar on the left');
    assert.ok(directionChangesAlongTopEdge(wallPlug.corners) > 6, 'no fins along the edges');
    const lastTenth = wallPlug.extent.right - lengthOf(wallPlug.extent) / 10;
    assert.ok(wallPlug.body.some(({ type, x1 }) => type === 'Q' && x1 > lastTenth), 'the end is not rounded');
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

    const collarEnd = firstStepAlongTopEdge(wallPlug.points).x;
    const wings = wallPlug.strokes.filter(isDiagonal);
    assert.equal(wings.length, 2);
    for (const [root, tip] of wings) {
      assert.ok(tip.x < root.x && tip.x > collarEnd, 'a wing does not point towards the collar');
      assert.ok(Math.abs(tip.y) > Math.abs(root.y), 'a wing does not spread out');
    }
  });

  it('should draw a line across the wall plug body where the collar ends', () => {
    const wallPlug = silhouetteOf('wallPlug');

    const collarEnd = firstStepAlongTopEdge(wallPlug.points).x;
    assert.ok(verticalLineAt(wallPlug.strokes, collarEnd), 'no line where the collar ends');
  });

  it('should draw a Molly anchor with a head, then a flange as tall as the drawing with two spikes, and a flat end', () => {
    const molly = silhouetteOf('mollyAnchor');

    const flangePoints = molly.points.filter(({ y }) => isAlmostEqual(y, molly.extent.top));
    const flangeEnd = Math.max(...flangePoints.map(({ x }) => x));
    assert.ok(flangeEnd < molly.extent.left + lengthOf(molly.extent) / 6, 'no flange on the left');
    assert.ok(Math.min(...flangePoints.map(({ x }) => x)) > molly.extent.left, 'no head before the flange');
    const spikeTips = molly.points.filter(({ x, y }) => x > flangeEnd && Math.abs(y) > heightOf(molly.extent) / 3 && x < molly.extent.left + lengthOf(molly.extent) / 4);
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
    const molly = silhouetteOf('mollyAnchor');

    const lastEighth = molly.extent.right - lengthOf(molly.extent) / 8;
    assert.ok(molly.strokes.filter((stroke) => isVertical(stroke) && stroke[0].x > lastEighth).length >= 2, 'no threads on the cone');
  });

  it('should draw the threads of the Molly anchor cone from edge to edge', () => {
    const molly = silhouetteOf('mollyAnchor');

    const coneTop = molly.corners.filter(({ y }) => y < 0).sort((first, second) => second.x - first.x).slice(0, 2);
    const [coneEnd, coneStart] = coneTop;
    const coneRadiusAt = (x) => -(coneStart.y + ((coneEnd.y - coneStart.y) * (x - coneStart.x)) / (coneEnd.x - coneStart.x));
    const coneThreads = molly.strokes.filter((stroke) => isVertical(stroke) && stroke[0].x > coneStart.x && stroke[0].x < coneEnd.x);
    assert.ok(coneThreads.length >= 2, 'no threads on the cone');
    for (const thread of coneThreads) {
      assert.ok(isAlmostEqual(verticalSpanOf(thread), 2 * coneRadiusAt(thread[0].x)), 'a cone thread does not reach the outline');
    }
  });

  it('should draw lines across the Molly anchor where the head meets the flange and where the flange meets the sleeve', () => {
    const molly = silhouetteOf('mollyAnchor');

    const flangePoints = molly.points.filter(({ y }) => isAlmostEqual(y, molly.extent.top));
    const flangeStart = Math.min(...flangePoints.map(({ x }) => x));
    const flangeEnd = Math.max(...flangePoints.map(({ x }) => x));
    const headRadius = Math.max(...molly.points.filter(({ x, y }) => y < 0 && x < flangeStart).map(({ y }) => -y));
    const lineAtFlangeStart = verticalLineAt(molly.strokes, flangeStart);
    assert.ok(lineAtFlangeStart, 'no line between the head and the flange');
    assert.ok(isAlmostEqual(verticalSpanOf(lineAtFlangeStart), 2 * headRadius), 'the line does not span exactly the head');
    assert.ok(verticalLineAt(molly.strokes, flangeEnd), 'no line between the flange and the sleeve');
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

describe('thinnestHardwareDetail', () => {
  it('should give the thickness of the head of a nail', () => {
    const nail = silhouetteOf('nail');

    assert.ok(isAlmostEqual(thinnestHardwareDetail('nail'), shankStartOf(nail.points) - nail.extent.left));
  });

  it('should give the width of the chamfer of the head of a bolt', () => {
    const bolt = silhouetteOf('bolt');

    const chamferEnd = Math.min(...bolt.corners.filter(({ y }) => isAlmostEqual(y, bolt.extent.top)).map(({ x }) => x));
    assert.ok(isAlmostEqual(thinnestHardwareDetail('bolt'), chamferEnd - bolt.extent.left));
  });

  it('should give the gap between the threads, or the shank width if thinner, of a screw', () => {
    assert.ok(isAlmostEqual(thinnestHardwareDetail('screw'), thinnestThreadedShankDetailOf(silhouetteOf('screw'))));
  });

  it('should give the thinnest of the collar step and the threaded shank details of a screw hook', () => {
    const hook = silhouetteOf('hook');

    const collarStep = Math.min(...stepsAlongTopEdge(hook.points).map(({ radiusBefore, radiusAfter }) => radiusBefore - radiusAfter));
    assert.ok(isAlmostEqual(thinnestHardwareDetail('hook'), Math.min(collarStep, thinnestThreadedShankDetailOf(hook))));
  });

  it('should give the thinnest of the eye ring and the threaded shank details of an eye screw', () => {
    const eyeScrew = silhouetteOf('eyeScrew');

    const eyeRing = extentOf(onCurvePointsOf(eyeScrew.holes[0])).left - eyeScrew.extent.left;
    assert.ok(isAlmostEqual(thinnestHardwareDetail('eyeScrew'), Math.min(eyeRing, thinnestThreadedShankDetailOf(eyeScrew))));
  });

  it('should give the thinnest of the fin rise, the flat between fins and the gap between rails of a wall plug', () => {
    const wallPlug = silhouetteOf('wallPlug');

    const [, firstFin] = stepsAlongTopEdge(wallPlug.points);
    const finRise = firstFin.radiusBefore - firstFin.radiusAfter;
    const finCornerXs = [...new Set(wallPlug.corners.filter(({ x, y }) => y < 0 && x >= firstFin.x).map(({ x }) => x))].sort((first, second) => first - second);
    const shortestSpanBetweenFinCorners = Math.min(...finCornerXs.slice(1).map((x, index) => x - finCornerXs[index]));
    const rails = wallPlug.strokes.filter(isHorizontal);
    const gapBetweenRails = Math.abs(rails[0][0].y - rails[1][0].y);
    assert.ok(isAlmostEqual(thinnestHardwareDetail('wallPlug'), Math.min(finRise, shortestSpanBetweenFinCorners, gapBetweenRails)));
  });

  it('should give the thinnest of the flange, the slots and the cone thread pitch of a Molly anchor', () => {
    const molly = silhouetteOf('mollyAnchor');

    const flangePoints = molly.points.filter(({ y }) => isAlmostEqual(y, molly.extent.top));
    const flangeThickness = Math.max(...flangePoints.map(({ x }) => x)) - Math.min(...flangePoints.map(({ x }) => x));
    const slotWidth = heightOf(extentOf(onCurvePointsOf(molly.holes[0])));
    const lastEighth = molly.extent.right - lengthOf(molly.extent) / 8;
    const [firstConeThread, secondConeThread] = molly.strokes.filter((stroke) => isVertical(stroke) && stroke[0].x > lastEighth);
    const coneThreadPitch = secondConeThread[0].x - firstConeThread[0].x;
    const flangeEnd = Math.max(...flangePoints.map(({ x }) => x));
    const radiiAtFlangeEnd = pointsAt(molly.corners, flangeEnd).filter(({ y }) => y < 0).map(({ y }) => -y).sort((first, second) => first - second);
    const narrowestGapAroundSpike = Math.min(...radiiAtFlangeEnd.slice(1).map((radius, index) => radius - radiiAtFlangeEnd[index]));
    assert.ok(isAlmostEqual(thinnestHardwareDetail('mollyAnchor'), Math.min(flangeThickness, slotWidth, coneThreadPitch, narrowestGapAroundSpike)));
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
