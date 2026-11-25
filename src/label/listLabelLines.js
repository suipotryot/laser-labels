import { findHardwareType } from '../catalog/hardwareTypes.js';

export function listLabelLines(spec) {
  const hardwareName = findHardwareType(spec.hardwareType).name;
  const driveSize = spec.drive?.size;
  return [hardwareName, spec.dimensions, driveSize].filter(Boolean);
}
