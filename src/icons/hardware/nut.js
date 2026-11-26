import { circle, hollow, regularPolygon, solid } from '../contours.js';

const NUT = { hexRadius: 1, holeRadius: 0.45 };

function drawNut() {
  return {
    outline: [...solid(regularPolygon({ cornerCount: 6, radius: NUT.hexRadius })), ...hollow(circle(NUT.holeRadius))],
    strokes: [],
  };
}

export const nut = { draw: drawNut, thinnestDetail: NUT.hexRadius * Math.cos(Math.PI / 6) - NUT.holeRadius };
