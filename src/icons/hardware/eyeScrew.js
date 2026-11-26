import { FULL_TURN, arc, circleAround, closed, hollow, polyline, solid } from '../contours.js';
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

const EYE_TO_SHANK_ANGLE = Math.asin(EYE_SCREW.shankRadius / EYE_SCREW.eyeRadius);
const SHANK_START = EYE_SCREW.eyeCenter.x + EYE_SCREW.eyeRadius * Math.cos(EYE_TO_SHANK_ANGLE);
const EYE_RING_WIDTH = EYE_SCREW.eyeRadius - EYE_SCREW.eyeHoleRadius;

function eyeScrewEdge(side) {
  return [atSide(SHANK_START, EYE_SCREW.shankRadius, side), atSide(EYE_SCREW.shankEnd, EYE_SCREW.shankRadius, side)];
}

function outerSideOfEye() {
  return arc({ center: EYE_SCREW.eyeCenter, radius: EYE_SCREW.eyeRadius, fromAngle: FULL_TURN - EYE_TO_SHANK_ANGLE, toAngle: EYE_TO_SHANK_ANGLE });
}

function eyeScrewBody() {
  return closed([...polyline(mirroredCorners(eyeScrewEdge, onAxis(EYE_SCREW.end))), ...outerSideOfEye()]);
}

function eyeHole() {
  return circleAround({ center: EYE_SCREW.eyeCenter, radius: EYE_SCREW.eyeHoleRadius });
}

function drawEyeScrew() {
  return {
    outline: [...solid(eyeScrewBody()), ...hollow(eyeHole())],
    strokes: diagonalThreadStrokes(EYE_SCREW),
  };
}

export const eyeScrew = {
  draw: drawEyeScrew,
  thinnestDetail: Math.min(thinnestDetailOfThreadedShank(EYE_SCREW), EYE_RING_WIDTH),
};
