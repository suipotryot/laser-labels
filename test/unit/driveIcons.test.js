import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { drawDriveIcon, thinnestDetailPerHeadRadius } from '../../src/icons/driveIcons.js';
import { driveTypes } from '../../src/catalog/driveTypes.js';
import {
  FLOATING_POINT_TOLERANCE,
  contoursOf,
  cornersOf,
  isAlmostEqual,
  onCurvePointsOf,
  windingOf,
} from './helpers/geometry.js';

const PIN_MAXIMUM_RADIUS = 0.3;
const HEAD_RADIUS = 1;
const CURVE_SAMPLES = 1000;

function recessOf(driveTypeKey) {
  const [, ...recessContours] = contoursOf(drawDriveIcon(driveTypeKey));
  return recessContours;
}

function sizeOf(contour) {
  const xs = cornersOf(contour).map((corner) => corner.x);
  const ys = cornersOf(contour).map((corner) => corner.y);
  return { width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
}

function distanceFromCenter({ x, y }) {
  return Math.hypot(x, y);
}

function distanceBetween(from, to) {
  return Math.hypot(to.x - from.x, to.y - from.y);
}

function isUnchangedByQuarterTurn(corners) {
  const quarterTurned = corners.map(({ x, y }) => ({ x: -y, y: x }));
  return quarterTurned.every((turned) => corners.some((corner) => distanceBetween(corner, turned) < FLOATING_POINT_TOLERANCE));
}

function isTipCorner(corner, corners) {
  return distanceFromCenter(corner) > Math.max(...corners.map(distanceFromCenter)) / 2;
}

function nearestOf(corner, candidates) {
  return candidates
    .filter((candidate) => candidate !== corner)
    .reduce((nearest, candidate) => (distanceBetween(corner, candidate) < distanceBetween(corner, nearest) ? candidate : nearest));
}

function armTipsOf(corners) {
  const tipCorners = corners.filter((corner) => isTipCorner(corner, corners));
  return tipCorners.map((corner) => {
    const otherSideOfTheTip = nearestOf(corner, tipCorners);
    return {
      width: distanceBetween(corner, otherSideOfTheTip),
      center: { x: (corner.x + otherSideOfTheTip.x) / 2, y: (corner.y + otherSideOfTheTip.y) / 2 },
    };
  });
}

function rootWidthOf(corners) {
  const rootCorners = corners.filter((corner) => !isTipCorner(corner, corners));
  return Math.min(...rootCorners.map((corner) => distanceBetween(corner, nearestOf(corner, rootCorners))));
}

function pointOnQuadraticCurve(start, { x1, y1, x, y }, progress) {
  const remaining = 1 - progress;
  return {
    x: remaining * remaining * start.x + 2 * remaining * progress * x1 + progress * progress * x,
    y: remaining * remaining * start.y + 2 * remaining * progress * y1 + progress * progress * y,
  };
}

function sampledPointsOf(contour) {
  const points = onCurvePointsOf(contour);
  return points.slice(1).flatMap((curve, index) => Array.from(
    { length: CURVE_SAMPLES },
    (_, sample) => pointOnQuadraticCurve(points[index], curve, sample / CURVE_SAMPLES),
  ));
}

function rimAroundCorners(contour) {
  return HEAD_RADIUS - Math.max(...cornersOf(contour).map(distanceFromCenter));
}

function rimAroundCurves(contour) {
  return HEAD_RADIUS - Math.max(...sampledPointsOf(contour).map(distanceFromCenter));
}

function isOnDiagonal({ x, y }) {
  return isAlmostEqual(Math.abs(x), Math.abs(y));
}

function isOnAxis({ x, y }) {
  return isAlmostEqual(x, 0) || isAlmostEqual(y, 0);
}

describe('drawDriveIcon', () => {
  it('should draw an icon for every drive type of the catalog', () => {
    for (const { key } of driveTypes) {
      assert.ok(drawDriveIcon(key).length > 0, `no icon for ${key}`);
    }
  });

  it('should refuse a drive type it cannot draw', () => {
    assert.throws(() => drawDriveIcon('triangle'), /No icon for drive type: triangle/);
  });

  it('should refuse a name inherited by every object rather than a drive type', () => {
    assert.throws(() => drawDriveIcon('constructor'), /No icon for drive type: constructor/);
  });

  it('should wind the recess opposite to the head so that it stays hollow once filled', () => {
    for (const { key } of driveTypes) {
      const [head, recess] = contoursOf(drawDriveIcon(key));
      assert.notEqual(windingOf(recess), windingOf(head), `${key} recess winds like the head`);
    }
  });

  it('should wind the pin of a tamper resistant Torx like the head so that it stays solid once filled', () => {
    const [head, , pin] = contoursOf(drawDriveIcon('torxTamperResistant'));

    assert.equal(windingOf(pin), windingOf(head));
  });

  it('should keep every icon within the unit circle of the head', () => {
    for (const { key } of driveTypes) {
      for (const point of onCurvePointsOf(drawDriveIcon(key))) {
        assert.ok(distanceFromCenter(point) <= 1 + FLOATING_POINT_TOLERANCE, `${key} goes past the head`);
      }
    }
  });

  it('should tell every drive type apart', () => {
    const drawings = driveTypes.map(({ key }) => JSON.stringify(drawDriveIcon(key)));

    assert.equal(new Set(drawings).size, driveTypes.length);
  });

  it('should draw a single long and thin slot for a slotted drive', () => {
    const recess = recessOf('slotted');

    assert.equal(recess.length, 1);
    assert.equal(cornersOf(recess[0]).length, 4);
    const { width, height } = sizeOf(recess[0]);
    assert.ok(width > 4 * height, `slot of ${width} by ${height} is not thin`);
  });

  it('should draw a single square recess for a square drive', () => {
    const recess = recessOf('square');

    assert.equal(recess.length, 1);
    assert.equal(cornersOf(recess[0]).length, 4);
    const { width, height } = sizeOf(recess[0]);
    assert.equal(width, height);
  });

  it('should draw a single regular hexagon for a hex socket drive', () => {
    const recess = recessOf('hexSocket');

    assert.equal(recess.length, 1);
    const corners = cornersOf(recess[0]);
    assert.equal(corners.length, 6);
    for (const corner of corners) {
      assert.ok(isAlmostEqual(distanceFromCenter(corner), distanceFromCenter(corners[0])));
    }
  });

  it('should draw a single four armed cross with arms narrowing to their tip for a Phillips drive', () => {
    const recess = recessOf('phillips');

    assert.equal(recess.length, 1);
    const corners = cornersOf(recess[0]);
    assert.equal(corners.length, 12);
    assert.ok(isUnchangedByQuarterTurn(corners));
    for (const tip of armTipsOf(corners)) {
      assert.ok(tip.width < rootWidthOf(corners), 'arms do not narrow to their tip');
    }
  });

  it('should draw a single contour joining a straight cross and a thinner diagonal cross for a Pozidriv drive', () => {
    const recess = recessOf('pozidriv');

    assert.equal(recess.length, 1);
    const corners = cornersOf(recess[0]);
    assert.ok(isUnchangedByQuarterTurn(corners));
    const tips = armTipsOf(corners);
    const widestTip = Math.max(...tips.map(({ width }) => width));
    const straightArmTips = tips.filter(({ width }) => isAlmostEqual(width, widestTip));
    const diagonalArmTips = tips.filter(({ width }) => width < widestTip);
    assert.equal(straightArmTips.length + diagonalArmTips.length, 2 * 8);
    assert.ok(straightArmTips.every(({ center }) => isOnAxis(center)), 'the wide cross is not straight');
    assert.ok(diagonalArmTips.every(({ center }) => isOnDiagonal(center)), 'the thin cross is not diagonal');
  });

  it('should draw a single star with six rounded lobes for a Torx drive', () => {
    const recess = recessOf('torx');

    assert.equal(recess.length, 1);
    const [start, ...curves] = onCurvePointsOf(recess[0]);
    assert.equal(start.type, 'M');
    assert.ok(curves.every((command) => command.type === 'Q'), 'lobes are not rounded');
    const controlDistances = curves.map(({ x1, y1 }) => Math.hypot(x1, y1));
    const lobeTips = controlDistances.filter((distance) => isAlmostEqual(distance, Math.max(...controlDistances)));
    assert.equal(lobeTips.length, 6);
  });

  it('should draw the Torx star with a central pin for a tamper resistant Torx drive', () => {
    const [star, pin, ...others] = recessOf('torxTamperResistant');

    assert.deepEqual(star, recessOf('torx')[0]);
    assert.ok(onCurvePointsOf(pin).every((point) => distanceFromCenter(point) < PIN_MAXIMUM_RADIUS), 'pin is not central');
    assert.equal(others.length, 0);
  });
});

describe('thinnestDetailPerHeadRadius', () => {
  it('should give the width of the thin diagonal arms of a Pozidriv drive', () => {
    const armWidths = armTipsOf(cornersOf(recessOf('pozidriv')[0])).map(({ width }) => width);

    assert.ok(isAlmostEqual(thinnestDetailPerHeadRadius('pozidriv'), Math.min(...armWidths)));
  });

  it('should give the rim of head left around the lobes of a Torx drive', () => {
    const [star] = recessOf('torx');

    assert.ok(isAlmostEqual(thinnestDetailPerHeadRadius('torx'), rimAroundCurves(star)));
  });

  it('should give the width of the arm tips of a Phillips drive', () => {
    const armWidths = armTipsOf(cornersOf(recessOf('phillips')[0])).map(({ width }) => width);

    assert.ok(isAlmostEqual(thinnestDetailPerHeadRadius('phillips'), Math.min(...armWidths)));
  });

  it('should give the narrower of the rim and the pin of a tamper resistant Torx drive', () => {
    const [star, pin] = recessOf('torxTamperResistant');
    const pinDiameter = 2 * Math.max(...onCurvePointsOf(pin).map(distanceFromCenter));

    assert.ok(isAlmostEqual(thinnestDetailPerHeadRadius('torxTamperResistant'), Math.min(rimAroundCurves(star), pinDiameter)));
  });

  it('should give the rim of head left around the recess of a hex socket and of a square drive', () => {
    for (const key of ['hexSocket', 'square']) {
      assert.ok(isAlmostEqual(thinnestDetailPerHeadRadius(key), rimAroundCorners(recessOf(key)[0])), key);
    }
  });

  it('should give the width of the slot of a slotted drive', () => {
    const [slot] = recessOf('slotted');

    assert.ok(isAlmostEqual(thinnestDetailPerHeadRadius('slotted'), Math.min(sizeOf(slot).height, rimAroundCorners(slot))));
  });

  it('should give a thinnest detail thinner than the head radius for every drive type of the catalog', () => {
    for (const { key } of driveTypes) {
      const thinnestDetail = thinnestDetailPerHeadRadius(key);
      assert.ok(thinnestDetail > 0 && thinnestDetail < HEAD_RADIUS, `${key} has a thinnest detail of ${thinnestDetail}`);
    }
  });
});
