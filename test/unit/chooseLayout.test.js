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
};

describe('chooseLayout', () => {
  it('should put a screw beside its text on a wide label', () => {
    assert.equal(chooseLayout(screwSpec, font).orientation, 'sideBySide');
  });

  it('should put the text above a screw on a tall label', () => {
    assert.equal(chooseLayout({ ...screwSpec, width: 20, height: 60 }, font).orientation, 'stacked');
  });

  it('should give the whole label to the text of a hardware type that has no drawing yet', () => {
    const { iconZone, textZone } = chooseLayout({ ...screwSpec, hardwareType: 'hook', drive: null }, font);

    assert.equal(iconZone, null);
    assert.ok(textZone.width > screwSpec.width * 0.8);
  });
});
