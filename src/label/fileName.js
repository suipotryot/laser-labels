import { findHardwareType } from '../catalog/hardwareTypes.js';
import { listLabelLines } from './listLabelLines.js';

const FORBIDDEN_FILE_NAME_CHARACTERS = /[\\/:*?"<>|]/g;

function toFileNamePart(text) {
  return text.replace(FORBIDDEN_FILE_NAME_CHARACTERS, '').trim().replace(/\s+/g, '-');
}

function listFileNameParts(spec) {
  const hardwareName = findHardwareType(spec.hardwareType).name;
  return [hardwareName, ...listLabelLines(spec).map(({ text }) => text)];
}

export function buildFileName(spec) {
  const baseName = listFileNameParts(spec).map(toFileNamePart).filter(Boolean).join('-').toLowerCase();
  return `${baseName}.svg`;
}
