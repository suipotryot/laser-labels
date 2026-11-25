import { labelLines } from './labelLines.js';

const FORBIDDEN_FILE_NAME_CHARACTERS = /[\\/:*?"<>|]/g;

function toFileNamePart(line) {
  return line.replace(FORBIDDEN_FILE_NAME_CHARACTERS, '').trim().split(/\s+/).join('-');
}

export function buildFileName(spec) {
  return `${labelLines(spec).map(toFileNamePart).filter(Boolean).join('-').toLowerCase()}.svg`;
}
