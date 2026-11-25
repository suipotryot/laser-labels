import { readFileSync } from 'node:fs';
import { parse } from 'opentype.js/dist/opentype.mjs';

const FONT_FILE = new URL('../../../src/text/fonts/BarlowSemiCondensed-SemiBold.ttf', import.meta.url);

function toArrayBuffer(bytes) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

export function loadTestFont() {
  return parse(toArrayBuffer(readFileSync(FONT_FILE)));
}
