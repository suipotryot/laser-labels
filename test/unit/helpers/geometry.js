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

export function pointOnCubicCurve(start, { x1, y1, x2, y2, x, y }, progress) {
  const remaining = 1 - progress;
  return {
    x: remaining ** 3 * start.x + 3 * remaining ** 2 * progress * x1 + 3 * remaining * progress ** 2 * x2 + progress ** 3 * x,
    y: remaining ** 3 * start.y + 3 * remaining ** 2 * progress * y1 + 3 * remaining * progress ** 2 * y2 + progress ** 3 * y,
  };
}

export function sampledPointsOf(contour) {
  const [move, ...segments] = contour.filter(({ type }) => type !== 'Z');
  let segmentStart = move;
  return [move, ...segments.flatMap((segment) => {
    const points = segment.type === 'C'
      ? [0.25, 0.5, 0.75, 1].map((progress) => pointOnCubicCurve(segmentStart, segment, progress))
      : [{ x: segment.x, y: segment.y }];
    segmentStart = segment;
    return points;
  })];
}
