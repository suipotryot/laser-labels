import { findHardwareType } from '../catalog/hardwareTypes.js';
import { findDriveType } from '../catalog/driveTypes.js';

export class LabelSpecError extends Error {
  constructor(field, reason) {
    super(`Invalid label field "${field}": ${reason}`);
    this.name = 'LabelSpecError';
    this.field = field;
    this.reason = reason;
  }
}

function isPositiveNumber(value) {
  return Number.isFinite(value) && value > 0;
}

function readMillimeters(fields, field) {
  const millimeters = Number(fields[field].replace(',', '.'));
  if (!isPositiveNumber(millimeters)) {
    throw new LabelSpecError(field, 'notAPositiveNumber');
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

function readDrive(fields, hardwareType) {
  if (fields.driveType === '') {
    return null;
  }
  if (!hardwareType.hasDrive) {
    throw new LabelSpecError('driveType', 'notApplicable');
  }
  const driveType = findDriveType(fields.driveType);
  if (!driveType) {
    throw new LabelSpecError('driveType', 'unknown');
  }
  if (!driveType.sizes.includes(fields.driveSize)) {
    throw new LabelSpecError('driveSize', 'unknown');
  }
  return { type: fields.driveType, size: fields.driveSize };
}

export function readLabelSpec(fields) {
  const hardwareType = readHardwareType(fields);
  return {
    width: readMillimeters(fields, 'width'),
    height: readMillimeters(fields, 'height'),
    hardwareType: hardwareType.key,
    drive: readDrive(fields, hardwareType),
    dimensions: fields.dimensions.trim(),
    hasFrame: fields.hasFrame,
  };
}
