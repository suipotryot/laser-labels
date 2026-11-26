import { HALF_TURN, QUARTER_TURN, arc, pointOnCircle, polyline, reversedSegment, solid } from '../contours.js';
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
  loopEndAngle: (5 * Math.PI) / 3,
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
  const offset = side * HOOK.shankRadius;
  return {
    type: 'C',
    x1: HOOK.shankStart - HOOK.bendHandleLength,
    y1: offset,
    x2: HOOK.loopCenter.x + HOOK.bendHandleLength,
    y2: LOOP_TOP + offset,
    x: HOOK.loopCenter.x,
    y: LOOP_TOP + offset,
  };
}

function innerSideOfLoop() {
  return arc({ center: HOOK.loopCenter, radius: HOOK.loopRadius - HOOK.shankRadius, fromAngle: QUARTER_TURN, toAngle: HOOK.loopEndAngle });
}

function roundedWireEnd() {
  const wireEnd = pointOnCircle({ center: HOOK.loopCenter, radius: HOOK.loopRadius }, HOOK.loopEndAngle);
  return arc({ center: wireEnd, radius: HOOK.shankRadius, fromAngle: HOOK.loopEndAngle + HALF_TURN, toAngle: HOOK.loopEndAngle });
}

function outerSideOfLoop() {
  return arc({ center: HOOK.loopCenter, radius: HOOK.loopRadius + HOOK.shankRadius, fromAngle: HOOK.loopEndAngle, toAngle: QUARTER_TURN });
}

function hookBody() {
  return [
    ...polyline(mirroredCorners(hookEdge, onAxis(HOOK.end))),
    bendFromShankToLoopTop(BOTTOM),
    ...innerSideOfLoop(),
    ...roundedWireEnd(),
    ...outerSideOfLoop(),
    reversedSegment(bendFromShankToLoopTop(TOP), atSide(HOOK.shankStart, HOOK.shankRadius, TOP)),
    { type: 'Z' },
  ];
}

function drawHook() {
  return { outline: solid(hookBody()), strokes: diagonalThreadStrokes(HOOK) };
}

export const hook = { draw: drawHook, thinnestDetail: thinnestDetailOfThreadedShank(HOOK) };
