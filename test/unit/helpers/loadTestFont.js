import { readFileSync } from 'node:fs';
import { parse } from 'opentype.js/dist/opentype.mjs';

const FONT_FILE = new URL('../../../src/text/fonts/BarlowSemiCondensed-SemiBold.ttf', import.meta.url);

export function loadTestFont() {
  const bytes = readFileSync(FONT_FILE);
  return parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
}
