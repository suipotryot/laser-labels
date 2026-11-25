import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fitTextLines } from '../../src/text/fitTextLines.js';
import { loadTestFont } from './helpers/loadTestFont.js';

const font = loadTestFont();
const zone = { x: 10, y: 2, width: 40, height: 16 };
const widthLimitingZone = { ...zone, width: 20 };
const FLOATING_POINT_TOLERANCE = 1e-9;
const linesEndingWithDriveIcon = [{ text: '3,5x50' }, { text: 'PZ2', leadingIcon: 'pozidriv' }];

function textLines(...texts) {
  return texts.map((text) => ({ text }));
}

function inkBoxOf({ text, x, baseline, fontSize }) {
  const { x1, y1, x2, y2 } = font.getPath(text, x, baseline, fontSize).getBoundingBox();
  return { left: x1, top: y1, right: x2, bottom: y2 };
}

function lineBoxOf({ baseline, fontSize }) {
  const { yMax, yMin } = font.tables.head;
  const scale = fontSize / font.unitsPerEm;
  return { top: baseline - yMax * scale, bottom: baseline - yMin * scale };
}

function assertAlmostEqual(actual, expected) {
  assert.ok(Math.abs(actual - expected) < FLOATING_POINT_TOLERANCE, `${actual} is not ${expected}`);
}

function assertWithinZoneWidth(placedLines, zone) {
  for (const placedLine of placedLines) {
    const inkBox = inkBoxOf(placedLine);
    assert.ok(inkBox.left >= zone.x - FLOATING_POINT_TOLERANCE, `${placedLine.text} starts left of the zone`);
    assert.ok(inkBox.right <= zone.x + zone.width + FLOATING_POINT_TOLERANCE, `${placedLine.text} ends right of the zone`);
  }
}

describe('fitTextLines', () => {
  it('should keep every line within the zone height', () => {
    const placedLines = fitTextLines(font, textLines('Écrou', 'M6', 'Pygmée'), zone);

    for (const placedLine of placedLines) {
      const inkBox = inkBoxOf(placedLine);
      assert.ok(inkBox.top >= zone.y, `${placedLine.text} starts above the zone`);
      assert.ok(inkBox.bottom <= zone.y + zone.height, `${placedLine.text} ends below the zone`);
    }
  });

  it('should keep the longest line within the zone width', () => {
    const placedLines = fitTextLines(font, textLines('Cheville Molly', '6x52'), widthLimitingZone);

    assertWithinZoneWidth(placedLines, widthLimitingZone);
  });

  it('should keep glyphs overhanging their advance within the zone width', () => {
    const placedLines = fitTextLines(font, textLines('jauge ï'), widthLimitingZone);

    assertWithinZoneWidth(placedLines, widthLimitingZone);
  });

  it('should align the ink of every line on the left edge of the zone', () => {
    const placedLines = fitTextLines(font, textLines('Vis', 'jauge', '3,5x50'), zone);

    for (const placedLine of placedLines) {
      assertAlmostEqual(inkBoxOf(placedLine).left, zone.x);
    }
  });

  it('should place a leading icon on the left edge of the zone, centered on the capitals of its line', () => {
    const [, iconLine] = fitTextLines(font, linesEndingWithDriveIcon, zone);

    const { x, y, radius } = iconLine.leadingIconCircle;
    const capHeight = (iconLine.fontSize * font.tables.os2.sCapHeight) / font.unitsPerEm;
    assertAlmostEqual(x - radius, zone.x);
    assertAlmostEqual(y, iconLine.baseline - capHeight / 2);
  });

  it('should start the text of a line after its leading icon, leaving a gap of 0.3 em', () => {
    const [, iconLine] = fitTextLines(font, linesEndingWithDriveIcon, zone);

    const { x, radius } = iconLine.leadingIconCircle;
    assertAlmostEqual(inkBoxOf(iconLine).left - (x + radius), 0.3 * iconLine.fontSize);
  });

  it('should keep a leading icon within the zone height when its line fills it alone', () => {
    const [iconLine] = fitTextLines(font, [{ text: 'PZ2', leadingIcon: 'pozidriv' }], zone);

    const { y, radius } = iconLine.leadingIconCircle;
    assert.ok(y - radius >= zone.y, 'the icon starts above the zone');
    assert.ok(y + radius <= zone.y + zone.height, 'the icon ends below the zone');
  });

  it('should keep a line with a leading icon within the zone width', () => {
    const lines = [{ text: 'T40H', leadingIcon: 'torxTamperResistant' }];
    const placedLines = fitTextLines(font, lines, widthLimitingZone);

    assertWithinZoneWidth(placedLines, widthLimitingZone);
  });

  it('should give a scaled line its scale times the font size of the other lines', () => {
    const [dimensionsLine, driveLine] = fitTextLines(font, [{ text: '3,5x50', scale: 1.5 }, { text: 'PZ2' }], zone);

    assertAlmostEqual(dimensionsLine.fontSize, 1.5 * driveLine.fontSize);
  });

  it('should fill the zone height exactly with a scaled line among short lines', () => {
    const placedLines = fitTextLines(font, [{ text: 'M6', scale: 1.5 }, { text: 'PZ2' }], zone);

    const top = lineBoxOf(placedLines[0]).top;
    const bottom = lineBoxOf(placedLines.at(-1)).bottom;
    assertAlmostEqual(top, zone.y);
    assertAlmostEqual(bottom, zone.y + zone.height);
  });

  it('should keep a long scaled line within the zone width', () => {
    const placedLines = fitTextLines(font, [{ text: 'M5 x 52 tête fraisée', scale: 1.5 }, { text: 'PZ2' }], widthLimitingZone);

    assertWithinZoneWidth(placedLines, widthLimitingZone);
  });

  it('should give every line the same font size', () => {
    const placedLines = fitTextLines(font, textLines('Cheville Molly', '6x52'), zone);

    assert.equal(placedLines[0].fontSize, placedLines[1].fontSize);
  });

  it('should fill the zone height when the lines are short', () => {
    const placedLines = fitTextLines(font, textLines('Vis', 'M6'), zone);

    const top = lineBoxOf(placedLines[0]).top;
    const bottom = lineBoxOf(placedLines.at(-1)).bottom;
    assertAlmostEqual(bottom - top, zone.height);
  });

  it('should center the lines vertically in the zone', () => {
    const placedLines = fitTextLines(font, textLines('Cheville Molly', '6x52'), widthLimitingZone);

    const spaceAbove = lineBoxOf(placedLines[0]).top - widthLimitingZone.y;
    const spaceBelow = widthLimitingZone.y + widthLimitingZone.height - lineBoxOf(placedLines.at(-1)).bottom;
    assertAlmostEqual(spaceAbove, spaceBelow);
  });
});
