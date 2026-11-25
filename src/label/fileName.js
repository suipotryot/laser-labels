import { listLabelLines } from './listLabelLines.js';

const FORBIDDEN_FILE_NAME_CHARACTERS = /[\\/:*?"<>|]/g;

function toFileNamePart(line) {
  return line.replace(FORBIDDEN_FILE_NAME_CHARACTERS, '').trim().replace(/\s+/g, '-');
}

export function buildFileName(spec) {
  const baseName = listLabelLines(spec).map(toFileNamePart).filter(Boolean).join('-').toLowerCase();
  return `${baseName}.svg`;
}
