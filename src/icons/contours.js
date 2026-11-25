const CIRCLE_ARC_HANDLE_RATIO = 0.5523;
const PARALLEL_TOLERANCE = 1e-9;

export function polyline(points) {
  const [first, ...others] = points;
  return [{ type: 'M', x: first.x, y: first.y }, ...others.map(({ x, y }) => ({ type: 'L', x, y }))];
}

export function polygon(corners) {
  return [...polyline(corners), { type: 'Z' }];
}

function towards(from, to, distance) {
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  return { x: from.x + ((to.x - from.x) * distance) / length, y: from.y + ((to.y - from.y) * distance) / length };
}

function cornerSegments(corner, previous, next) {
  if (!corner.rounding) {
    return [{ type: 'L', x: corner.x, y: corner.y }];
  }
  const entry = towards(corner, previous, corner.rounding);
  const exit = towards(corner, next, corner.rounding);
  return [{ type: 'L', ...entry }, { type: 'Q', x1: corner.x, y1: corner.y, x: exit.x, y: exit.y }];
}

export function polygonWithRoundedCorners(corners) {
  const [first, ...others] = corners.flatMap((corner, index) => cornerSegments(corner, corners.at(index - 1), corners[(index + 1) % corners.length]));
  return [{ type: 'M', x: first.x, y: first.y }, ...others, { type: 'Z' }];
}

export function rectangle({ halfWidth, halfHeight }) {
  return polygon([
    { x: -halfWidth, y: -halfHeight },
    { x: -halfWidth, y: halfHeight },
    { x: halfWidth, y: halfHeight },
    { x: halfWidth, y: -halfHeight },
  ]);
}

export function evenlySpacedAngle(index, count) {
  return (2 * Math.PI * index) / count;
}

export function alternating(first, second, count) {
  return Array.from({ length: count }, (_, index) => (index % 2 === 0 ? first : second));
}

function pointAtAngle(radius, angle) {
  return { x: radius * Math.cos(angle), y: -radius * Math.sin(angle) };
}

function turnedBy({ x, y }, angle) {
  return {
    x: x * Math.cos(angle) + y * Math.sin(angle),
    y: -x * Math.sin(angle) + y * Math.cos(angle),
  };
}

export function taperedCross({ armLength, tipHalfWidth, rootHalfWidth }) {
  const armCorners = [
    { x: tipHalfWidth, y: -armLength },
    { x: -tipHalfWidth, y: -armLength },
    { x: -rootHalfWidth, y: -rootHalfWidth },
  ];
  const corners = [0, 1, 2, 3].flatMap((quarter) => armCorners.map((corner) => turnedBy(corner, evenlySpacedAngle(quarter, 4))));
  return polygon(corners);
}

function sideTowardNextArm({ angle, halfWidth }) {
  return pointAtAngle(halfWidth, angle + Math.PI / 2);
}

function tipCornersOf(arm) {
  const tip = pointAtAngle(arm.length, arm.angle);
  const side = sideTowardNextArm(arm);
  return [
    { x: tip.x - side.x, y: tip.y - side.y },
    { x: tip.x + side.x, y: tip.y + side.y },
  ];
}

function edgeFacingNextArm(arm) {
  return { point: sideTowardNextArm(arm), direction: pointAtAngle(1, arm.angle) };
}

function edgeFacingPreviousArm(arm) {
  const side = sideTowardNextArm(arm);
  return { point: { x: -side.x, y: -side.y }, direction: pointAtAngle(1, arm.angle) };
}

function determinant(first, second) {
  return first.x * second.y - first.y * second.x;
}

function intersectionOf(firstLine, secondLine) {
  const crossing = determinant(firstLine.direction, secondLine.direction);
  if (Math.abs(crossing) < PARALLEL_TOLERANCE) {
    throw new Error('Cannot join two parallel arms');
  }
  const gap = { x: secondLine.point.x - firstLine.point.x, y: secondLine.point.y - firstLine.point.y };
  const distanceAlongFirstLine = determinant(gap, secondLine.direction) / crossing;
  return {
    x: firstLine.point.x + distanceAlongFirstLine * firstLine.direction.x,
    y: firstLine.point.y + distanceAlongFirstLine * firstLine.direction.y,
  };
}

function cornerBetween(arm, nextArm) {
  return intersectionOf(edgeFacingNextArm(arm), edgeFacingPreviousArm(nextArm));
}

export function starOfArms(arms) {
  const corners = arms.flatMap((arm, index) => [...tipCornersOf(arm), cornerBetween(arm, arms[(index + 1) % arms.length])]);
  return polygon(corners);
}

export function regularPolygon({ cornerCount, radius }) {
  const corners = Array.from({ length: cornerCount }, (_, index) => pointAtAngle(radius, evenlySpacedAngle(index, cornerCount)));
  return polygon(corners);
}

function midpoint(from, to) {
  return { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
}

function roundedPolygon(corners) {
  const start = midpoint(corners.at(-1), corners[0]);
  const curves = corners.map((corner, index) => {
    const end = midpoint(corner, corners[(index + 1) % corners.length]);
    return { type: 'Q', x1: corner.x, y1: corner.y, x: end.x, y: end.y };
  });
  return [{ type: 'M', x: start.x, y: start.y }, ...curves, { type: 'Z' }];
}

export function roundedStar({ lobeCount, outerRadius, innerRadius }) {
  const radii = alternating(outerRadius, innerRadius, 2 * lobeCount);
  return roundedPolygon(radii.map((radius, index) => pointAtAngle(radius, evenlySpacedAngle(index, radii.length))));
}

export function reachOfRoundedStar({ lobeCount, outerRadius, innerRadius }) {
  const midpointBesideLobeTip = (innerRadius * Math.cos(Math.PI / lobeCount) + outerRadius) / 2;
  return (midpointBesideLobeTip + outerRadius) / 2;
}

export function circle(radius) {
  const handle = radius * CIRCLE_ARC_HANDLE_RATIO;
  return [
    { type: 'M', x: radius, y: 0 },
    { type: 'C', x1: radius, y1: handle, x2: handle, y2: radius, x: 0, y: radius },
    { type: 'C', x1: -handle, y1: radius, x2: -radius, y2: handle, x: -radius, y: 0 },
    { type: 'C', x1: -radius, y1: -handle, x2: -handle, y2: -radius, x: 0, y: -radius },
    { type: 'C', x1: handle, y1: -radius, x2: radius, y2: -handle, x: radius, y: 0 },
    { type: 'Z' },
  ];
}

const COORDINATE_PAIRS = [['x', 'y'], ['x1', 'y1'], ['x2', 'y2']];

function withMovedPoints(command, movePoint) {
  const movedCommand = { ...command };
  for (const [xKey, yKey] of COORDINATE_PAIRS.filter(([xKey]) => xKey in command)) {
    const moved = movePoint({ x: command[xKey], y: command[yKey] });
    movedCommand[xKey] = moved.x;
    movedCommand[yKey] = moved.y;
  }
  return movedCommand;
}

function movedDrawing(drawing, movePoint) {
  return drawing.map((command) => withMovedPoints(command, movePoint));
}

export function placeInCircle(unitDrawing, { x, y, radius }) {
  return movedDrawing(unitDrawing, (point) => ({ x: x + point.x * radius, y: y + point.y * radius }));
}

function spanOf(values) {
  const start = Math.min(...values);
  return { start, size: Math.max(...values) - start };
}

function pointsAndControlPointsOf(command) {
  return COORDINATE_PAIRS.filter(([xKey]) => xKey in command).map(([xKey, yKey]) => ({ x: command[xKey], y: command[yKey] }));
}

function extentOf(drawing) {
  const points = drawing.flatMap(pointsAndControlPointsOf);
  const horizontal = spanOf(points.map(({ x }) => x));
  const vertical = spanOf(points.map(({ y }) => y));
  return { left: horizontal.start, top: vertical.start, width: horizontal.size, height: vertical.size };
}

export function aspectRatioOf(drawings) {
  const { width, height } = extentOf(drawings.flat());
  return width / height;
}

export function placeTogetherInBox(drawings, box) {
  const extent = extentOf(drawings.flat());
  if (extent.width === 0 && extent.height === 0) {
    throw new Error('Cannot place a drawing without extent');
  }
  const scale = Math.min(box.width / extent.width, box.height / extent.height);
  const placedLeft = box.x + (box.width - extent.width * scale) / 2;
  const placedTop = box.y + (box.height - extent.height * scale) / 2;
  const placePoint = ({ x, y }) => ({ x: placedLeft + (x - extent.left) * scale, y: placedTop + (y - extent.top) * scale });
  return { placedDrawings: drawings.map((drawing) => movedDrawing(drawing, placePoint)), scale };
}

function signedAreaOnScreen(contour) {
  const points = contour.filter((command) => command.type !== 'Z');
  return points.reduce((area, point, index) => {
    const next = points[(index + 1) % points.length];
    return area + (point.x * next.y - next.x * point.y) / 2;
  }, 0);
}

function isClockwiseOnScreen(contour) {
  return signedAreaOnScreen(contour) > 0;
}

function reversedSegment(segment, start) {
  const end = { x: start.x, y: start.y };
  if (segment.type === 'L') {
    return { type: 'L', ...end };
  }
  if (segment.type === 'Q') {
    return { type: 'Q', x1: segment.x1, y1: segment.y1, ...end };
  }
  if (segment.type === 'C') {
    return { type: 'C', x1: segment.x2, y1: segment.y2, x2: segment.x1, y2: segment.y1, ...end };
  }
  throw new Error(`Cannot reverse a ${segment.type} segment`);
}

function reversed(contour) {
  const [move, ...segments] = contour.filter((command) => command.type !== 'Z');
  const reversedSegments = segments.map((segment, index) => reversedSegment(segment, index === 0 ? move : segments[index - 1]));
  const lastEnd = segments.at(-1);
  return [{ type: 'M', x: lastEnd.x, y: lastEnd.y }, ...reversedSegments.reverse(), { type: 'Z' }];
}

export function hollow(contour) {
  return isClockwiseOnScreen(contour) ? reversed(contour) : contour;
}

export function solid(contour) {
  return isClockwiseOnScreen(contour) ? contour : reversed(contour);
}
