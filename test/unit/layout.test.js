import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeLayout } from '../../src/label/layout.js';

const LYING_SCREW_ASPECT_RATIO = 4;

function isAlmostEqual(actual, expected) {
  return Math.abs(actual - expected) < 1e-9;
}

describe('computeLayout', () => {
  it('should place the icon zone left of the text zone in a side-by-side layout', () => {
    const { iconZone, textZone } = computeLayout({ width: 60, height: 20 }, 'sideBySide', LYING_SCREW_ASPECT_RATIO);

    assert.ok(iconZone.x + iconZone.width < textZone.x);
    assert.equal(iconZone.y, textZone.y);
    assert.equal(iconZone.height, textZone.height);
  });

  it('should place the text zone above the icon zone in a stacked layout', () => {
    const { iconZone, textZone } = computeLayout({ width: 20, height: 60 }, 'stacked', LYING_SCREW_ASPECT_RATIO);

    assert.ok(textZone.y + textZone.height < iconZone.y);
    assert.equal(iconZone.x, textZone.x);
    assert.equal(iconZone.width, textZone.width);
  });

  it('should give a lying drawing the whole width of a stacked layout and only the height it needs', () => {
    const { iconZone } = computeLayout({ width: 20, height: 60 }, 'stacked', LYING_SCREW_ASPECT_RATIO);

    assert.ok(isAlmostEqual(iconZone.height, iconZone.width / LYING_SCREW_ASPECT_RATIO));
  });

  it('should give a drawing only the width it needs in a side-by-side layout', () => {
    const squareNutAspectRatio = 1;
    const { iconZone } = computeLayout({ width: 60, height: 20 }, 'sideBySide', squareNutAspectRatio);

    assert.ok(isAlmostEqual(iconZone.width, iconZone.height));
  });

  it('should never give the drawing more than a share of the label', () => {
    const { iconZone, textZone } = computeLayout({ width: 200, height: 20 }, 'sideBySide', 50);

    assert.ok(textZone.width > iconZone.width);
  });

});
