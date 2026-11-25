import { findHardwareType } from '../catalog/hardwareTypes.js';

export function labelLines(spec) {
  const driveSize = spec.drive?.size;
  return [findHardwareType(spec.hardwareType).label, spec.dimensions, driveSize].filter(Boolean);
}
