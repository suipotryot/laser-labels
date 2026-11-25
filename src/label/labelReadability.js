import { placeLabelTextLines } from './placeLabelTextLines.js';
import { capHeightPerFontSize } from '../text/fontMetrics.js';
import { hasLeadingIcon } from '../text/fitTextLines.js';
import { thinnestDetailOf } from '../icons/driveIcons.js';

const MINIMUM_READABLE_CAP_HEIGHT_MILLIMETERS = 1.5;
const MINIMUM_ENGRAVABLE_DETAIL_MILLIMETERS = 0.15;

function isTextTooSmallToRead(font, { fontSize }) {
  return fontSize * capHeightPerFontSize(font) < MINIMUM_READABLE_CAP_HEIGHT_MILLIMETERS;
}

function isDriveIconTooDetailedToEngrave({ leadingIcon, leadingIconCircle }) {
  return thinnestDetailOf(leadingIcon) * leadingIconCircle.radius < MINIMUM_ENGRAVABLE_DETAIL_MILLIMETERS;
}

function isLineTooSmallToRead(font, placedLine) {
  return isTextTooSmallToRead(font, placedLine) || (hasLeadingIcon(placedLine) && isDriveIconTooDetailedToEngrave(placedLine));
}

export function isLabelTooSmallToRead(spec, font) {
  return placeLabelTextLines(spec, font).some((placedLine) => isLineTooSmallToRead(font, placedLine));
}
