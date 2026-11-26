import { polyline } from '../contours.js';
import { BOTTOM, TOP, atSide, mirroredOutline, onAxis, threadReachOf, verticalStroke, verticalStrokesAlong } from './lyingPiece.js';

const ANCHOR_BOLT = {
  shankRadius: 0.2,
  chamfer: 0.06,
  nutStart: 0.45,
  nutEnd: 0.9,
  nutRadius: 0.42,
  nutFaceEdgeHeight: 0.42 * Math.cos(Math.PI / 3),
  washerEnd: 1,
  washerRadius: 0.52,
  threadOverhang: 0.05,
  threadPitch: 0.13,
  threadEnd: 2.3,
  clipStart: 3,
  clipEnd: 3.6,
  clipRadius: 0.26,
  coneEndRadius: 0.3,
  end: 4.1,
};

function anchorBoltEdge(side) {
  return [
    atSide(0, ANCHOR_BOLT.shankRadius - ANCHOR_BOLT.chamfer, side),
    atSide(ANCHOR_BOLT.chamfer, ANCHOR_BOLT.shankRadius, side),
    atSide(ANCHOR_BOLT.nutStart, ANCHOR_BOLT.shankRadius, side),
    atSide(ANCHOR_BOLT.nutStart, ANCHOR_BOLT.nutRadius, side),
    atSide(ANCHOR_BOLT.nutEnd, ANCHOR_BOLT.nutRadius, side),
    atSide(ANCHOR_BOLT.nutEnd, ANCHOR_BOLT.washerRadius, side),
    atSide(ANCHOR_BOLT.washerEnd, ANCHOR_BOLT.washerRadius, side),
    atSide(ANCHOR_BOLT.washerEnd, ANCHOR_BOLT.shankRadius, side),
    atSide(ANCHOR_BOLT.clipStart, ANCHOR_BOLT.shankRadius, side),
    atSide(ANCHOR_BOLT.clipStart, ANCHOR_BOLT.clipRadius, side),
    atSide(ANCHOR_BOLT.clipEnd, ANCHOR_BOLT.clipRadius, side),
    atSide(ANCHOR_BOLT.clipEnd, ANCHOR_BOLT.shankRadius, side),
    atSide(ANCHOR_BOLT.end, ANCHOR_BOLT.coneEndRadius, side),
  ];
}

function nutFaceEdges() {
  return [TOP, BOTTOM].flatMap((side) => polyline([
    atSide(ANCHOR_BOLT.nutStart, ANCHOR_BOLT.nutFaceEdgeHeight, side),
    atSide(ANCHOR_BOLT.nutEnd, ANCHOR_BOLT.nutFaceEdgeHeight, side),
  ]));
}

function studThreadStrokes() {
  const halfLength = threadReachOf(ANCHOR_BOLT);
  return [
    ...verticalStrokesAlong({ from: ANCHOR_BOLT.chamfer, to: ANCHOR_BOLT.nutStart - ANCHOR_BOLT.threadPitch / 2, pitch: ANCHOR_BOLT.threadPitch, halfLength }),
    ...verticalStrokesAlong({ from: ANCHOR_BOLT.washerEnd + ANCHOR_BOLT.threadPitch, to: ANCHOR_BOLT.threadEnd, pitch: ANCHOR_BOLT.threadPitch, halfLength }),
  ];
}

function clipSlit() {
  return polyline([onAxis(ANCHOR_BOLT.clipStart), onAxis(ANCHOR_BOLT.clipEnd)]);
}

function drawAnchorBolt() {
  return {
    outline: mirroredOutline(anchorBoltEdge),
    strokes: [
      ...nutFaceEdges(),
      ...verticalStroke(ANCHOR_BOLT.nutEnd, ANCHOR_BOLT.nutRadius),
      ...studThreadStrokes(),
      ...clipSlit(),
      ...verticalStroke(ANCHOR_BOLT.clipEnd, ANCHOR_BOLT.shankRadius),
    ],
  };
}

export const anchorBolt = {
  draw: drawAnchorBolt,
  thinnestDetail: Math.min(ANCHOR_BOLT.chamfer, ANCHOR_BOLT.washerEnd - ANCHOR_BOLT.nutEnd, ANCHOR_BOLT.threadPitch),
};
