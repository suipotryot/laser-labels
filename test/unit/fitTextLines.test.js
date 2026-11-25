import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fitTextLines } from '../../src/text/fitTextLines.js';
import { loadTestFont } from './helpers/loadTestFont.js';

const font = loadTestFont();
const zone = { x: 10, y: 2, width: 40, height: 16 };
const widthLimitingZone = { ...zone, width: 20 };

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
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} is not ${expected}`);
}

function assertWithinZoneWidth(placedLines, zone) {
  for (const placedLine of placedLines) {
    const inkBox = inkBoxOf(placedLine);
    assert.ok(inkBox.left >= zone.x, `${placedLine.text} starts left of the zone`);
    assert.ok(inkBox.right <= zone.x + zone.width, `${placedLine.text} ends right of the zone`);
  }
}

describe('fitTextLines', () => {
  it('should keep every line within the zone height', () => {
    const placedLines = fitTextLines(font, ['Écrou', 'M6', 'Pygmée'], zone);

    for (const placedLine of placedLines) {
      const inkBox = inkBoxOf(placedLine);
      assert.ok(inkBox.top >= zone.y, `${placedLine.text} starts above the zone`);
      assert.ok(inkBox.bottom <= zone.y + zone.height, `${placedLine.text} ends below the zone`);
    }
  });

  it('should keep the longest line within the zone width', () => {
    const placedLines = fitTextLines(font, ['Cheville Molly', '6x52'], widthLimitingZone);

    assertWithinZoneWidth(placedLines, widthLimitingZone);
  });

  it('should keep glyphs overhanging their advance within the zone width', () => {
    const placedLines = fitTextLines(font, ['jauge ï'], widthLimitingZone);

    assertWithinZoneWidth(placedLines, widthLimitingZone);
  });

  it('should align the ink of every line on the left edge of the zone', () => {
    const placedLines = fitTextLines(font, ['Vis', 'jauge', '3,5x50'], zone);

    for (const placedLine of placedLines) {
      assertAlmostEqual(inkBoxOf(placedLine).left, zone.x);
    }
  });

  it('should give every line the same font size', () => {
    const placedLines = fitTextLines(font, ['Cheville Molly', '6x52'], zone);

    assert.equal(placedLines[0].fontSize, placedLines[1].fontSize);
  });

  it('should fill the zone height when the lines are short', () => {
    const placedLines = fitTextLines(font, ['Vis', 'M6'], zone);

    const top = lineBoxOf(placedLines[0]).top;
    const bottom = lineBoxOf(placedLines.at(-1)).bottom;
    assertAlmostEqual(bottom - top, zone.height);
  });

  it('should center the lines vertically in the zone', () => {
    const placedLines = fitTextLines(font, ['Cheville Molly', '6x52'], widthLimitingZone);

    const spaceAbove = lineBoxOf(placedLines[0]).top - widthLimitingZone.y;
    const spaceBelow = widthLimitingZone.y + widthLimitingZone.height - lineBoxOf(placedLines.at(-1)).bottom;
    assertAlmostEqual(spaceAbove, spaceBelow);
  });
});
