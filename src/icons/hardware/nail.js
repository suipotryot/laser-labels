import { polyline, quadraticCurve } from '../contours.js';
import { BOTTOM, TOP, atSide, mirroredOutline, onAxis, repeatedPositions, verticalStroke } from './lyingPiece.js';

const NAIL = {
  headRadius: 0.5,
  headDepth: 0.1,
  headRounding: 0.04,
  shankRadius: 0.1,
  notchCount: 6,
  bevelStart: 3.85,
  shankEnd: 4,
  bevelPoint: 4.35,
  end: 4.7,
};

function nailEdge(side) {
  return [
    { ...atSide(0, NAIL.headRadius, side), rounding: NAIL.headRounding },
    { ...atSide(NAIL.headDepth, NAIL.headRadius, side), rounding: NAIL.headRounding },
    atSide(NAIL.headDepth, NAIL.shankRadius, side),
    atSide(NAIL.shankEnd, NAIL.shankRadius, side),
  ];
}

function gripNotches() {
  const firstThirdOfShank = (NAIL.shankEnd - NAIL.headDepth) / 3;
  const notchSpacing = firstThirdOfShank / (NAIL.notchCount + 1);
  return repeatedPositions({ from: NAIL.headDepth + notchSpacing, pitch: notchSpacing, count: NAIL.notchCount })
    .flatMap((x) => polyline([atSide(x, NAIL.shankRadius, TOP), onAxis(x)]));
}

function tipBevel() {
  const bevelBendAt = (side) => atSide(NAIL.shankEnd, NAIL.shankRadius / 2, side);
  return [
    { type: 'M', ...atSide(NAIL.bevelStart, NAIL.shankRadius, TOP) },
    quadraticCurve(bevelBendAt(TOP), onAxis(NAIL.bevelPoint)),
    quadraticCurve(bevelBendAt(BOTTOM), atSide(NAIL.bevelStart, NAIL.shankRadius, BOTTOM)),
  ];
}

function drawNail() {
  return {
    outline: mirroredOutline(nailEdge, onAxis(NAIL.end)),
    strokes: [...verticalStroke(NAIL.headDepth, NAIL.shankRadius), ...gripNotches(), ...tipBevel()],
  };
}

export const nail = { draw: drawNail, thinnestDetail: NAIL.headDepth };
