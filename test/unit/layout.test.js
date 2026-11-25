import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeLayout, ICON_MAX_ASPECT_RATIO } from '../../src/label/layout.js';

describe('computeLayout', () => {
  it('should choose a landscape layout when the label is wider than tall', () => {
    const layout = computeLayout({ width: 60, height: 20 });

    assert.equal(layout.orientation, 'landscape');
  });

  it('should choose a stacked layout when the label is taller than wide', () => {
    const layout = computeLayout({ width: 20, height: 60 });

    assert.equal(layout.orientation, 'stacked');
  });

  it('should choose a landscape layout for a square label', () => {
    const layout = computeLayout({ width: 30, height: 30 });

    assert.equal(layout.orientation, 'landscape');
  });

  it('should place the icon zone left of the text zone in a landscape layout', () => {
    const { iconZone, textZone } = computeLayout({ width: 60, height: 20 });

    assert.ok(iconZone.x + iconZone.width < textZone.x);
    assert.equal(iconZone.y, textZone.y);
    assert.equal(iconZone.height, textZone.height);
  });

  it('should place the icon zone above the text zone in a stacked layout', () => {
    const { iconZone, textZone } = computeLayout({ width: 20, height: 60 });

    assert.ok(iconZone.y + iconZone.height < textZone.y);
    assert.equal(iconZone.x, textZone.x);
    assert.equal(iconZone.width, textZone.width);
  });

  it('should give the text the extra room of a very long label', () => {
    const { iconZone, textZone } = computeLayout({ width: 200, height: 20 });

    assert.ok(iconZone.width <= iconZone.height * ICON_MAX_ASPECT_RATIO);
    assert.ok(textZone.width > iconZone.width * 2);
  });

  it('should give the text the extra room of a very tall label', () => {
    const { iconZone, textZone } = computeLayout({ width: 20, height: 200 });

    assert.ok(iconZone.height <= iconZone.width * ICON_MAX_ASPECT_RATIO);
    assert.ok(textZone.height > iconZone.height * 2);
  });
});
