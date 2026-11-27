import { translate } from '../i18n/translate.js';
import { listLabelLines } from './listLabelLines.js';

const FORBIDDEN_FILE_NAME_CHARACTERS = /[\\/:*?"<>|]/g;

function toFileNamePart(text) {
  return text.replace(FORBIDDEN_FILE_NAME_CHARACTERS, '').trim().replace(/\s+/g, '-');
}

function listFileNameParts(spec, language) {
  const hardwareName = translate(language, `hardware.${spec.hardwareType}`);
  const usageNames = spec.usages.map((usage) => translate(language, `usage.${usage}`));
  return [hardwareName, ...listLabelLines(spec).map(({ text }) => text), ...usageNames];
}

export function buildFileName(spec, language) {
  const baseName = listFileNameParts(spec, language).map(toFileNamePart).filter(Boolean).join('-').toLowerCase();
  return `${baseName}.svg`;
}
