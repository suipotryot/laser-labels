import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DOMParser } from '@xmldom/xmldom';
import { renderLabel } from '../../src/label/renderLabel.js';
import { computeLayout } from '../../src/label/layout.js';

const screwSpec = {
  width: 60,
  height: 20,
  hardwareType: 'screw',
  drive: { type: 'pozidriv', size: 'PZ2' },
  dimensions: '3,5x50',
  hasFrame: false,
};

function throwOnParseError(level, message) {
  if (level !== 'warning') {
    throw new Error(`Invalid SVG: ${message}`);
  }
}

function parseSvg(svgText) {
  const parser = new DOMParser({ onError: throwOnParseError });
  return parser.parseFromString(svgText, 'image/svg+xml').documentElement;
}

function textElementsOf(svg) {
  return Array.from(svg.getElementsByTagName('text'));
}

function textLinesOf(svg) {
  return textElementsOf(svg).map((text) => text.textContent);
}

describe('renderLabel', () => {
  it('should size the SVG in millimeters', () => {
    const svg = parseSvg(renderLabel(screwSpec));

    assert.equal(svg.getAttribute('width'), '60mm');
    assert.equal(svg.getAttribute('height'), '20mm');
    assert.equal(svg.getAttribute('viewBox'), '0 0 60 20');
  });

  it('should draw everything as an unfilled black stroke', () => {
    const svg = parseSvg(renderLabel(screwSpec));

    assert.equal(svg.getAttribute('fill'), 'none');
    assert.equal(svg.getAttribute('stroke'), '#000');
    assert.ok(Number(svg.getAttribute('stroke-width')) > 0);
  });

  it('should draw a rounded frame along the label edges when asked', () => {
    const svg = parseSvg(renderLabel({ ...screwSpec, hasFrame: true }));
    const frame = svg.getElementsByTagName('rect')[0];

    const strokeWidth = Number(svg.getAttribute('stroke-width'));

    assert.ok(Number(frame.getAttribute('rx')) > 0);
    assert.equal(Number(frame.getAttribute('x')), strokeWidth / 2);
    assert.equal(Number(frame.getAttribute('y')), strokeWidth / 2);
    assert.equal(Number(frame.getAttribute('width')), screwSpec.width - strokeWidth);
    assert.equal(Number(frame.getAttribute('height')), screwSpec.height - strokeWidth);
  });

  it('should not draw any frame when not asked', () => {
    const svg = parseSvg(renderLabel({ ...screwSpec, hasFrame: false }));

    assert.equal(svg.getElementsByTagName('rect').length, 0);
  });

  it('should write the hardware name, the dimensions and the drive size as text lines', () => {
    const svg = parseSvg(renderLabel(screwSpec));

    assert.deepEqual(textLinesOf(svg), ['Vis', '3,5x50', 'PZ2']);
  });

  it('should leave out the drive line when there is no drive', () => {
    const svg = parseSvg(renderLabel({ ...screwSpec, hardwareType: 'nut', drive: null, dimensions: 'M6' }));

    assert.deepEqual(textLinesOf(svg), ['Écrou', 'M6']);
  });

  it('should leave out the dimensions line when no dimensions are given', () => {
    const svg = parseSvg(renderLabel({ ...screwSpec, dimensions: '' }));

    assert.deepEqual(textLinesOf(svg), ['Vis', 'PZ2']);
  });

  it('should escape XML special characters typed in the dimensions', () => {
    const svg = parseSvg(renderLabel({ ...screwSpec, dimensions: '<5 & >3' }));

    assert.deepEqual(textLinesOf(svg), ['Vis', '<5 & >3', 'PZ2']);
  });

  it('should write the text below the icon zone of a stacked label', () => {
    const stackedSpec = { ...screwSpec, width: 20, height: 60 };
    const { iconZone } = computeLayout(stackedSpec);
    const svg = parseSvg(renderLabel(stackedSpec));

    for (const text of textElementsOf(svg)) {
      assert.ok(Number(text.getAttribute('y')) > iconZone.y + iconZone.height);
    }
  });

  it('should round every coordinate to the micrometer', () => {
    const svgText = renderLabel({ ...screwSpec, hasFrame: true });

    assert.doesNotMatch(svgText, /\d\.\d{4,}/);
  });
});
