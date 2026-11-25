import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { placeLabelTextLines } from '../../src/label/placeLabelTextLines.js';
import { loadTestFont } from './helpers/loadTestFont.js';

const font = loadTestFont();

const screwSpec = {
  width: 60,
  height: 20,
  hardwareType: 'screw',
  drive: { type: 'pozidriv', size: 'PZ2' },
  dimensions: '3,5x50',
  hasFrame: false,
};

describe('placeLabelTextLines', () => {
  it('should write the dimensions one and a half times bigger than the drive size', () => {
    const [dimensionsLine, driveLine] = placeLabelTextLines(screwSpec, font);

    assert.ok(Math.abs(dimensionsLine.fontSize - 1.5 * driveLine.fontSize) < 1e-9);
  });
});
