import {
  atSide,
  hexagonFaceEdgeDistanceFromAxis,
  mirroredHorizontalStrokes,
  mirroredOutline,
  straightThreadStrokes,
  verticalStroke,
} from './lyingPiece.js';

const BOLT = {
  headRadius: 0.55,
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
  const chamferLine = verticalStroke(BOLT.chamfer, BOLT.headRadius);
  const faceEdges = mirroredHorizontalStrokes({
    from: BOLT.chamfer,
    to: BOLT.headDepth,
    distanceFromAxis: hexagonFaceEdgeDistanceFromAxis(BOLT.headRadius),
  });
  const headEndLine = verticalStroke(BOLT.headDepth, BOLT.shankRadius);
  return [...chamferLine, ...faceEdges, ...headEndLine];
}

function shankThreadStrokes() {
  return straightThreadStrokes(BOLT, { from: BOLT.headDepth + BOLT.threadPitch, to: BOLT.end - BOLT.chamfer });
}

function drawBolt() {
  return { outline: mirroredOutline(boltEdge), strokes: [...hexHeadStrokes(), ...shankThreadStrokes()] };
}

export const bolt = { draw: drawBolt, thinnestDetail: BOLT.chamfer };
