function dimensionsLine(spec) {
  return spec.dimensions ? { text: spec.dimensions } : null;
}

function driveLine(spec) {
  return spec.drive ? { text: spec.drive.size, leadingIcon: spec.drive.type } : null;
}

export function listLabelLines(spec) {
  return [dimensionsLine(spec), driveLine(spec)].filter(Boolean);
}
