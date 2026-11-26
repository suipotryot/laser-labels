import { findHardwareType } from '../catalog/hardwareTypes.js';
import { findDriveType, NO_DRIVE } from '../catalog/driveTypes.js';
import { findUsageType } from '../catalog/usageTypes.js';

export class LabelSpecError extends Error {
  constructor(field, reason, details = {}) {
    super(`Invalid label field "${field}": ${reason}`);
    this.name = 'LabelSpecError';
    this.field = field;
    this.reason = reason;
    Object.assign(this, details);
  }
}

const MINIMUM_LABEL_SIDE_MILLIMETERS = 5;
const DECIMAL_NOTATION = /^\d+([.,]\d+)?$/;

function isPositiveNumber(value) {
  return Number.isFinite(value) && value > 0;
}

function parseDecimal(text) {
  const trimmedText = text.trim();
  return DECIMAL_NOTATION.test(trimmedText) ? Number(trimmedText.replace(',', '.')) : NaN;
}

function readLabelSide(fields, fieldName) {
  const millimeters = parseDecimal(fields[fieldName]);
  if (!isPositiveNumber(millimeters)) {
    throw new LabelSpecError(fieldName, 'notAPositiveNumber');
  }
  if (millimeters < MINIMUM_LABEL_SIDE_MILLIMETERS) {
    throw new LabelSpecError(fieldName, 'tooSmall');
  }
  return millimeters;
}

function readHardwareType(fields) {
  const hardwareType = findHardwareType(fields.hardwareType);
  if (!hardwareType) {
    throw new LabelSpecError('hardwareType', 'unknown');
  }
  return hardwareType;
}

function readDriveType(fields, hardwareType) {
  if (!hardwareType.hasDrive) {
    throw new LabelSpecError('driveType', 'notApplicable');
  }
  const driveType = findDriveType(fields.driveType);
  if (!driveType) {
    throw new LabelSpecError('driveType', 'unknown');
  }
  return driveType;
}

function readDriveSize(fields, driveType) {
  if (!driveType.sizes.includes(fields.driveSize)) {
    throw new LabelSpecError('driveSize', 'unknown');
  }
  return fields.driveSize;
}

function readDrive(fields, hardwareType) {
  if (fields.driveType === NO_DRIVE) {
    return null;
  }
  const driveType = readDriveType(fields, hardwareType);
  return { type: driveType.key, size: readDriveSize(fields, driveType) };
}

const NON_PRINTABLE_CHARACTERS = /\p{C}/u;
const STANDALONE_ACCENT = /\p{M}/u;

function isEngravable(font, character) {
  return font.hasChar(character) && !STANDALONE_ACCENT.test(character);
}

function listUnengravableCharacters(font, text) {
  return [...new Set(text)].filter((character) => !isEngravable(font, character));
}

const ANY_KIND_OF_SPACE = /\p{Zs}/gu;

function normalizeTypedText(text) {
  return text.normalize('NFC').replace(ANY_KIND_OF_SPACE, ' ').trim();
}

const MAXIMUM_DIMENSIONS_LENGTH = 40;

function exceedsDimensionsLength(text) {
  return [...text].length > MAXIMUM_DIMENSIONS_LENGTH;
}

function readDimensions(fields, font) {
  const dimensions = normalizeTypedText(fields.dimensions);
  if (exceedsDimensionsLength(dimensions)) {
    throw new LabelSpecError('dimensions', 'tooLong');
  }
  if (NON_PRINTABLE_CHARACTERS.test(dimensions)) {
    throw new LabelSpecError('dimensions', 'nonPrintableCharacters');
  }
  const unengravableCharacters = listUnengravableCharacters(font, dimensions);
  if (unengravableCharacters.length > 0) {
    throw new LabelSpecError('dimensions', 'unengravableCharacters', { characters: unengravableCharacters });
  }
  return dimensions;
}

function readUsages(fields) {
  if (!fields.usages.every((usage) => findUsageType(usage))) {
    throw new LabelSpecError('usages', 'unknown');
  }
  if (new Set(fields.usages).size !== fields.usages.length) {
    throw new LabelSpecError('usages', 'duplicated');
  }
  return fields.usages;
}

export function readLabelSpec(fields, font) {
  const hardwareType = readHardwareType(fields);
  return {
    width: readLabelSide(fields, 'width'),
    height: readLabelSide(fields, 'height'),
    hardwareType: hardwareType.key,
    drive: readDrive(fields, hardwareType),
    dimensions: readDimensions(fields, font),
    hasFrame: fields.hasFrame,
    usages: readUsages(fields),
  };
}
