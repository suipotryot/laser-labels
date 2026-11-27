import { FULL_TURN, QUARTER_TURN, arc, closed, ellipse, hollow, pointOnCircle, polyline, rectangle, solid } from './contours.js';

const TREAD_ELLIPSE = { semiMajor: 0.48, semiMinor: 0.16, gridOffset: 0.5, lean: QUARTER_TURN / 2 };
const DROP = { bulbCenter: { x: 0, y: 0.35 }, bulbRadius: 0.65, tipY: -1 };
const REFLECTION = { outerRadius: 0.5, innerRadius: 0.38, fromAngle: (10 / 360) * FULL_TURN, toAngle: (-70 / 360) * FULL_TURN };
const MASONRY = { bottomJointOffset: 0.5 };

const TREAD_ELLIPSE_REACH = TREAD_ELLIPSE.gridOffset + Math.hypot(TREAD_ELLIPSE.semiMajor, TREAD_ELLIPSE.semiMinor) / Math.SQRT2;
const RIM_AROUND_TREAD_ELLIPSES = 1 - TREAD_ELLIPSE_REACH;
const REFLECTION_THICKNESS = REFLECTION.outerRadius - REFLECTION.innerRadius;
const RIM_AROUND_REFLECTION = DROP.bulbRadius - REFLECTION.outerRadius;

function drawSquare() {
  return solid(rectangle({ halfWidth: 1, halfHeight: 1 }));
}

function treadEllipseAt(side) {
  const leansTowardsTheSameWayAsItsDiagonalNeighbour = side.x * side.y;
  return hollow(ellipse({
    center: { x: side.x * TREAD_ELLIPSE.gridOffset, y: side.y * TREAD_ELLIPSE.gridOffset },
    semiMajor: TREAD_ELLIPSE.semiMajor,
    semiMinor: TREAD_ELLIPSE.semiMinor,
    angle: leansTowardsTheSameWayAsItsDiagonalNeighbour * TREAD_ELLIPSE.lean,
  }));
}

function drawTreadPlate() {
  const sides = [-1, 1].flatMap((x) => [-1, 1].map((y) => ({ x, y })));
  return { outline: [...drawSquare(), ...sides.flatMap(treadEllipseAt)], strokes: [] };
}

function drawWaterDropBody() {
  const { bulbCenter, bulbRadius, tipY } = DROP;
  const dropTip = { x: bulbCenter.x, y: tipY };
  const angleFromTopToTangentPoint = Math.acos(bulbRadius / (bulbCenter.y - tipY));
  const rightTangentAngle = QUARTER_TURN - angleFromTopToTangentPoint;
  const leftTangentAngleGoingClockwise = QUARTER_TURN + angleFromTopToTangentPoint - FULL_TURN;
  const rightTangentPoint = pointOnCircle({ center: bulbCenter, radius: bulbRadius }, rightTangentAngle);
  const roundBottom = arc({ center: bulbCenter, radius: bulbRadius, fromAngle: rightTangentAngle, toAngle: leftTangentAngleGoingClockwise });
  return solid(closed([...polyline([dropTip, rightTangentPoint]), ...roundBottom]));
}

function drawReflection() {
  const { outerRadius, innerRadius, fromAngle, toAngle } = REFLECTION;
  const outerCircle = { center: DROP.bulbCenter, radius: outerRadius };
  const innerCircle = { center: DROP.bulbCenter, radius: innerRadius };
  const outerSide = arc({ ...outerCircle, fromAngle, toAngle });
  const innerSide = arc({ ...innerCircle, fromAngle: toAngle, toAngle: fromAngle });
  return hollow(closed([
    { type: 'M', ...pointOnCircle(outerCircle, fromAngle) },
    ...outerSide,
    { type: 'L', ...pointOnCircle(innerCircle, toAngle) },
    ...innerSide,
  ]));
}

function drawWaterDrop() {
  return { outline: [...drawWaterDropBody(), ...drawReflection()], strokes: [] };
}

function drawBrickWall() {
  const { bottomJointOffset } = MASONRY;
  return {
    outline: drawSquare(),
    strokes: [
      ...polyline([{ x: -1, y: 0 }, { x: 1, y: 0 }]),
      ...polyline([{ x: 0, y: -1 }, { x: 0, y: 0 }]),
      ...polyline([{ x: -bottomJointOffset, y: 0 }, { x: -bottomJointOffset, y: 1 }]),
      ...polyline([{ x: bottomJointOffset, y: 0 }, { x: bottomJointOffset, y: 1 }]),
    ],
  };
}

const USAGE_ICONS = {
  metal: { draw: drawTreadPlate, thinnestDetail: Math.min(2 * TREAD_ELLIPSE.semiMinor, RIM_AROUND_TREAD_ELLIPSES) },
  outdoor: { draw: drawWaterDrop, thinnestDetail: Math.min(REFLECTION_THICKNESS, RIM_AROUND_REFLECTION) },
  masonry: { draw: drawBrickWall, thinnestDetail: Math.min(MASONRY.bottomJointOffset, 1 - MASONRY.bottomJointOffset) },
};

function usageIconOf(usageKey) {
  if (!Object.hasOwn(USAGE_ICONS, usageKey)) {
    throw new Error(`No icon for usage: ${usageKey}`);
  }
  return USAGE_ICONS[usageKey];
}

export function drawUsageIcon(usageKey) {
  return usageIconOf(usageKey).draw();
}

export function thinnestUsageIconDetail(usageKey) {
  return usageIconOf(usageKey).thinnestDetail;
}
