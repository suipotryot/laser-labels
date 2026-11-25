import { computeLayout, ORIENTATIONS } from './layout.js';
import { listLabelLines } from './listLabelLines.js';
import { largestFittingFontSize } from '../text/fitTextLines.js';
import { aspectRatioOfHardwareIcon } from '../icons/hardwareIcons.js';

const TEXT_WEIGHT = 2;

function textSizeIn({ textZone }, lines, font) {
  return lines.length > 0 ? largestFittingFontSize(font, lines, textZone) : 1;
}

function drawingHeightIn({ iconZone }, iconAspectRatio) {
  return Math.min(iconZone.height, iconZone.width / iconAspectRatio);
}

export function chooseLayout(spec, font) {
  const lines = listLabelLines(spec);
  const iconAspectRatio = aspectRatioOfHardwareIcon(spec.hardwareType);
  const scoreOf = (layout) => textSizeIn(layout, lines, font) ** TEXT_WEIGHT * drawingHeightIn(layout, iconAspectRatio);
  const layouts = ORIENTATIONS.map((orientation) => computeLayout(spec, orientation, iconAspectRatio));
  return layouts.reduce((best, layout) => (scoreOf(layout) > scoreOf(best) ? layout : best));
}
