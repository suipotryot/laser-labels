import { apothemOf, circle, hollow, regularPolygon, solid } from '../contours.js';

const NUT_HEXAGON = { cornerCount: 6, radius: 1 };
const NUT_HOLE_RADIUS = 0.45;
const NUT_RIM_WIDTH = apothemOf(NUT_HEXAGON) - NUT_HOLE_RADIUS;

function drawNut() {
  return {
    outline: [...solid(regularPolygon(NUT_HEXAGON)), ...hollow(circle(NUT_HOLE_RADIUS))],
    strokes: [],
  };
}

export const nut = { draw: drawNut, thinnestDetail: NUT_RIM_WIDTH };
