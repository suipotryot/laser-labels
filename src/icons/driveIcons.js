import { armedStar, circle, cross, rectangle, regularPolygon, roundedStar } from './contours.js';

const HEAD_RADIUS = 1;
const SLOT_HALF_LENGTH = 0.72;
const SLOT_HALF_WIDTH = 0.11;
const SQUARE_HALF_SIDE = 0.36;
const HEXAGON_RADIUS = 0.5;
const PHILLIPS_CROSS = { armLength: 0.62, tipHalfWidth: 0.07, rootHalfWidth: 0.16 };
const POZIDRIV_STRAIGHT_ARM = { length: 0.62, halfWidth: 0.12 };
const POZIDRIV_DIAGONAL_ARM = { length: 0.5, halfWidth: 0.04 };
const TORX_STAR = { lobeCount: 6, outerRadius: 0.72, innerRadius: 0.36 };
const TORX_PIN_RADIUS = 0.14;

function drawPozidrivRecess() {
  const arms = Array.from({ length: 8 }, (_, eighth) => ({
    angle: (eighth * Math.PI) / 4,
    ...(eighth % 2 === 0 ? POZIDRIV_STRAIGHT_ARM : POZIDRIV_DIAGONAL_ARM),
  }));
  return armedStar(arms);
}

const RECESS_DRAWINGS = {
  phillips: () => cross(PHILLIPS_CROSS),
  pozidriv: drawPozidrivRecess,
  torx: () => roundedStar(TORX_STAR),
  torxTamperResistant: () => [...roundedStar(TORX_STAR), ...circle(TORX_PIN_RADIUS)],
  hexSocket: () => regularPolygon(6, HEXAGON_RADIUS),
  slotted: () => rectangle(SLOT_HALF_LENGTH, SLOT_HALF_WIDTH),
  square: () => rectangle(SQUARE_HALF_SIDE, SQUARE_HALF_SIDE),
};

export function drawDriveIcon(driveTypeKey) {
  const drawRecess = RECESS_DRAWINGS[driveTypeKey];
  if (!drawRecess) {
    throw new Error(`No icon for drive type: ${driveTypeKey}`);
  }
  return [...circle(HEAD_RADIUS), ...drawRecess()];
}
