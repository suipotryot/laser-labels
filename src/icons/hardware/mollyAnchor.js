import { hollow, polygonWithRoundedCorners } from '../contours.js';
import { BOTTOM, TOP, atSide, mirroredOutline, verticalStroke, verticalStrokesAlong } from './lyingPiece.js';

const MOLLY_ANCHOR = {
  headRadius: 0.36,
  headRounding: 0.16,
  headDepth: 0.25,
  flangeRadius: 0.5,
  flangeEnd: 0.37,
  spikeRadius: 0.4,
  spikeHalfWidth: 0.05,
  spikeLength: 0.14,
  sleeveRadius: 0.28,
  slotStart: 0.85,
  slotEnd: 2.8,
  slotRadius: 0.13,
  slotHalfWidth: 0.05,
  coneStart: 3.15,
  endRadius: 0.18,
  end: 3.55,
  coneThreadPitch: 0.1,
};

const FLANGE_THICKNESS = MOLLY_ANCHOR.flangeEnd - MOLLY_ANCHOR.headDepth;

function flangeSpike(side) {
  return [
    atSide(MOLLY_ANCHOR.flangeEnd, MOLLY_ANCHOR.spikeRadius + MOLLY_ANCHOR.spikeHalfWidth, side),
    atSide(MOLLY_ANCHOR.flangeEnd + MOLLY_ANCHOR.spikeLength, MOLLY_ANCHOR.spikeRadius, side),
    atSide(MOLLY_ANCHOR.flangeEnd, MOLLY_ANCHOR.spikeRadius - MOLLY_ANCHOR.spikeHalfWidth, side),
  ];
}

function mollyAnchorEdge(side) {
  return [
    { ...atSide(0, MOLLY_ANCHOR.headRadius, side), rounding: MOLLY_ANCHOR.headRounding },
    atSide(MOLLY_ANCHOR.headDepth, MOLLY_ANCHOR.headRadius, side),
    atSide(MOLLY_ANCHOR.headDepth, MOLLY_ANCHOR.flangeRadius, side),
    atSide(MOLLY_ANCHOR.flangeEnd, MOLLY_ANCHOR.flangeRadius, side),
    ...flangeSpike(side),
    atSide(MOLLY_ANCHOR.flangeEnd, MOLLY_ANCHOR.sleeveRadius, side),
    atSide(MOLLY_ANCHOR.coneStart, MOLLY_ANCHOR.sleeveRadius, side),
    atSide(MOLLY_ANCHOR.end, MOLLY_ANCHOR.endRadius, side),
  ];
}

function expansionSlot(side) {
  const rounding = MOLLY_ANCHOR.slotHalfWidth;
  const nearEdge = MOLLY_ANCHOR.slotRadius - MOLLY_ANCHOR.slotHalfWidth;
  const farEdge = MOLLY_ANCHOR.slotRadius + MOLLY_ANCHOR.slotHalfWidth;
  return hollow(polygonWithRoundedCorners([
    { ...atSide(MOLLY_ANCHOR.slotStart, nearEdge, side), rounding },
    { ...atSide(MOLLY_ANCHOR.slotEnd, nearEdge, side), rounding },
    { ...atSide(MOLLY_ANCHOR.slotEnd, farEdge, side), rounding },
    { ...atSide(MOLLY_ANCHOR.slotStart, farEdge, side), rounding },
  ]));
}

function coneThreadStrokes() {
  return verticalStrokesAlong({
    from: MOLLY_ANCHOR.coneStart + MOLLY_ANCHOR.coneThreadPitch,
    to: MOLLY_ANCHOR.end - MOLLY_ANCHOR.coneThreadPitch,
    pitch: MOLLY_ANCHOR.coneThreadPitch,
    halfLength: MOLLY_ANCHOR.endRadius,
  });
}

function drawMollyAnchor() {
  return {
    outline: [...mirroredOutline(mollyAnchorEdge), ...expansionSlot(TOP), ...expansionSlot(BOTTOM)],
    strokes: [
      ...verticalStroke(MOLLY_ANCHOR.headDepth, MOLLY_ANCHOR.headRadius),
      ...verticalStroke(MOLLY_ANCHOR.flangeEnd, MOLLY_ANCHOR.sleeveRadius),
      ...verticalStroke(MOLLY_ANCHOR.coneStart, MOLLY_ANCHOR.sleeveRadius),
      ...coneThreadStrokes(),
    ],
  };
}

export const mollyAnchor = {
  draw: drawMollyAnchor,
  thinnestDetail: Math.min(FLANGE_THICKNESS, 2 * MOLLY_ANCHOR.slotHalfWidth, MOLLY_ANCHOR.coneThreadPitch),
};
