export const FLOATING_POINT_TOLERANCE = 1e-9;

export function isAlmostEqual(actual, expected) {
  return Math.abs(actual - expected) < FLOATING_POINT_TOLERANCE;
}

export function contoursOf(commands) {
  const contours = [];
  for (const command of commands) {
    if (command.type === 'M') {
      contours.push([]);
    }
    contours.at(-1).push(command);
  }
  return contours;
}

export function cornersOf(contour) {
  return contour.filter((command) => command.type === 'M' || command.type === 'L');
}

export function onCurvePointsOf(contour) {
  return contour.filter((command) => command.type !== 'Z');
}

export function extentOf(points) {
  const pointsWithCoordinates = points.filter((point) => 'x' in point);
  const xs = pointsWithCoordinates.map(({ x }) => x);
  const ys = pointsWithCoordinates.map(({ y }) => y);
  return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
}

export function windingOf(contour) {
  const points = onCurvePointsOf(contour);
  const signedArea = points.reduce((area, point, index) => {
    const next = points[(index + 1) % points.length];
    return area + (point.x * next.y - next.x * point.y) / 2;
  }, 0);
  return signedArea > 0 ? 'clockwise' : 'counterclockwise';
}
