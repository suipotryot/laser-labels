import {
  atSide,
  diagonalThreadStrokes,
  mirroredOutline,
  onAxis,
  thinnestDetailOfThreadedShank,
  verticalStroke,
} from './lyingPiece.js';

const SCREW = {
  headRadius: 0.5,
  headDepth: 0.32,
  shankRadius: 0.22,
  threadOverhang: 0.07,
  threadStart: 1.2,
  threadPitch: 0.2,
  shankEnd: 3.5,
  end: 4,
};

function screwEdge(side) {
  return [
    atSide(0, SCREW.headRadius, side),
    atSide(SCREW.headDepth, SCREW.shankRadius, side),
    atSide(SCREW.shankEnd, SCREW.shankRadius, side),
  ];
}

function drawScrew() {
  return {
    outline: mirroredOutline(screwEdge, onAxis(SCREW.end)),
    strokes: [...verticalStroke(SCREW.headDepth, SCREW.shankRadius), ...diagonalThreadStrokes(SCREW)],
  };
}

export const screw = { draw: drawScrew, thinnestDetail: thinnestDetailOfThreadedShank(SCREW) };
