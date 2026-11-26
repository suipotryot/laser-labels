import { chooseLayout } from './chooseLayout.js';
import { splitIconZone } from './splitIconZone.js';
import { drawUsageIcon } from '../icons/usageIcons.js';
import { placeTogetherInBox } from '../icons/contours.js';

function placeUsageIconInBox(usage, box) {
  const { placedDrawings: [outline], scale } = placeTogetherInBox([drawUsageIcon(usage)], box);
  return { usage, outline, scale };
}

export function placeUsageIcons(spec, font) {
  const { iconZone } = chooseLayout(spec, font);
  const { usageBoxes } = splitIconZone(iconZone, spec.usages.length);
  return spec.usages.map((usage, index) => placeUsageIconInBox(usage, usageBoxes[index]));
}
