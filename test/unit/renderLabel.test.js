import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DOMParser } from '@xmldom/xmldom';
import { renderLabel } from '../../src/label/renderLabel.js';
import { computeLayout } from '../../src/label/layout.js';
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

function throwOnParseError(level, message) {
  if (level !== 'warning') {
    throw new Error(`Invalid SVG: ${message}`);
  }
}

function parseSvg(svgText) {
  const parser = new DOMParser({ onError: throwOnParseError });
  return parser.parseFromString(svgText, 'image/svg+xml').documentElement;
}

function textPathsOf(svg) {
  return Array.from(svg.getElementsByTagName('path')).filter((path) => path.hasAttribute('aria-label'));
}

const PATH_COMMAND_LETTER = /[MLQCZ]/;

function pointsOf(path) {
  const numbers = path.getAttribute('d').split(PATH_COMMAND_LETTER).join(' ').trim().split(/\s+/).map(Number);
  const points = [];
  for (let index = 0; index < numbers.length; index += 2) {
    points.push({ x: numbers[index], y: numbers[index + 1] });
  }
  return points;
}

function textLinesOf(svg) {
  return textPathsOf(svg).map((path) => path.getAttribute('aria-label'));
}

describe('renderLabel', () => {
  it('should size the SVG in millimeters', () => {
    const svg = parseSvg(renderLabel(screwSpec, font));

    assert.equal(svg.getAttribute('width'), '60mm');
    assert.equal(svg.getAttribute('height'), '20mm');
    assert.equal(svg.getAttribute('viewBox'), '0 0 60 20');
  });

  it('should draw everything as an unfilled black stroke', () => {
    const svg = parseSvg(renderLabel(screwSpec, font));

    assert.equal(svg.getAttribute('fill'), 'none');
    assert.equal(svg.getAttribute('stroke'), '#000');
    assert.ok(Number(svg.getAttribute('stroke-width')) > 0);
  });

  it('should draw a rounded frame along the label edges when asked', () => {
    const svg = parseSvg(renderLabel({ ...screwSpec, hasFrame: true }, font));
    const frame = svg.getElementsByTagName('rect')[0];

    const strokeWidth = Number(svg.getAttribute('stroke-width'));

    assert.ok(Number(frame.getAttribute('rx')) > 0);
    assert.equal(Number(frame.getAttribute('x')), strokeWidth / 2);
    assert.equal(Number(frame.getAttribute('y')), strokeWidth / 2);
    assert.equal(Number(frame.getAttribute('width')), screwSpec.width - strokeWidth);
    assert.equal(Number(frame.getAttribute('height')), screwSpec.height - strokeWidth);
  });

  it('should not draw any frame when not asked', () => {
    const svg = parseSvg(renderLabel({ ...screwSpec, hasFrame: false }, font));

    assert.equal(svg.getElementsByTagName('rect').length, 0);
  });

  it('should write the hardware name, the dimensions and the drive size as text lines', () => {
    const svg = parseSvg(renderLabel(screwSpec, font));

    assert.deepEqual(textLinesOf(svg), ['Vis', '3,5x50', 'PZ2']);
  });

  it('should leave out the drive line when there is no drive', () => {
    const svg = parseSvg(renderLabel({ ...screwSpec, hardwareType: 'nut', drive: null, dimensions: 'M6' }, font));

    assert.deepEqual(textLinesOf(svg), ['Écrou', 'M6']);
  });

  it('should leave out the dimensions line when no dimensions are given', () => {
    const svg = parseSvg(renderLabel({ ...screwSpec, dimensions: '' }, font));

    assert.deepEqual(textLinesOf(svg), ['Vis', 'PZ2']);
  });

  it('should escape XML special characters typed in the dimensions', () => {
    const svg = parseSvg(renderLabel({ ...screwSpec, dimensions: '<5 & >3' }, font));

    assert.deepEqual(textLinesOf(svg), ['Vis', '<5 & >3', 'PZ2']);
  });

  it('should draw the text as outlines rather than text elements', () => {
    const svg = parseSvg(renderLabel(screwSpec, font));

    assert.equal(svg.getElementsByTagName('text').length, 0);
  });

  it('should close every contour of the text outlines', () => {
    const svg = parseSvg(renderLabel(screwSpec, font));

    for (const path of textPathsOf(svg)) {
      const contours = path.getAttribute('d').split('M').filter(Boolean);
      assert.ok(contours.length > 0);
      assert.ok(contours.every((contour) => contour.endsWith('Z')), `${path.getAttribute('aria-label')} has an open contour`);
    }
  });

  it('should write only valid numbers in the text outlines', () => {
    const svg = parseSvg(renderLabel(screwSpec, font));

    for (const path of textPathsOf(svg)) {
      assert.doesNotMatch(path.getAttribute('d'), /NaN|undefined|Infinity/, `${path.getAttribute('aria-label')} has an invalid number`);
    }
  });

  it('should keep a long hardware name inside the text zone', () => {
    const mollySpec = { ...screwSpec, hardwareType: 'mollyAnchor', drive: null, dimensions: '6x52' };
    const { textZone } = computeLayout(mollySpec);
    const svg = parseSvg(renderLabel(mollySpec, font));

    for (const point of textPathsOf(svg).flatMap(pointsOf)) {
      assert.ok(point.x >= textZone.x && point.x <= textZone.x + textZone.width, `x=${point.x} is outside the text zone`);
      assert.ok(point.y >= textZone.y && point.y <= textZone.y + textZone.height, `y=${point.y} is outside the text zone`);
    }
  });

  it('should escape a double quote typed in the dimensions', () => {
    const svg = parseSvg(renderLabel({ ...screwSpec, dimensions: '1/4"' }, font));

    assert.deepEqual(textLinesOf(svg), ['Vis', '1/4"', 'PZ2']);
  });

  it('should write the text below the icon zone of a stacked label', () => {
    const stackedSpec = { ...screwSpec, width: 20, height: 60 };
    const { iconZone } = computeLayout(stackedSpec);
    const svg = parseSvg(renderLabel(stackedSpec, font));

    for (const point of textPathsOf(svg).flatMap(pointsOf)) {
      assert.ok(point.y > iconZone.y + iconZone.height);
    }
  });

  it('should round every coordinate to the micrometer', () => {
    const svgText = renderLabel({ ...screwSpec, hasFrame: true }, font);

    assert.doesNotMatch(svgText, /\d\.\d{4,}/);
  });
});
