import { polyline } from '../contours.js';
import { BOTTOM, TOP, atSide, mirroredOutline, threadReachOf, verticalStroke, verticalStrokesAlong } from './lyingPiece.js';

const BOLT = {
  headRadius: 0.55,
  faceEdgeHeight: 0.55 * Math.cos(Math.PI / 3),
  chamfer: 0.08,
  headDepth: 0.6,
  shankRadius: 0.3,
  threadOverhang: 0.07,
  threadPitch: 0.15,
  end: 3.6,
};

function boltEdge(side) {
  return [
    atSide(0, BOLT.headRadius - BOLT.chamfer, side),
    atSide(BOLT.chamfer, BOLT.headRadius, side),
    atSide(BOLT.headDepth, BOLT.headRadius, side),
    atSide(BOLT.headDepth, BOLT.shankRadius, side),
    atSide(BOLT.end - BOLT.chamfer, BOLT.shankRadius, side),
    atSide(BOLT.end, BOLT.shankRadius - BOLT.chamfer, side),
  ];
}

function hexHeadStrokes() {
  const faceEdges = [TOP, BOTTOM].flatMap((side) => polyline([
    atSide(BOLT.chamfer, BOLT.faceEdgeHeight, side),
    atSide(BOLT.headDepth, BOLT.faceEdgeHeight, side),
  ]));
  return [
    ...verticalStroke(BOLT.chamfer, BOLT.headRadius),
    ...faceEdges,
    ...verticalStroke(BOLT.headDepth, BOLT.shankRadius),
  ];
}

function straightThreadStrokes() {
  return verticalStrokesAlong({
    from: BOLT.headDepth + BOLT.threadPitch,
    to: BOLT.end - BOLT.chamfer,
    pitch: BOLT.threadPitch,
    halfLength: threadReachOf(BOLT),
  });
}

function drawBolt() {
  return { outline: mirroredOutline(boltEdge), strokes: [...hexHeadStrokes(), ...straightThreadStrokes()] };
}

export const bolt = { draw: drawBolt, thinnestDetail: BOLT.chamfer };
