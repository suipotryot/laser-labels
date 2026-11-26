import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { placeLabelTextLines } from '../../src/label/placeLabelTextLines.js';
import { loadTestFont } from './helpers/loadTestFont.js';
import { chooseLayout } from '../../src/label/chooseLayout.js';

const font = loadTestFont();

const screwSpec = {
  width: 60,
  height: 20,
  hardwareType: 'screw',
  drive: { type: 'pozidriv', size: 'PZ2' },
  dimensions: '3,5x50',
  hasFrame: false,
  usages: [],
};

describe('placeLabelTextLines', () => {
  it('should write the dimensions one and a half times bigger than the drive size', () => {
    const [dimensionsLine, driveLine] = placeLabelTextLines(screwSpec, font);

    assert.ok(Math.abs(dimensionsLine.fontSize - 1.5 * driveLine.fontSize) < 1e-9);
  });

  it('should center the text of a label whose text stands above the drawing', () => {
    const tallSpec = { ...screwSpec, width: 20, height: 60 };
    const { orientation, textZone } = chooseLayout(tallSpec, font);
    const [, driveLine] = placeLabelTextLines(tallSpec, font);

    const driveLineLeft = driveLine.leadingIconCircle.x - driveLine.leadingIconCircle.radius;
    const { x2: driveLineRight } = font.getPath(driveLine.text, driveLine.x, driveLine.baseline, driveLine.fontSize).getBoundingBox();
    assert.equal(orientation, 'stacked');
    assert.ok(driveLineLeft > textZone.x + 1, 'the drive line is not narrower than the zone');
    assert.ok(Math.abs((driveLineLeft + driveLineRight) / 2 - (textZone.x + textZone.width / 2)) < 1e-9, 'the drive line is not centered');
  });
});
