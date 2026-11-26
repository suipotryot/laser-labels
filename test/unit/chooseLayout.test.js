import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { chooseLayout } from '../../src/label/chooseLayout.js';
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

describe('chooseLayout', () => {
  it('should put a screw beside its text on a wide label', () => {
    assert.equal(chooseLayout(screwSpec, font).orientation, 'sideBySide');
  });

  it('should put the text above a screw on a tall label', () => {
    assert.equal(chooseLayout({ ...screwSpec, width: 20, height: 60 }, font).orientation, 'stacked');
  });

  it('should favour the text over the drawing, keeping a screw beside a short text on a short label', () => {
    assert.equal(chooseLayout({ ...screwSpec, width: 30, height: 20, dimensions: '4x30' }, font).orientation, 'sideBySide');
  });

  it('should leave room for the usages when choosing between text above the drawing and text beside it', () => {
    const shortLabelSpec = { ...screwSpec, width: 30, height: 15, drive: null, dimensions: 'M8x40' };

    assert.equal(chooseLayout(shortLabelSpec, font).orientation, 'stacked');
    assert.equal(chooseLayout({ ...shortLabelSpec, usages: ['metal', 'outdoor', 'masonry'] }, font).orientation, 'sideBySide');
  });

  it('should put long dimensions above the screw, even on a wide label', () => {
    assert.equal(chooseLayout({ ...screwSpec, drive: null, dimensions: 'M5 x 52 tête fraisée inox A2' }, font).orientation, 'stacked');
  });
});
