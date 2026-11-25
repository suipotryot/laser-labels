import {
  alternating,
  circle,
  evenlySpacedAngle,
  hollow,
  placeInCircle,
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

function drawPozidrivRecess() {
  const arms = alternating(POZIDRIV_STRAIGHT_ARM, POZIDRIV_DIAGONAL_ARM, 8);
  return starOfArms(arms.map((arm, index) => ({ ...arm, angle: evenlySpacedAngle(index, arms.length) })));
}

const RECESS_DRAWINGS = {
  phillips: () => hollow(taperedCross(PHILLIPS_CROSS)),
  pozidriv: () => hollow(drawPozidrivRecess()),
  torx: () => hollow(roundedStar(TORX_STAR)),
  torxTamperResistant: () => [...hollow(roundedStar(TORX_STAR)), ...solid(circle(TORX_PIN_RADIUS))],
  hexSocket: () => hollow(regularPolygon(HEXAGON)),
  slotted: () => hollow(rectangle(SLOT)),
  square: () => hollow(rectangle(SQUARE)),
};

export function drawDriveIcon(driveTypeKey) {
  const drawRecess = RECESS_DRAWINGS[driveTypeKey];
  if (!drawRecess) {
    throw new Error(`No icon for drive type: ${driveTypeKey}`);
  }
  return [...solid(circle(UNIT_HEAD_RADIUS)), ...drawRecess()];
}

export function drawDriveIconInCircle(driveTypeKey, targetCircle) {
  return placeInCircle(drawDriveIcon(driveTypeKey), targetCircle);
}
