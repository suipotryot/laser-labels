import { atSide, mirroredOutline, straightThreadStrokes } from './lyingPiece.js';

const THREADED_ROD = {
  shankRadius: 0.3,
  chamfer: 0.08,
  threadOverhang: 0.07,
  threadPitch: 0.15,
  end: 4.36,
};

function threadedRodEdge(side) {
  return [
    atSide(0, THREADED_ROD.shankRadius - THREADED_ROD.chamfer, side),
    atSide(THREADED_ROD.chamfer, THREADED_ROD.shankRadius, side),
    atSide(THREADED_ROD.end - THREADED_ROD.chamfer, THREADED_ROD.shankRadius, side),
    atSide(THREADED_ROD.end, THREADED_ROD.shankRadius - THREADED_ROD.chamfer, side),
  ];
}

function drawThreadedRod() {
  return {
    outline: mirroredOutline(threadedRodEdge),
    strokes: straightThreadStrokes(THREADED_ROD, { from: THREADED_ROD.chamfer, to: THREADED_ROD.end - THREADED_ROD.chamfer }),
  };
}

export const threadedRod = { draw: drawThreadedRod, thinnestDetail: THREADED_ROD.chamfer };
