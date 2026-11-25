import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildFileName } from '../../src/label/fileName.js';

const screwSpec = {
  width: 60,
  height: 20,
  hardwareType: 'screw',
  drive: { type: 'pozidriv', size: 'PZ2' },
  dimensions: '3,5x50',
  hasFrame: false,
};

describe('buildFileName', () => {
  it('should name the file after the hardware, its dimensions and its drive', () => {
    assert.equal(buildFileName(screwSpec), 'vis-3,5x50-pz2.svg');
  });

  it('should join words with dashes and drop characters forbidden in file names', () => {
    const spec = { ...screwSpec, hardwareType: 'mollyAnchor', drive: null, dimensions: '1/2" : M5 x 52 *?<>|\\' };

    assert.equal(buildFileName(spec), 'cheville-molly-12-m5-x-52.svg');
  });

  it('should skip a part that is empty once cleaned', () => {
    assert.equal(buildFileName({ ...screwSpec, dimensions: '//' }), 'vis-pz2.svg');
  });
});
