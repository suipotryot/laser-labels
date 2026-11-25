import { computeLayout } from './layout.js';
import { drawHardwareIconInBox } from '../icons/hardwareIcons.js';

function isTallerThanWide({ width, height }) {
  return height > width;
}

export function placeHardwareIcon(spec) {
  const { iconZone } = computeLayout(spec);
  return drawHardwareIconInBox(spec.hardwareType, iconZone, { upright: isTallerThanWide(iconZone) });
}
