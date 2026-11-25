import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isTextTooSmallToRead } from '../../src/label/textReadability.js';
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

describe('isTextTooSmallToRead', () => {
  it('should find the text of a long name on a small label too small to read', () => {
    const smallMollySpec = { ...screwSpec, width: 20, height: 10, hardwareType: 'mollyAnchor', drive: null, dimensions: '6x52' };

    assert.equal(isTextTooSmallToRead(smallMollySpec, font), true);
  });

  it('should find the text of a screw label of usual size readable', () => {
    assert.equal(isTextTooSmallToRead(screwSpec, font), false);
  });
});
