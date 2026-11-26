import { QUARTER_TURN, arc, closed, pointOnCircle, polyline, solid } from './contours.js';

const I_BEAM = { halfWidth: 0.8, flangeThickness: 0.4, halfWebWidth: 0.2 };
const DROP = { bulbCenter: { x: 0, y: 0.35 }, bulbRadius: 0.65, tipY: -1 };
const MASONRY = { gap: 0.1, halfOffset: 0.5 };

function drawIBeamSection() {
  const { halfWidth, flangeThickness, halfWebWidth } = I_BEAM;
  const webTop = -1 + flangeThickness;
  const webBottom = 1 - flangeThickness;
  const rightHalf = [
    { x: halfWidth, y: -1 },
    { x: halfWidth, y: webTop },
    { x: halfWebWidth, y: webTop },
    { x: halfWebWidth, y: webBottom },
    { x: halfWidth, y: webBottom },
    { x: halfWidth, y: 1 },
  ];
  const leftHalf = rightHalf.map(({ x, y }) => ({ x: -x, y })).reverse();
  return solid(closed(polyline([...rightHalf, ...leftHalf])));
}

function drawWaterDrop() {
  const { bulbCenter, bulbRadius, tipY } = DROP;
  const tip = { x: bulbCenter.x, y: tipY };
  const angleBetweenAxisAndTangentPoint = Math.acos(bulbRadius / (bulbCenter.y - tipY));
  const rightTangentAngle = QUARTER_TURN - angleBetweenAxisAndTangentPoint;
  const leftTangentAngle = angleBetweenAxisAndTangentPoint - 3 * QUARTER_TURN;
  const rightTangentPoint = pointOnCircle({ center: bulbCenter, radius: bulbRadius }, rightTangentAngle);
  const bulb = arc({ center: bulbCenter, radius: bulbRadius, fromAngle: rightTangentAngle, toAngle: leftTangentAngle });
  return solid(closed([...polyline([tip, rightTangentPoint]), ...bulb]));
}

function brick({ left, right, top, bottom }) {
  return solid(closed(polyline([
    { x: left, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
  ])));
}

function drawBrickWall() {
  const { gap, halfOffset } = MASONRY;
  const halfGap = gap / 2;
  const topRow = { top: -1, bottom: -halfGap };
  const bottomRow = { top: halfGap, bottom: 1 };
  return [
    ...brick({ ...topRow, left: -1, right: -halfGap }),
    ...brick({ ...topRow, left: halfGap, right: 1 }),
    ...brick({ ...bottomRow, left: -1, right: -halfOffset - halfGap }),
    ...brick({ ...bottomRow, left: -halfOffset + halfGap, right: halfOffset - halfGap }),
    ...brick({ ...bottomRow, left: halfOffset + halfGap, right: 1 }),
  ];
}

const USAGE_ICONS = {
  metal: { draw: drawIBeamSection, thinnestDetail: Math.min(I_BEAM.flangeThickness, 2 * I_BEAM.halfWebWidth) },
  outdoor: { draw: drawWaterDrop, thinnestDetail: 2 * DROP.bulbRadius },
  masonry: { draw: drawBrickWall, thinnestDetail: MASONRY.gap },
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
