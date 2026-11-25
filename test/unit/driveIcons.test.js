import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { drawDriveIcon } from '../../src/icons/driveIcons.js';
import { driveTypes } from '../../src/catalog/driveTypes.js';

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

function recessOf(driveTypeKey) {
  const [, ...recessContours] = contoursOf(drawDriveIcon(driveTypeKey));
  return recessContours;
}

function cornersOf(contour) {
  return contour.filter((command) => command.type === 'M' || command.type === 'L');
}

function sizeOf(contour) {
  const xs = cornersOf(contour).map((corner) => corner.x);
  const ys = cornersOf(contour).map((corner) => corner.y);
  return { width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
}

function signedAreaOf(contour) {
  const points = contour.filter((command) => command.type !== 'Z');
  return points.reduce((area, point, index) => {
    const next = points[(index + 1) % points.length];
    return area + (point.x * next.y - next.x * point.y) / 2;
  }, 0);
}

function midpointOf(from, to) {
  return { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
}

function isUnchangedByQuarterTurn(corners) {
  const quarterTurned = corners.map(({ x, y }) => ({ x: -y, y: x }));
  return quarterTurned.every((turned) => corners.some(({ x, y }) => Math.hypot(x - turned.x, y - turned.y) < 1e-9));
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

  it('should wind the recess opposite to the head so that it stays hollow once filled', () => {
    for (const { key } of driveTypes) {
      const [head, ...recess] = contoursOf(drawDriveIcon(key));
      const recessWithoutPin = key === 'torxTamperResistant' ? recess.slice(0, 1) : recess;
      for (const recessContour of recessWithoutPin) {
        assert.ok(Math.sign(signedAreaOf(recessContour)) === -Math.sign(signedAreaOf(head)), `${key} recess winds like the head`);
      }
    }
  });

  it('should wind the pin of a tamper resistant Torx like the head so that it stays solid once filled', () => {
    const [head, , pin] = contoursOf(drawDriveIcon('torxTamperResistant'));

    assert.equal(Math.sign(signedAreaOf(pin)), Math.sign(signedAreaOf(head)));
  });

  it('should keep every icon within the unit circle of the head', () => {
    for (const { key } of driveTypes) {
      for (const command of drawDriveIcon(key).filter((command) => command.type !== 'Z')) {
        assert.ok(Math.hypot(command.x, command.y) <= 1 + 1e-9, `${key} goes past the head`);
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
    const distancesFromCenter = corners.map(({ x, y }) => Math.hypot(x, y));
    for (const distance of distancesFromCenter) {
      assert.ok(Math.abs(distance - distancesFromCenter[0]) < 1e-9);
    }
  });

  it('should draw a single four armed cross with arms narrowing to their tip for a Phillips drive', () => {
    const recess = recessOf('phillips');

    assert.equal(recess.length, 1);
    const corners = cornersOf(recess[0]);
    assert.equal(corners.length, 12);
    assert.ok(isUnchangedByQuarterTurn(corners));
    const [tipLeft, tipRight, innerCorner] = corners;
    assert.ok(Math.abs(tipRight.x - tipLeft.x) < 2 * Math.abs(innerCorner.x), 'arms do not narrow to their tip');
  });

  it('should draw a single contour joining a straight cross and a thinner diagonal cross for a Pozidriv drive', () => {
    const recess = recessOf('pozidriv');

    assert.equal(recess.length, 1);
    const corners = cornersOf(recess[0]);
    assert.equal(corners.length, 24);
    assert.ok(isUnchangedByQuarterTurn(corners));
    const arms = Array.from({ length: 8 }, (_, index) => {
      const [tipStart, tipEnd] = corners.slice(3 * index, 3 * index + 2);
      return { width: Math.hypot(tipEnd.x - tipStart.x, tipEnd.y - tipStart.y), tipCenter: midpointOf(tipStart, tipEnd) };
    });
    const [straightArm, diagonalArm] = arms;
    assert.ok(diagonalArm.width < straightArm.width, 'diagonal cross is not thinner');
    assert.ok(Math.abs(Math.abs(diagonalArm.tipCenter.x) - Math.abs(diagonalArm.tipCenter.y)) < 1e-9, 'second cross is not diagonal');
  });

  it('should draw a single star with six rounded lobes for a Torx drive', () => {
    const recess = recessOf('torx');

    assert.equal(recess.length, 1);
    const [start, ...curves] = recess[0].filter((command) => command.type !== 'Z');
    assert.equal(start.type, 'M');
    assert.ok(curves.every((command) => command.type === 'Q'), 'lobes are not rounded');
    const controlDistances = curves.map(({ x1, y1 }) => Math.hypot(x1, y1));
    const lobeTips = controlDistances.filter((distance) => Math.abs(distance - Math.max(...controlDistances)) < 1e-9);
    assert.equal(lobeTips.length, 6);
  });

  it('should draw the Torx star with a central pin for a tamper resistant Torx drive', () => {
    const [star, pin, ...others] = recessOf('torxTamperResistant');

    assert.deepEqual(star, recessOf('torx')[0]);
    assert.ok(pin.every((command) => command.type !== 'C' || Math.hypot(command.x, command.y) < 0.3), 'pin is not central');
    assert.equal(others.length, 0);
  });
});
