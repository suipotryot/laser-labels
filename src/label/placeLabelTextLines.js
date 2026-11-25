import { chooseLayout } from './chooseLayout.js';
import { listLabelLines } from './listLabelLines.js';
import { fitTextLines } from '../text/fitTextLines.js';

export function placeLabelTextLines(spec, font) {
  const { orientation, textZone } = chooseLayout(spec, font);
  return fitTextLines(font, listLabelLines(spec), textZone, { centered: orientation === 'stacked' });
}
