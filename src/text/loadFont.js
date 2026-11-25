import { parse } from 'opentype.js/dist/opentype.mjs';
import fontUrl from './fonts/BarlowSemiCondensed-SemiBold.ttf';

export async function loadFont() {
  const response = await fetch(fontUrl);
  if (!response.ok) {
    throw new Error(`Could not load the engraving font: HTTP ${response.status}`);
  }
  return parse(await response.arrayBuffer());
}
