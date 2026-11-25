const DIMENSIONS_SCALE = 1.5;

function dimensionsLine(spec) {
  return spec.dimensions ? { text: spec.dimensions, scale: DIMENSIONS_SCALE } : null;
}

function driveLine(spec) {
  return spec.drive ? { text: spec.drive.size, leadingIcon: spec.drive.type } : null;
}

export function listLabelLines(spec) {
  return [dimensionsLine(spec), driveLine(spec)].filter(Boolean);
}
