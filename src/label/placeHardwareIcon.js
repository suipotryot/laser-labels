import { chooseLayout } from './chooseLayout.js';
import { splitIconZone } from './splitIconZone.js';
import { drawHardwareIconInBox } from '../icons/hardwareIcons.js';

export function placeHardwareIcon(spec, font) {
  const { iconZone } = chooseLayout(spec, font);
  const { drawingZone } = splitIconZone(iconZone, spec.usages.length);
  return drawHardwareIconInBox(spec.hardwareType, drawingZone);
}
