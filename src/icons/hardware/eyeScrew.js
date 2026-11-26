import { FULL_TURN, arc, circleAround, hollow, polyline, solid } from '../contours.js';
import { atSide, diagonalThreadStrokes, mirroredCorners, onAxis, thinnestDetailOfThreadedShank } from './lyingPiece.js';

const EYE_SCREW = {
  eyeCenter: { x: 0.5, y: 0 },
  eyeRadius: 0.5,
  eyeHoleRadius: 0.3,
  shankRadius: 0.12,
  threadOverhang: 0.05,
  threadStart: 1.4,
  threadPitch: 0.16,
  shankEnd: 3.3,
  end: 3.7,
};

const JUNCTION_ANGLE = Math.asin(EYE_SCREW.shankRadius / EYE_SCREW.eyeRadius);
const JUNCTION_X = EYE_SCREW.eyeCenter.x + EYE_SCREW.eyeRadius * Math.cos(JUNCTION_ANGLE);

function eyeScrewEdge(side) {
  return [atSide(JUNCTION_X, EYE_SCREW.shankRadius, side), atSide(EYE_SCREW.shankEnd, EYE_SCREW.shankRadius, side)];
}

function eyeScrewBody() {
  return [
    ...polyline(mirroredCorners(eyeScrewEdge, onAxis(EYE_SCREW.end))),
    ...arc({ center: EYE_SCREW.eyeCenter, radius: EYE_SCREW.eyeRadius, fromAngle: FULL_TURN - JUNCTION_ANGLE, toAngle: JUNCTION_ANGLE }),
    { type: 'Z' },
  ];
}

function drawEyeScrew() {
  return {
    outline: [...solid(eyeScrewBody()), ...hollow(circleAround(EYE_SCREW.eyeCenter, EYE_SCREW.eyeHoleRadius))],
    strokes: diagonalThreadStrokes(EYE_SCREW),
  };
}

export const eyeScrew = {
  draw: drawEyeScrew,
  thinnestDetail: Math.min(thinnestDetailOfThreadedShank(EYE_SCREW), EYE_SCREW.eyeRadius - EYE_SCREW.eyeHoleRadius),
};
