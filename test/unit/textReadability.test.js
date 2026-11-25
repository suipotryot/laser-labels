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
  it('should find long dimensions on a small label too small to read', () => {
    const smallLabelSpec = { ...screwSpec, width: 20, height: 10, drive: null, dimensions: 'M5 x 52 tête fraisée' };

    assert.equal(isTextTooSmallToRead(smallLabelSpec, font), true);
  });

  it('should find the text of a screw label of usual size readable', () => {
    assert.equal(isTextTooSmallToRead(screwSpec, font), false);
  });

  it('should have nothing to complain about on a label without text', () => {
    const textlessSpec = { ...screwSpec, hardwareType: 'nut', drive: null, dimensions: '' };

    assert.equal(isTextTooSmallToRead(textlessSpec, font), false);
  });
});
