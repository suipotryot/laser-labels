import { placeLabelTextLines } from './placeLabelTextLines.js';
import { capHeightPerFontSize } from '../text/fontMetrics.js';
import { hasLeadingIcon } from '../text/fitTextLines.js';
import { thinnestDetailPerHeadRadius } from '../icons/driveIcons.js';
import { thinnestHardwareDetail } from '../icons/hardwareIcons.js';
import { thinnestUsageIconDetail } from '../icons/usageIcons.js';
import { placeHardwareIcon } from './placeHardwareIcon.js';
import { placeUsageIcons } from './placeUsageIcons.js';

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

function hasHardwareIconTooDetailedToEngrave(spec, font) {
  return thinnestHardwareDetail(spec.hardwareType) * placeHardwareIcon(spec, font).scale < MINIMUM_ENGRAVABLE_DETAIL_MILLIMETERS;
}

function isUsageIconTooDetailedToEngrave({ usage, scale }) {
  return thinnestUsageIconDetail(usage) * scale < MINIMUM_ENGRAVABLE_DETAIL_MILLIMETERS;
}

function hasAnyUsageIconTooDetailedToEngrave(spec, font) {
  return placeUsageIcons(spec, font).some(isUsageIconTooDetailedToEngrave);
}

export function hasDetailsTooSmallToEngrave(spec, font) {
  return hasHardwareIconTooDetailedToEngrave(spec, font)
    || hasAnyUsageIconTooDetailedToEngrave(spec, font)
    || placeLabelTextLines(spec, font).some((placedLine) => hasLineDetailsTooSmallToEngrave(font, placedLine));
}
