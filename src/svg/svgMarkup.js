const MICROMETERS_PER_MILLIMETER = 1000;

function roundToMicrometer(millimeters) {
  return Math.round(millimeters * MICROMETERS_PER_MILLIMETER) / MICROMETERS_PER_MILLIMETER;
}

function roundIfNumber(value) {
  return typeof value === 'number' ? roundToMicrometer(value) : value;
}

export function svgMarkup(strings, ...values) {
  return strings.reduce((markup, string, index) => markup + roundIfNumber(values[index - 1]) + string);
}
