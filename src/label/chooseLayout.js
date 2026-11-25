import { computeLayout, ORIENTATIONS } from './layout.js';
import { listLabelLines } from './listLabelLines.js';
import { largestFittingFontSize } from '../text/fitTextLines.js';
import { aspectRatioOfHardwareIcon, isHardwareDrawingPending } from '../icons/hardwareIcons.js';

function textSizeIn({ textZone }, lines, font) {
  return lines.length > 0 ? largestFittingFontSize(font, lines, textZone) : 1;
}

function drawingHeightIn({ iconZone }, iconAspectRatio) {
  return Math.min(iconZone.height, iconZone.width / iconAspectRatio);
}

function iconAspectRatioOf(spec) {
  return isHardwareDrawingPending(spec.hardwareType) ? null : aspectRatioOfHardwareIcon(spec.hardwareType);
}

export function chooseLayout(spec, font) {
  const lines = listLabelLines(spec);
  const iconAspectRatio = iconAspectRatioOf(spec);
  if (iconAspectRatio === null) {
    return computeLayout(spec, ORIENTATIONS[0], null);
  }
  const scoreOf = (layout) => textSizeIn(layout, lines, font) * drawingHeightIn(layout, iconAspectRatio);
  const layouts = ORIENTATIONS.map((orientation) => computeLayout(spec, orientation, iconAspectRatio));
  return layouts.reduce((best, layout) => (scoreOf(layout) > scoreOf(best) ? layout : best));
}
