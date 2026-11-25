export function listLabelLines(spec) {
  const driveSize = spec.drive?.size;
  return [spec.dimensions, driveSize].filter(Boolean);
}
