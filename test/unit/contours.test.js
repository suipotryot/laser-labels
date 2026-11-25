import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { circle, hollow, rectangle, solid, starOfArms } from '../../src/icons/contours.js';

function signedAreaOf(contour) {
  const points = contour.filter((command) => command.type !== 'Z');
  return points.reduce((area, point, index) => {
    const next = points[(index + 1) % points.length];
    return area + (point.x * next.y - next.x * point.y) / 2;
  }, 0);
}

function windingOf(contour) {
  return signedAreaOf(contour) > 0 ? 'clockwise' : 'counterclockwise';
}

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
