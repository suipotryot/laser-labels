import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DOMParser } from '@xmldom/xmldom';
import { renderLabel } from '../../src/label/renderLabel.js';
import { chooseLayout } from '../../src/label/chooseLayout.js';
import { loadTestFont } from './helpers/loadTestFont.js';
import { placeLabelTextLines } from '../../src/label/placeLabelTextLines.js';

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

function textLinesOf(svg) {
  return textPathsOf(svg).map((path) => path.getAttribute('aria-label'));
}

const PATH_COMMAND = /[MLQC][^MLQCZ]*/g;

function onCurvePointsOf(path) {
  return path.getAttribute('d').match(PATH_COMMAND).map((command) => {
    const [x, y] = command.slice(1).trim().split(/\s+/).map(Number).slice(-2);
    return { x, y };
  });
}

function driveIconPathsOf(svg) {
  return Array.from(svg.getElementsByTagName('path')).filter((path) => path.hasAttribute('data-drive-icon'));
}

function pathsWithAttribute(svg, attribute) {
  return Array.from(svg.getElementsByTagName('path')).filter((path) => path.hasAttribute(attribute));
}

function textPathOf(svg, text) {
  return textPathsOf(svg).find((path) => path.getAttribute('aria-label') === text);
}

function horizontalSpanOf(path) {
  const xs = onCurvePointsOf(path).map(({ x }) => x);
  return { left: Math.min(...xs), right: Math.max(...xs) };
}

function verticalSpanOf(path) {
  const ys = onCurvePointsOf(path).map(({ y }) => y);
  return { top: Math.min(...ys), bottom: Math.max(...ys) };
}

function roundToMicrometer(millimeters) {
  return Math.round(millimeters * 1000) / 1000;
}

function isInsideZone(point, zone) {
  return point.x >= zone.x && point.x <= zone.x + zone.width && point.y >= zone.y && point.y <= zone.y + zone.height;
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

  it('should draw the drive icon just before the drive size', () => {
    const svg = parseSvg(renderLabel(screwSpec, font));

    const [driveIcon] = driveIconPathsOf(svg);
    assert.equal(driveIcon.getAttribute('data-drive-icon'), 'pozidriv');
    assert.ok(horizontalSpanOf(driveIcon).right < horizontalSpanOf(textPathOf(svg, 'PZ2')).left);
  });

  it('should keep the drive icon inside the text zone of a narrow stacked label', () => {
    const narrowSpec = { ...screwSpec, width: 15, height: 40, drive: { type: 'torxTamperResistant', size: 'T40H' } };
    const { textZone } = chooseLayout(narrowSpec, font);
    const svg = parseSvg(renderLabel(narrowSpec, font));

    for (const point of driveIconPathsOf(svg).flatMap(onCurvePointsOf)) {
      assert.ok(isInsideZone(point, textZone), `(${point.x}, ${point.y}) is outside the text zone`);
    }
  });

  it('should draw the drive icon at the size of the circle it was given', () => {
    const svg = parseSvg(renderLabel(screwSpec, font));
    const [, driveLine] = placeLabelTextLines(screwSpec, font);

    const { x, y, radius } = driveLine.leadingIconCircle;
    const [driveIcon] = driveIconPathsOf(svg);
    assert.deepEqual(horizontalSpanOf(driveIcon), { left: roundToMicrometer(x - radius), right: roundToMicrometer(x + radius) });
    assert.deepEqual(verticalSpanOf(driveIcon), { top: roundToMicrometer(y - radius), bottom: roundToMicrometer(y + radius) });
  });

  it('should draw the hardware silhouette and its strokes inside the icon zone', () => {
    const { iconZone } = chooseLayout(screwSpec, font);
    const svg = parseSvg(renderLabel(screwSpec, font));

    const [silhouette] = pathsWithAttribute(svg, 'data-hardware-outline');
    const [strokes] = pathsWithAttribute(svg, 'data-hardware-strokes');
    assert.equal(silhouette.getAttribute('data-hardware-outline'), 'screw');
    assert.equal(strokes.getAttribute('data-hardware-strokes'), 'screw');
    for (const point of [silhouette, strokes].flatMap(onCurvePointsOf)) {
      assert.ok(isInsideZone(point, iconZone), `(${point.x}, ${point.y}) is outside the icon zone`);
    }
  });

  it('should lay the silhouette across the whole width of a tall label, below the text', () => {
    const tallSpec = { ...screwSpec, width: 20, height: 60 };
    const { iconZone } = chooseLayout(tallSpec, font);
    const svg = parseSvg(renderLabel(tallSpec, font));

    const [silhouette] = pathsWithAttribute(svg, 'data-hardware-outline');
    const [strokesPath] = pathsWithAttribute(svg, 'data-hardware-strokes');
    const { left, right } = horizontalSpanOf(silhouette);
    const { top, bottom } = verticalSpanOf(silhouette);
    assert.ok(right - left > 3 * (bottom - top), 'the silhouette is not lying');
    assert.ok(Math.abs(right - left - iconZone.width) < 1e-3, 'the silhouette does not take the whole width');
    assert.ok([silhouette, strokesPath].flatMap(onCurvePointsOf).every((point) => isInsideZone(point, iconZone)), 'the silhouette leaves its zone');
    for (const point of textPathsOf(svg).flatMap(onCurvePointsOf)) {
      assert.ok(point.y < iconZone.y, 'the text is not above the silhouette');
    }
  });

  it('should keep the silhouette lying on a label wider than tall, whatever the shape of its icon zone', () => {
    const shortLabelSpec = { ...screwSpec, width: 30, height: 20 };
    const svg = parseSvg(renderLabel(shortLabelSpec, font));

    const [silhouette] = pathsWithAttribute(svg, 'data-hardware-outline');
    const { left, right } = horizontalSpanOf(silhouette);
    const { top, bottom } = verticalSpanOf(silhouette);
    assert.ok(right - left > 3 * (bottom - top), 'the silhouette is not lying');
  });

  it('should draw no strokes path for hardware without strokes', () => {
    const svg = parseSvg(renderLabel({ ...screwSpec, hardwareType: 'nut', drive: null }, font));

    assert.equal(pathsWithAttribute(svg, 'data-hardware-outline').length, 1);
    assert.equal(pathsWithAttribute(svg, 'data-hardware-strokes').length, 0);
  });

  it('should draw each ticked usage below the silhouette, inside the icon zone', () => {
    const usagesSpec = { ...screwSpec, usages: ['metal', 'outdoor', 'masonry'] };
    const { iconZone } = chooseLayout(usagesSpec, font);
    const svg = parseSvg(renderLabel(usagesSpec, font));

    const usagePaths = pathsWithAttribute(svg, 'data-usage-icon');
    assert.deepEqual(usagePaths.map((path) => path.getAttribute('data-usage-icon')), ['metal', 'outdoor', 'masonry']);
    const [silhouette] = pathsWithAttribute(svg, 'data-hardware-outline');
    for (const point of usagePaths.flatMap(onCurvePointsOf)) {
      assert.ok(isInsideZone(point, iconZone), `(${point.x}, ${point.y}) is outside the icon zone`);
      assert.ok(point.y >= verticalSpanOf(silhouette).bottom, 'a usage is not below the silhouette');
    }
  });

  it('should draw no usage icon when no usage is ticked', () => {
    const svg = parseSvg(renderLabel(screwSpec, font));

    assert.equal(pathsWithAttribute(svg, 'data-usage-icon').length, 0);
  });

  it('should draw no drive icon when there is no drive', () => {
    const svg = parseSvg(renderLabel({ ...screwSpec, drive: null }, font));

    assert.equal(driveIconPathsOf(svg).length, 0);
  });

  it('should write the dimensions and the drive size as text lines, leaving the hardware type to the icon', () => {
    const svg = parseSvg(renderLabel(screwSpec, font));

    assert.deepEqual(textLinesOf(svg), ['3,5x50', 'PZ2']);
  });

  it('should leave out the drive line when there is no drive', () => {
    const svg = parseSvg(renderLabel({ ...screwSpec, hardwareType: 'nut', drive: null, dimensions: 'M6' }, font));

    assert.deepEqual(textLinesOf(svg), ['M6']);
  });

  it('should leave out the dimensions line when no dimensions are given', () => {
    const svg = parseSvg(renderLabel({ ...screwSpec, dimensions: '' }, font));

    assert.deepEqual(textLinesOf(svg), ['PZ2']);
  });

  it('should write no text at all when there are neither dimensions nor drive', () => {
    const svg = parseSvg(renderLabel({ ...screwSpec, hardwareType: 'nut', drive: null, dimensions: '' }, font));

    assert.deepEqual(textLinesOf(svg), []);
  });

  it('should escape XML special characters typed in the dimensions', () => {
    const svg = parseSvg(renderLabel({ ...screwSpec, dimensions: '<5 & >3' }, font));

    assert.deepEqual(textLinesOf(svg), ['<5 & >3', 'PZ2']);
  });

  it('should escape a double quote typed in the dimensions', () => {
    const svg = parseSvg(renderLabel({ ...screwSpec, dimensions: '1/4"' }, font));

    assert.deepEqual(textLinesOf(svg), ['1/4"', 'PZ2']);
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
    const { textZone } = chooseLayout(mollySpec, font);
    const svg = parseSvg(renderLabel(mollySpec, font));

    for (const point of textPathsOf(svg).flatMap(onCurvePointsOf)) {
      assert.ok(isInsideZone(point, textZone), `(${point.x}, ${point.y}) is outside the text zone`);
    }
  });

  it('should round every coordinate to the micrometer', () => {
    const svgText = renderLabel({ ...screwSpec, hasFrame: true }, font);

    assert.doesNotMatch(svgText, /\d\.\d{4,}/);
  });
});
