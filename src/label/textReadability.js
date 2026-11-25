import { placeLabelTextLines } from './placeLabelTextLines.js';

const MINIMUM_READABLE_CAP_HEIGHT_MILLIMETERS = 1.5;

function capHeightPerFontSize(font) {
  return font.tables.os2.sCapHeight / font.unitsPerEm;
}

export function isTextTooSmallToRead(spec, font) {
  const [{ fontSize }] = placeLabelTextLines(spec, font);
  return fontSize * capHeightPerFontSize(font) < MINIMUM_READABLE_CAP_HEIGHT_MILLIMETERS;
}
