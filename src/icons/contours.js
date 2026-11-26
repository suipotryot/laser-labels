export const FLOATING_POINT_TOLERANCE = 1e-9;
export const QUARTER_TURN = Math.PI / 2;
export const HALF_TURN = Math.PI;
export const FULL_TURN = 2 * Math.PI;

export function polyline(points) {
  const [first, ...others] = points;
  return [{ type: 'M', x: first.x, y: first.y }, ...others.map(({ x, y }) => ({ type: 'L', x, y }))];
}

export function quadraticCurve(control, end) {
  return { type: 'Q', x1: control.x, y1: control.y, x: end.x, y: end.y };
}

export function cubicCurve(firstControl, secondControl, end) {
  return { type: 'C', x1: firstControl.x, y1: firstControl.y, x2: secondControl.x, y2: secondControl.y, x: end.x, y: end.y };
}

export function closed(path) {
  return [...path, { type: 'Z' }];
}

function polygon(corners) {
  return closed(polyline(corners));
}

function nextAround(items, index) {
  return items[(index + 1) % items.length];
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
  return [{ type: 'L', ...entry }, quadraticCurve(corner, exit)];
}

function roundingOf(corner) {
  return corner.rounding ?? 0;
}

function isDrawableRounding(rounding) {
  return rounding === undefined || (Number.isFinite(rounding) && rounding >= 0);
}

function doRoundingsOverflowASide(corners) {
  return corners.some((corner, index) => {
    const next = nextAround(corners, index);
    const sideLength = Math.hypot(next.x - corner.x, next.y - corner.y);
    return roundingOf(corner) + roundingOf(next) > sideLength + FLOATING_POINT_TOLERANCE;
  });
}

export function polygonWithRoundedCorners(corners) {
  if (!corners.every(({ rounding }) => isDrawableRounding(rounding))) {
    throw new Error('Roundings must be finite positive numbers');
  }
  if (doRoundingsOverflowASide(corners)) {
    throw new Error('Roundings longer than their side would make the outline cross itself');
  }
  const [first, ...others] = corners.flatMap((corner, index) => cornerSegments(corner, corners.at(index - 1), nextAround(corners, index)));
  return closed([{ type: 'M', x: first.x, y: first.y }, ...others]);
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
  return (FULL_TURN * index) / count;
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
  return pointAtAngle(halfWidth, angle + QUARTER_TURN);
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
  if (Math.abs(crossing) < FLOATING_POINT_TOLERANCE) {
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
  const corners = arms.flatMap((arm, index) => [...tipCornersOf(arm), cornerBetween(arm, nextAround(arms, index))]);
  return polygon(corners);
}

export function regularPolygon({ cornerCount, radius }) {
  const corners = Array.from({ length: cornerCount }, (_, index) => pointAtAngle(radius, evenlySpacedAngle(index, cornerCount)));
  return polygon(corners);
}

export function apothemOf({ cornerCount, radius }) {
  return radius * Math.cos(HALF_TURN / cornerCount);
}

function midpoint(from, to) {
  return { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
}

function roundedPolygon(corners) {
  const start = midpoint(corners.at(-1), corners[0]);
  const curves = corners.map((corner, index) => {
    const end = midpoint(corner, nextAround(corners, index));
    return quadraticCurve(corner, end);
  });
  return closed([{ type: 'M', x: start.x, y: start.y }, ...curves]);
}

export function roundedStar({ lobeCount, outerRadius, innerRadius }) {
  const radii = alternating(outerRadius, innerRadius, 2 * lobeCount);
  return roundedPolygon(radii.map((radius, index) => pointAtAngle(radius, evenlySpacedAngle(index, radii.length))));
}

export function reachOfRoundedStar({ lobeCount, outerRadius, innerRadius }) {
  const midpointBesideLobeTip = (innerRadius * Math.cos(Math.PI / lobeCount) + outerRadius) / 2;
  return (midpointBesideLobeTip + outerRadius) / 2;
}

export function pointOnCircle({ center, radius }, angle) {
  const offset = pointAtAngle(radius, angle);
  return { x: center.x + offset.x, y: center.y + offset.y };
}

function tangentTowardsIncreasingAngle(angle, length) {
  return { x: -Math.sin(angle) * length, y: -Math.cos(angle) * length };
}

function bezierHandleLengthFor(sweep, radius) {
  return (4 / 3) * Math.tan(sweep / 4) * radius;
}

function arcPieceUpToAQuarter(circleOnScreen, fromAngle, toAngle) {
  const handle = bezierHandleLengthFor(toAngle - fromAngle, circleOnScreen.radius);
  const start = pointOnCircle(circleOnScreen, fromAngle);
  const end = pointOnCircle(circleOnScreen, toAngle);
  const startTangent = tangentTowardsIncreasingAngle(fromAngle, handle);
  const endTangent = tangentTowardsIncreasingAngle(toAngle, handle);
  return cubicCurve(
    { x: start.x + startTangent.x, y: start.y + startTangent.y },
    { x: end.x - endTangent.x, y: end.y - endTangent.y },
    end,
  );
}

function quarterTurnAnglesStrictlyBetween(fromAngle, toAngle) {
  const low = Math.min(fromAngle, toAngle);
  const high = Math.max(fromAngle, toAngle);
  const firstQuarterTurn = Math.ceil(low / QUARTER_TURN);
  const quarterTurnCount = Math.floor(high / QUARTER_TURN) - firstQuarterTurn + 1;
  const angles = Array.from({ length: quarterTurnCount }, (_, index) => (firstQuarterTurn + index) * QUARTER_TURN)
    .filter((angle) => angle > low + FLOATING_POINT_TOLERANCE && angle < high - FLOATING_POINT_TOLERANCE);
  return fromAngle < toAngle ? angles : angles.reverse();
}

function throwIfArcCannotBeDrawn({ center, radius, fromAngle, toAngle }) {
  if (!Number.isFinite(fromAngle) || !Number.isFinite(toAngle)) {
    throw new Error('Arc angles must be finite numbers');
  }
  if (!Number.isFinite(radius)) {
    throw new Error('Arc radius must be a finite number');
  }
  if (!Number.isFinite(center.x) || !Number.isFinite(center.y)) {
    throw new Error('Arc center must be made of finite numbers');
  }
}

export function arc({ center, radius, fromAngle, toAngle }) {
  throwIfArcCannotBeDrawn({ center, radius, fromAngle, toAngle });
  if (fromAngle === toAngle) {
    return [];
  }
  const angles = [fromAngle, ...quarterTurnAnglesStrictlyBetween(fromAngle, toAngle), toAngle];
  return angles.slice(1).map((angle, index) => arcPieceUpToAQuarter({ center, radius }, angles[index], angle));
}

export function circleAround({ center, radius }) {
  const start = pointOnCircle({ center, radius }, 0);
  return closed([{ type: 'M', ...start }, ...arc({ center, radius, fromAngle: 0, toAngle: -FULL_TURN })]);
}

export function circle(radius) {
  return circleAround({ center: { x: 0, y: 0 }, radius });
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
    const next = nextAround(points, index);
    return area + (point.x * next.y - next.x * point.y) / 2;
  }, 0);
}

function isClockwiseOnScreen(contour) {
  return signedAreaOnScreen(contour) > 0;
}

export function reversedSegment(segment, originalStart) {
  const end = { x: originalStart.x, y: originalStart.y };
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
  return closed([{ type: 'M', x: lastEnd.x, y: lastEnd.y }, ...reversedSegments.reverse()]);
}

export function hollow(contour) {
  return isClockwiseOnScreen(contour) ? reversed(contour) : contour;
}

export function solid(contour) {
  return isClockwiseOnScreen(contour) ? contour : reversed(contour);
}
