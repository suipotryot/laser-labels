import { findHardwareType } from '../catalog/hardwareTypes.js';
import { findDriveType, NO_DRIVE } from '../catalog/driveTypes.js';

export class LabelSpecError extends Error {
  constructor(field, reason) {
    super(`Invalid label field "${field}": ${reason}`);
    this.name = 'LabelSpecError';
    this.field = field;
    this.reason = reason;
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

const CONTROL_CHARACTERS = /\p{Cc}/u;

function readDimensions(fields) {
  const dimensions = fields.dimensions.trim();
  if (CONTROL_CHARACTERS.test(dimensions)) {
    throw new LabelSpecError('dimensions', 'invalidCharacters');
  }
  return dimensions;
}

export function readLabelSpec(fields) {
  const hardwareType = readHardwareType(fields);
  return {
    width: readLabelSide(fields, 'width'),
    height: readLabelSide(fields, 'height'),
    hardwareType: hardwareType.key,
    drive: readDrive(fields, hardwareType),
    dimensions: readDimensions(fields),
    hasFrame: fields.hasFrame,
  };
}
