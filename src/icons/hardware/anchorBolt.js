import { polyline } from '../contours.js';
import {
  atSide,
  hexagonFaceEdgeDistanceFromAxis,
  mirroredHorizontalStrokes,
  mirroredOutline,
  onAxis,
  straightThreadStrokes,
  verticalStroke,
} from './lyingPiece.js';

const ANCHOR_BOLT = {
  shankRadius: 0.2,
  chamfer: 0.06,
  nutStart: 0.45,
  nutEnd: 0.9,
  nutRadius: 0.5,
  washerEnd: 1,
  washerRadius: 0.6,
  threadOverhang: 0.05,
  threadPitch: 0.13,
  threadEnd: 2.3,
  clipStart: 3,
  clipEnd: 3.6,
  clipRadius: 0.26,
  coneEndRadius: 0.3,
  end: 4.1,
};

const NUT_FACE_EDGE_DISTANCE_FROM_AXIS = hexagonFaceEdgeDistanceFromAxis(ANCHOR_BOLT.nutRadius);
const WASHER_THICKNESS = ANCHOR_BOLT.washerEnd - ANCHOR_BOLT.nutEnd;
const CLIP_STEP = ANCHOR_BOLT.clipRadius - ANCHOR_BOLT.shankRadius;
const GAP_BETWEEN_NUT_FACE_EDGE_AND_SHANK = NUT_FACE_EDGE_DISTANCE_FROM_AXIS - ANCHOR_BOLT.shankRadius;

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

function nutStrokes() {
  const faceEdges = mirroredHorizontalStrokes({ from: ANCHOR_BOLT.nutStart, to: ANCHOR_BOLT.nutEnd, distanceFromAxis: NUT_FACE_EDGE_DISTANCE_FROM_AXIS });
  const nutEndLine = verticalStroke(ANCHOR_BOLT.nutEnd, ANCHOR_BOLT.nutRadius);
  return [...faceEdges, ...nutEndLine];
}

function threadsBeforeTheNut() {
  return straightThreadStrokes(ANCHOR_BOLT, { from: ANCHOR_BOLT.chamfer, to: ANCHOR_BOLT.nutStart - ANCHOR_BOLT.threadPitch });
}

function threadsAfterTheWasher() {
  return straightThreadStrokes(ANCHOR_BOLT, { from: ANCHOR_BOLT.washerEnd + ANCHOR_BOLT.threadPitch, to: ANCHOR_BOLT.threadEnd });
}

function clipStrokes() {
  const slit = polyline([onAxis(ANCHOR_BOLT.clipStart), onAxis(ANCHOR_BOLT.clipEnd)]);
  const clipEndLine = verticalStroke(ANCHOR_BOLT.clipEnd, ANCHOR_BOLT.shankRadius);
  return [...slit, ...clipEndLine];
}

function drawAnchorBolt() {
  return {
    outline: mirroredOutline(anchorBoltEdge),
    strokes: [...nutStrokes(), ...threadsBeforeTheNut(), ...threadsAfterTheWasher(), ...clipStrokes()],
  };
}

export const anchorBolt = {
  draw: drawAnchorBolt,
  thinnestDetail: Math.min(
    ANCHOR_BOLT.chamfer,
    WASHER_THICKNESS,
    ANCHOR_BOLT.threadPitch,
    CLIP_STEP,
    GAP_BETWEEN_NUT_FACE_EDGE_AND_SHANK,
  ),
};
