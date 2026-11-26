import { circle, hollow, solid } from '../contours.js';

const WASHER = { outerRadius: 1, holeRadius: 0.5 };

function drawWasher() {
  return { outline: [...solid(circle(WASHER.outerRadius)), ...hollow(circle(WASHER.holeRadius))], strokes: [] };
}

export const washer = { draw: drawWasher, thinnestDetail: WASHER.outerRadius - WASHER.holeRadius };
