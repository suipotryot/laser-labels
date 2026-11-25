import { placeLabelTextLines } from './placeLabelTextLines.js';
import { capHeightPerFontSize } from '../text/fontMetrics.js';

const MINIMUM_READABLE_CAP_HEIGHT_MILLIMETERS = 1.5;

function isLineTooSmallToRead(font, { fontSize }) {
  return fontSize * capHeightPerFontSize(font) < MINIMUM_READABLE_CAP_HEIGHT_MILLIMETERS;
}

export function isTextTooSmallToRead(spec, font) {
  return placeLabelTextLines(spec, font).some((placedLine) => isLineTooSmallToRead(font, placedLine));
}
