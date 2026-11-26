import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { splitIconZone } from '../../src/label/splitIconZone.js';
import { FLOATING_POINT_TOLERANCE, isAlmostEqual } from './helpers/geometry.js';

const iconZone = { x: 10, y: 20, width: 40, height: 20 };

describe('splitIconZone', () => {
  it('should keep the whole icon zone for the drawing when there is no usage', () => {
    assert.deepEqual(splitIconZone(iconZone, 0), { drawingZone: iconZone, usageBoxes: [] });
  });

  it('should give one square box per usage along the bottom of the icon zone', () => {
    const { usageBoxes } = splitIconZone(iconZone, 3);

    assert.equal(usageBoxes.length, 3);
    for (const box of usageBoxes) {
      assert.ok(isAlmostEqual(box.width, box.height), 'a box is not square');
      assert.ok(isAlmostEqual(box.y + box.height, iconZone.y + iconZone.height), 'a box is not at the bottom of the zone');
    }
  });

  it('should keep the drawing above the usages, spanning the width of the icon zone', () => {
    const { drawingZone, usageBoxes } = splitIconZone(iconZone, 2);

    assert.equal(drawingZone.x, iconZone.x);
    assert.equal(drawingZone.width, iconZone.width);
    assert.equal(drawingZone.y, iconZone.y);
    assert.ok(drawingZone.y + drawingZone.height < usageBoxes[0].y, 'the drawing touches the usages');
  });

  it('should center the usages in the icon zone, side by side with equal gaps', () => {
    const { usageBoxes } = splitIconZone(iconZone, 3);

    const [first, second, third] = usageBoxes;
    assert.ok(isAlmostEqual(first.x - iconZone.x, iconZone.x + iconZone.width - (third.x + third.width)), 'the usages are not centered');
    assert.ok(isAlmostEqual(second.x - (first.x + first.width), third.x - (second.x + second.width)), 'the gaps are not equal');
    assert.ok(second.x - (first.x + first.width) > 0, 'the usages touch each other');
  });

  it('should shrink the usages to fit the width of a narrow icon zone', () => {
    const narrowZone = { x: 0, y: 0, width: 6, height: 20 };

    const { usageBoxes } = splitIconZone(narrowZone, 3);

    const last = usageBoxes.at(-1);
    assert.ok(usageBoxes[0].x >= narrowZone.x && last.x + last.width <= narrowZone.x + narrowZone.width + FLOATING_POINT_TOLERANCE, 'the usages overflow the zone');
  });
});
