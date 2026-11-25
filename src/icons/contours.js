const CIRCLE_ARC_HANDLE_RATIO = 0.5523;

export function polygon(corners) {
  const [first, ...others] = corners;
  return [
    { type: 'M', x: first.x, y: first.y },
    ...others.map(({ x, y }) => ({ type: 'L', x, y })),
    { type: 'Z' },
  ];
}

export function rectangle(halfWidth, halfHeight) {
  return polygon([
    { x: -halfWidth, y: -halfHeight },
    { x: -halfWidth, y: halfHeight },
    { x: halfWidth, y: halfHeight },
    { x: halfWidth, y: -halfHeight },
  ]);
}

function quarterTurn({ x, y }) {
  return { x: y, y: -x };
}

export function cross({ armLength, tipHalfWidth, rootHalfWidth }) {
  let armCorners = [
    { x: tipHalfWidth, y: -armLength },
    { x: -tipHalfWidth, y: -armLength },
    { x: -rootHalfWidth, y: -rootHalfWidth },
  ];
  const corners = [];
  for (let arm = 0; arm < 4; arm += 1) {
    corners.push(...armCorners);
    armCorners = armCorners.map(quarterTurn);
  }
  return polygon(corners);
}

export function pointAtAngle(radius, angle) {
  return { x: radius * Math.cos(angle), y: -radius * Math.sin(angle) };
}

function tipCornersOf({ angle, length, halfWidth }) {
  const tip = pointAtAngle(length, angle);
  const towardNextArm = pointAtAngle(halfWidth, angle + Math.PI / 2);
  return [
    { x: tip.x - towardNextArm.x, y: tip.y - towardNextArm.y },
    { x: tip.x + towardNextArm.x, y: tip.y + towardNextArm.y },
  ];
}

function determinant(first, second) {
  return first.x * second.y - first.y * second.x;
}

function cornerBetween(arm, nextArm) {
  const direction = pointAtAngle(1, arm.angle);
  const nextDirection = pointAtAngle(1, nextArm.angle);
  const edgeStart = pointAtAngle(arm.halfWidth, arm.angle + Math.PI / 2);
  const nextEdgeStart = pointAtAngle(nextArm.halfWidth, nextArm.angle - Math.PI / 2);
  const gap = { x: nextEdgeStart.x - edgeStart.x, y: nextEdgeStart.y - edgeStart.y };
  const distanceAlongEdge = determinant(gap, nextDirection) / determinant(direction, nextDirection);
  return { x: edgeStart.x + distanceAlongEdge * direction.x, y: edgeStart.y + distanceAlongEdge * direction.y };
}

export function armedStar(arms) {
  const corners = arms.flatMap((arm, index) => [...tipCornersOf(arm), cornerBetween(arm, arms[(index + 1) % arms.length])]);
  return polygon(corners);
}

export function regularPolygon(cornerCount, radius) {
  const corners = Array.from({ length: cornerCount }, (_, index) => pointAtAngle(radius, (2 * Math.PI * index) / cornerCount));
  return polygon(corners);
}

function midpoint(from, to) {
  return { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
}

function smoothPolygon(corners) {
  const start = midpoint(corners.at(-1), corners[0]);
  const curves = corners.map((corner, index) => {
    const end = midpoint(corner, corners[(index + 1) % corners.length]);
    return { type: 'Q', x1: corner.x, y1: corner.y, x: end.x, y: end.y };
  });
  return [{ type: 'M', x: start.x, y: start.y }, ...curves, { type: 'Z' }];
}

export function roundedStar({ lobeCount, outerRadius, innerRadius }) {
  const cornerCount = 2 * lobeCount;
  const corners = Array.from({ length: cornerCount }, (_, index) => {
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    return pointAtAngle(radius, (2 * Math.PI * index) / cornerCount);
  });
  return smoothPolygon(corners);
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

function fitCoordinateInCircle(key, value, { x, y, radius }) {
  if (key.startsWith('x')) {
    return x + value * radius;
  }
  if (key.startsWith('y')) {
    return y + value * radius;
  }
  return value;
}

export function fitInCircle(commands, targetCircle) {
  return commands.map((command) => Object.fromEntries(
    Object.entries(command).map(([key, value]) => [key, fitCoordinateInCircle(key, value, targetCircle)]),
  ));
}
