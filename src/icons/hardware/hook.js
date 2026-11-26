import { FULL_TURN, HALF_TURN, QUARTER_TURN, arc, closed, cubicCurve, pointOnCircle, polyline, reversedSegment, solid } from '../contours.js';
import {
  BOTTOM,
  TOP,
  atSide,
  diagonalThreadStrokes,
  mirroredCorners,
  onAxis,
  thinnestDetailOfThreadedShank,
} from './lyingPiece.js';

const HOOK = {
  loopCenter: { x: 0.67, y: 0 },
  loopRadius: 0.55,
  loopEndAngle: (5 / 6) * FULL_TURN,
  bendHandleLength: 0.45,
  shankStart: 1.6,
  collarStart: 1.95,
  collarEnd: 2.1,
  collarRadius: 0.17,
  shankRadius: 0.12,
  threadOverhang: 0.05,
  threadStart: 2.35,
  threadPitch: 0.16,
  shankEnd: 3.8,
  end: 4.2,
};

const LOOP_TOP = HOOK.loopCenter.y - HOOK.loopRadius;
const LOOP_TOP_ANGLE = QUARTER_TURN;
const COLLAR_STEP = HOOK.collarRadius - HOOK.shankRadius;

function hookEdge(side) {
  return [
    atSide(HOOK.shankStart, HOOK.shankRadius, side),
    atSide(HOOK.collarStart, HOOK.shankRadius, side),
    atSide(HOOK.collarStart, HOOK.collarRadius, side),
    atSide(HOOK.collarEnd, HOOK.collarRadius, side),
    atSide(HOOK.collarEnd, HOOK.shankRadius, side),
    atSide(HOOK.shankEnd, HOOK.shankRadius, side),
  ];
}

function bendFromShankToLoopTop(side) {
  const wireEdgeOffset = side * HOOK.shankRadius;
  return cubicCurve(
    { x: HOOK.shankStart - HOOK.bendHandleLength, y: wireEdgeOffset },
    { x: HOOK.loopCenter.x + HOOK.bendHandleLength, y: LOOP_TOP + wireEdgeOffset },
    { x: HOOK.loopCenter.x, y: LOOP_TOP + wireEdgeOffset },
  );
}

function innerSideOfLoop() {
  return arc({ center: HOOK.loopCenter, radius: HOOK.loopRadius - HOOK.shankRadius, fromAngle: LOOP_TOP_ANGLE, toAngle: HOOK.loopEndAngle });
}

function roundedWireEnd() {
  const wireEnd = pointOnCircle({ center: HOOK.loopCenter, radius: HOOK.loopRadius }, HOOK.loopEndAngle);
  return arc({ center: wireEnd, radius: HOOK.shankRadius, fromAngle: HOOK.loopEndAngle + HALF_TURN, toAngle: HOOK.loopEndAngle });
}

function outerSideOfLoop() {
  return arc({ center: HOOK.loopCenter, radius: HOOK.loopRadius + HOOK.shankRadius, fromAngle: HOOK.loopEndAngle, toAngle: LOOP_TOP_ANGLE });
}

function bendBackFromLoopTopToShank() {
  const topOfShankStart = hookEdge(TOP)[0];
  return reversedSegment(bendFromShankToLoopTop(TOP), topOfShankStart);
}

function hookBody() {
  return closed([
    ...polyline(mirroredCorners(hookEdge, onAxis(HOOK.end))),
    bendFromShankToLoopTop(BOTTOM),
    ...innerSideOfLoop(),
    ...roundedWireEnd(),
    ...outerSideOfLoop(),
    bendBackFromLoopTopToShank(),
  ]);
}

function drawHook() {
  return { outline: solid(hookBody()), strokes: diagonalThreadStrokes(HOOK) };
}

export const hook = {
  draw: drawHook,
  thinnestDetail: Math.min(thinnestDetailOfThreadedShank(HOOK), COLLAR_STEP),
};
