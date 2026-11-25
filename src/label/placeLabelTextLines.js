import { computeLayout } from './layout.js';
import { listLabelLines } from './listLabelLines.js';
import { fitTextLines } from '../text/fitTextLines.js';

export function placeLabelTextLines(spec, font) {
  const { textZone } = computeLayout(spec);
  return fitTextLines(font, listLabelLines(spec), textZone);
}
