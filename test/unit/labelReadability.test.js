import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isLabelTooSmallToRead } from '../../src/label/labelReadability.js';
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

describe('isLabelTooSmallToRead', () => {
  it('should find long dimensions on a small label too small to read', () => {
    const smallLabelSpec = { ...screwSpec, width: 20, height: 10, drive: null, dimensions: 'M5 x 52 tête fraisée' };

    assert.equal(isLabelTooSmallToRead(smallLabelSpec, font), true);
  });

  it('should find a screw label of usual size readable', () => {
    assert.equal(isLabelTooSmallToRead(screwSpec, font), false);
  });

  it('should find a drive icon too detailed to engrave on a small label, even when its text is readable', () => {
    const smallPozidrivSpec = { ...screwSpec, width: 25, height: 8, dimensions: '3x16' };

    assert.equal(isLabelTooSmallToRead(smallPozidrivSpec, font), true);
  });

  it('should have nothing to complain about on a label without text', () => {
    const textlessSpec = { ...screwSpec, hardwareType: 'nut', drive: null, dimensions: '' };

    assert.equal(isLabelTooSmallToRead(textlessSpec, font), false);
  });
});
