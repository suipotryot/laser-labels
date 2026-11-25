import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toSvgPathData } from '../../src/svg/pathData.js';

describe('toSvgPathData', () => {
  it('should write each command with its coordinates rounded to the micrometer', () => {
    const commands = [
      { type: 'M', x: 1.00049, y: 2 },
      { type: 'Q', x1: 3, y1: 4.0006, x: 5, y: 6 },
      { type: 'Z' },
    ];

    assert.equal(toSvgPathData(commands), 'M1 2Q3 4.001 5 6Z');
  });

  it('should refuse a command it does not know', () => {
    assert.throws(() => toSvgPathData([{ type: 'A', x: 1, y: 2 }]), /Unknown path command: A/);
  });
});
