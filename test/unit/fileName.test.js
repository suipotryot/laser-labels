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
  usages: [],
};

describe('buildFileName', () => {
  it('should name the file after the hardware, its dimensions and its drive', () => {
    assert.equal(buildFileName(screwSpec, 'fr'), 'vis-3,5x50-pz2.svg');
  });

  it('should end the name with the ticked usages, in the order of the catalog', () => {
    assert.equal(buildFileName({ ...screwSpec, usages: ['metal', 'masonry'] }, 'fr'), 'vis-3,5x50-pz2-métal-béton-maçonnerie.svg');
  });

  it('should name the hardware and the usages in the requested language', () => {
    assert.equal(buildFileName({ ...screwSpec, usages: ['masonry'] }, 'en'), 'screw-3,5x50-pz2-concrete-masonry.svg');
  });

  it('should join words with dashes and drop characters forbidden in file names', () => {
    const spec = { ...screwSpec, hardwareType: 'mollyAnchor', drive: null, dimensions: '1/2" : M5 x 52 *?<>|\\' };

    assert.equal(buildFileName(spec, 'fr'), 'cheville-molly-12-m5-x-52.svg');
  });

  it('should skip a part that is empty once cleaned', () => {
    assert.equal(buildFileName({ ...screwSpec, dimensions: '//' }, 'fr'), 'vis-pz2.svg');
  });
});
