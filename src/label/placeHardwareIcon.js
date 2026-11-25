import { chooseLayout } from './chooseLayout.js';
import { drawHardwareIconInBox } from '../icons/hardwareIcons.js';

export function placeHardwareIcon(spec, font) {
  const { iconZone } = chooseLayout(spec, font);
  return drawHardwareIconInBox(spec.hardwareType, iconZone);
}
