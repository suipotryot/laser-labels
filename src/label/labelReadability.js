import { placeLabelTextLines } from './placeLabelTextLines.js';
import { capHeightPerFontSize } from '../text/fontMetrics.js';
import { hasLeadingIcon } from '../text/fitTextLines.js';
import { thinnestDetailPerHeadRadius } from '../icons/driveIcons.js';

const MINIMUM_READABLE_CAP_HEIGHT_MILLIMETERS = 1.5;
const MINIMUM_ENGRAVABLE_DETAIL_MILLIMETERS = 0.15;

function isTextTooSmallToRead(font, { fontSize }) {
  return fontSize * capHeightPerFontSize(font) < MINIMUM_READABLE_CAP_HEIGHT_MILLIMETERS;
}

function hasDriveIconTooDetailedToEngrave(placedLine) {
  if (!hasLeadingIcon(placedLine)) {
    return false;
  }
  const thinnestDetail = thinnestDetailPerHeadRadius(placedLine.leadingIcon) * placedLine.leadingIconCircle.radius;
  return thinnestDetail < MINIMUM_ENGRAVABLE_DETAIL_MILLIMETERS;
}

function hasLineDetailsTooSmallToEngrave(font, placedLine) {
  return isTextTooSmallToRead(font, placedLine) || hasDriveIconTooDetailedToEngrave(placedLine);
}

export function hasDetailsTooSmallToEngrave(spec, font) {
  return placeLabelTextLines(spec, font).some((placedLine) => hasLineDetailsTooSmallToEngrave(font, placedLine));
}
