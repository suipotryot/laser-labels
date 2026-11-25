import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fitTextLines } from '../../src/text/fitTextLines.js';
import { loadTestFont } from './helpers/loadTestFont.js';

const font = loadTestFont();
const zone = { x: 10, y: 2, width: 40, height: 16 };

function inkBoxOf(font, { text, x, baseline, fontSize }) {
  return font.getPath(text, x, baseline, fontSize).getBoundingBox();
}

function lineBoxOf(font, { baseline, fontSize }) {
  const { yMax, yMin } = font.tables.head;
  const scale = fontSize / font.unitsPerEm;
  return { top: baseline - yMax * scale, bottom: baseline - yMin * scale };
}

describe('fitTextLines', () => {
  it('should keep every line within the zone height', () => {
    const placedLines = fitTextLines(font, ['Écrou', 'M6', 'Pygmée'], zone);

    for (const placedLine of placedLines) {
      const inkBox = inkBoxOf(font, placedLine);
      assert.ok(inkBox.y1 >= zone.y, `${placedLine.text} starts above the zone`);
      assert.ok(inkBox.y2 <= zone.y + zone.height, `${placedLine.text} ends below the zone`);
    }
  });

  it('should keep the longest line within the zone width', () => {
    const narrowZone = { ...zone, width: 20 };
    const placedLines = fitTextLines(font, ['Cheville Molly', '6x52'], narrowZone);

    for (const placedLine of placedLines) {
      const inkBox = inkBoxOf(font, placedLine);
      assert.ok(inkBox.x1 >= narrowZone.x, `${placedLine.text} starts left of the zone`);
      assert.ok(inkBox.x2 <= narrowZone.x + narrowZone.width, `${placedLine.text} ends right of the zone`);
    }
  });

  it('should give every line the same font size', () => {
    const placedLines = fitTextLines(font, ['Cheville Molly', '6x52'], zone);

    assert.equal(placedLines[0].fontSize, placedLines[1].fontSize);
  });

  it('should fill the zone height when the lines are short', () => {
    const placedLines = fitTextLines(font, ['Vis', 'M6'], zone);

    const top = lineBoxOf(font, placedLines[0]).top;
    const bottom = lineBoxOf(font, placedLines.at(-1)).bottom;
    assert.ok(Math.abs(bottom - top - zone.height) < 1e-9);
  });

  it('should center the lines vertically in the zone', () => {
    const narrowZone = { ...zone, width: 20 };
    const placedLines = fitTextLines(font, ['Cheville Molly', '6x52'], narrowZone);

    const top = lineBoxOf(font, placedLines[0]).top;
    const bottom = lineBoxOf(font, placedLines.at(-1)).bottom;
    assert.ok(Math.abs(top - narrowZone.y - (narrowZone.y + narrowZone.height - bottom)) < 1e-9);
  });
});
