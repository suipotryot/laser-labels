import { findHardwareType } from '../catalog/hardwareTypes.js';

export function listLabelLines(spec) {
  const driveSize = spec.drive?.size;
  return [findHardwareType(spec.hardwareType).name, spec.dimensions, driveSize].filter(Boolean);
}
