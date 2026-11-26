import { polyline } from '../contours.js';
import { BOTTOM, TOP, atSide, mirroredOutline, verticalStroke } from './lyingPiece.js';

const RIVET = {
  mandrelRadius: 0.07,
  flangeStart: 1.4,
  flangeEnd: 1.5,
  flangeRadius: 0.45,
  bodyRadius: 0.2,
  bodyEnd: 3,
  mandrelHeadRadius: 0.1,
  end: 3.12,
};

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

function mandrelThroughTheBody() {
  return [TOP, BOTTOM].flatMap((side) => polyline([
    atSide(RIVET.flangeEnd, RIVET.mandrelRadius, side),
    atSide(RIVET.bodyEnd, RIVET.mandrelRadius, side),
  ]));
}

function drawRivet() {
  return {
    outline: mirroredOutline(rivetEdge),
    strokes: [...verticalStroke(RIVET.flangeEnd, RIVET.bodyRadius), ...mandrelThroughTheBody()],
  };
}

export const rivet = { draw: drawRivet, thinnestDetail: Math.min(RIVET.flangeEnd - RIVET.flangeStart, 2 * RIVET.mandrelRadius) };
