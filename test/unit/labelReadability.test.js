import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hasDetailsTooSmallToEngrave } from '../../src/label/labelReadability.js';
import { loadTestFont } from './helpers/loadTestFont.js';

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

describe('hasDetailsTooSmallToEngrave', () => {
  it('should find long dimensions on a small label too small to engrave', () => {
    const smallLabelSpec = { ...screwSpec, width: 15, height: 8, drive: null, dimensions: 'M5 x 52 tête fraisée' };

    assert.equal(hasDetailsTooSmallToEngrave(smallLabelSpec, font), true);
  });

  it('should find nothing too small on a screw label of usual size', () => {
    assert.equal(hasDetailsTooSmallToEngrave(screwSpec, font), false);
  });

  it('should find a drive icon too detailed to engrave on a small label, even when its text is readable', () => {
    const smallPozidrivSpec = { ...screwSpec, width: 25, height: 8, dimensions: '3x16' };

    assert.equal(hasDetailsTooSmallToEngrave(smallPozidrivSpec, font), true);
  });

  it('should have nothing to complain about on a label without text', () => {
    const textlessSpec = { ...screwSpec, hardwareType: 'nut', drive: null, dimensions: '' };

    assert.equal(hasDetailsTooSmallToEngrave(textlessSpec, font), false);
  });

  it('should find a usage icon too detailed to engrave on a small label, even when everything else is readable', () => {
    const smallNutSpec = { ...screwSpec, width: 20, height: 7, hardwareType: 'nut', drive: null, dimensions: '' };

    assert.equal(hasDetailsTooSmallToEngrave(smallNutSpec, font), false);
    assert.equal(hasDetailsTooSmallToEngrave({ ...smallNutSpec, usages: ['metal'] }, font), true);
  });

  it('should find nothing too small on a usual label with every usage ticked', () => {
    assert.equal(hasDetailsTooSmallToEngrave({ ...screwSpec, usages: ['metal', 'outdoor', 'masonry'] }, font), false);
  });

  it('should find a hardware silhouette too detailed to engrave on a tiny label', () => {
    const tinyNailSpec = { ...screwSpec, width: 6, height: 6, hardwareType: 'nail', drive: null, dimensions: '' };

    assert.equal(hasDetailsTooSmallToEngrave(tinyNailSpec, font), true);
  });
});
