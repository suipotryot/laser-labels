import { atSide, mirroredOutline, verticalStroke } from './lyingPiece.js';

const RIVET = {
  mandrelRadius: 0.07,
  flangeStart: 1.4,
  flangeEnd: 1.5,
  flangeRadius: 0.45,
  bodyRadius: 0.2,
  bodyEnd: 3,
  mandrelHeadRadius: 0.14,
  end: 3.12,
};

const FLANGE_THICKNESS = RIVET.flangeEnd - RIVET.flangeStart;
const STEP_FROM_BODY_TO_MANDREL_HEAD = RIVET.bodyRadius - RIVET.mandrelHeadRadius;
const MANDREL_HEAD_RIM = RIVET.mandrelHeadRadius - RIVET.mandrelRadius;
const MANDREL_HEAD_LENGTH = RIVET.end - RIVET.bodyEnd;

function rivetEdge(side) {
  return [
    atSide(0, RIVET.mandrelRadius, side),
    atSide(RIVET.flangeStart, RIVET.mandrelRadius, side),
    atSide(RIVET.flangeStart, RIVET.flangeRadius, side),
    atSide(RIVET.flangeEnd, RIVET.flangeRadius, side),
    atSide(RIVET.flangeEnd, RIVET.bodyRadius, side),
    atSide(RIVET.bodyEnd, RIVET.bodyRadius, side),
    atSide(RIVET.bodyEnd, RIVET.mandrelHeadRadius, side),
    atSide(RIVET.end, RIVET.mandrelHeadRadius, side),
  ];
}

function partingLines() {
  return [...verticalStroke(RIVET.flangeEnd, RIVET.bodyRadius), ...verticalStroke(RIVET.bodyEnd, RIVET.mandrelHeadRadius)];
}

function drawRivet() {
  return { outline: mirroredOutline(rivetEdge), strokes: partingLines() };
}

export const rivet = {
  draw: drawRivet,
  thinnestDetail: Math.min(
    FLANGE_THICKNESS,
    2 * RIVET.mandrelRadius,
    STEP_FROM_BODY_TO_MANDREL_HEAD,
    MANDREL_HEAD_RIM,
    MANDREL_HEAD_LENGTH,
  ),
};
