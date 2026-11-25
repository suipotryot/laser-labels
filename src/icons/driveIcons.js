import {
  alternating,
  circle,
  evenlySpacedAngle,
  hollow,
  placeInCircle,
  reachOfRoundedStar,
  rectangle,
  regularPolygon,
  roundedStar,
  solid,
  starOfArms,
  taperedCross,
} from './contours.js';

const UNIT_HEAD_RADIUS = 1;
const SLOT = { halfWidth: 0.72, halfHeight: 0.11 };
const SQUARE = { halfWidth: 0.36, halfHeight: 0.36 };
const HEXAGON = { cornerCount: 6, radius: 0.5 };
const PHILLIPS_CROSS = { armLength: 0.62, tipHalfWidth: 0.07, rootHalfWidth: 0.16 };
const POZIDRIV_STRAIGHT_ARM = { length: 0.62, halfWidth: 0.12 };
const POZIDRIV_DIAGONAL_ARM = { length: 0.5, halfWidth: 0.04 };
const TORX_STAR = { lobeCount: 6, outerRadius: 0.72, innerRadius: 0.36 };
const TORX_PIN_RADIUS = 0.14;

function rimAround(recessReach) {
  return UNIT_HEAD_RADIUS - recessReach;
}

function drawPozidrivRecess() {
  const arms = alternating(POZIDRIV_STRAIGHT_ARM, POZIDRIV_DIAGONAL_ARM, 8);
  return starOfArms(arms.map((arm, index) => ({ ...arm, angle: evenlySpacedAngle(index, arms.length) })));
}

const DRIVE_ICONS = {
  phillips: {
    drawRecess: () => hollow(taperedCross(PHILLIPS_CROSS)),
    thinnestDetail: 2 * PHILLIPS_CROSS.tipHalfWidth,
  },
  pozidriv: {
    drawRecess: () => hollow(drawPozidrivRecess()),
    thinnestDetail: 2 * POZIDRIV_DIAGONAL_ARM.halfWidth,
  },
  torx: {
    drawRecess: () => hollow(roundedStar(TORX_STAR)),
    thinnestDetail: rimAround(reachOfRoundedStar(TORX_STAR)),
  },
  torxTamperResistant: {
    drawRecess: () => [...hollow(roundedStar(TORX_STAR)), ...solid(circle(TORX_PIN_RADIUS))],
    thinnestDetail: Math.min(rimAround(reachOfRoundedStar(TORX_STAR)), 2 * TORX_PIN_RADIUS),
  },
  hexSocket: {
    drawRecess: () => hollow(regularPolygon(HEXAGON)),
    thinnestDetail: rimAround(HEXAGON.radius),
  },
  slotted: {
    drawRecess: () => hollow(rectangle(SLOT)),
    thinnestDetail: 2 * SLOT.halfHeight,
  },
  square: {
    drawRecess: () => hollow(rectangle(SQUARE)),
    thinnestDetail: rimAround(Math.hypot(SQUARE.halfWidth, SQUARE.halfHeight)),
  },
};

function driveIconOf(driveTypeKey) {
  const driveIcon = DRIVE_ICONS[driveTypeKey];
  if (!driveIcon) {
    throw new Error(`No icon for drive type: ${driveTypeKey}`);
  }
  return driveIcon;
}

export function drawDriveIcon(driveTypeKey) {
  return [...solid(circle(UNIT_HEAD_RADIUS)), ...driveIconOf(driveTypeKey).drawRecess()];
}

export function drawDriveIconInCircle(driveTypeKey, targetCircle) {
  return placeInCircle(drawDriveIcon(driveTypeKey), targetCircle);
}

export function thinnestDetailPerHeadRadius(driveTypeKey) {
  return driveIconOf(driveTypeKey).thinnestDetail;
}
