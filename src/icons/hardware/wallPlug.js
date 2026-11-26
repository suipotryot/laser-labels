import { polyline } from '../contours.js';
import {
  BOTTOM,
  TOP,
  atSide,
  mirroredHorizontalStrokes,
  mirroredOutline,
  repeatedPositions,
  taperedRadiusAt,
  verticalStroke,
  verticalStrokesAlong,
} from './lyingPiece.js';

const WALL_PLUG = {
  collarRadius: 0.4,
  collarDepth: 0.2,
  collarRounding: 0.05,
  bodyRadius: 0.32,
  endRadius: 0.27,
  endRounding: 0.2,
  wingRoot: 0.55,
  wingTip: 0.28,
  wingReach: 0.12,
  finRise: 0.05,
  firstFinStart: 0.9,
  finPitch: 0.22,
  finLength: 0.187,
  finCount: 9,
  railRadius: 0.1,
  railStart: 0.3,
  rungPitch: 0.3,
  end: 3.1,
};

const FLAT_BETWEEN_FINS = WALL_PLUG.finPitch - WALL_PLUG.finLength;
const GAP_BETWEEN_RAILS = 2 * WALL_PLUG.railRadius;

function bodyRadiusAt(x) {
  return taperedRadiusAt({ start: WALL_PLUG.collarDepth, end: WALL_PLUG.end, startRadius: WALL_PLUG.bodyRadius, endRadius: WALL_PLUG.endRadius }, x);
}

function finsAlong(side) {
  return repeatedPositions({ from: WALL_PLUG.firstFinStart, pitch: WALL_PLUG.finPitch, count: WALL_PLUG.finCount })
    .flatMap((finStart) => {
      const finEnd = finStart + WALL_PLUG.finLength;
      return [
        atSide(finStart, bodyRadiusAt(finStart), side),
        atSide(finStart, bodyRadiusAt(finStart) + WALL_PLUG.finRise, side),
        atSide(finEnd, bodyRadiusAt(finEnd), side),
      ];
    });
}

function wallPlugEdge(side) {
  return [
    { ...atSide(0, WALL_PLUG.collarRadius, side), rounding: WALL_PLUG.collarRounding },
    { ...atSide(WALL_PLUG.collarDepth, WALL_PLUG.collarRadius, side), rounding: WALL_PLUG.collarRounding },
    atSide(WALL_PLUG.collarDepth, WALL_PLUG.bodyRadius, side),
    ...finsAlong(side),
    { ...atSide(WALL_PLUG.end, WALL_PLUG.endRadius, side), rounding: WALL_PLUG.endRounding },
  ];
}

function antiRotationWings() {
  return [TOP, BOTTOM].flatMap((side) => polyline([
    atSide(WALL_PLUG.wingRoot, bodyRadiusAt(WALL_PLUG.wingRoot), side),
    atSide(WALL_PLUG.wingTip, WALL_PLUG.bodyRadius + WALL_PLUG.wingReach, side),
  ]));
}

function ladder() {
  const railEnd = WALL_PLUG.end - WALL_PLUG.endRounding;
  const lastRungLimit = railEnd - WALL_PLUG.rungPitch / 2;
  const rails = mirroredHorizontalStrokes({ from: WALL_PLUG.railStart, to: railEnd, distanceFromAxis: WALL_PLUG.railRadius });
  const rungs = verticalStrokesAlong({
    from: WALL_PLUG.railStart + WALL_PLUG.rungPitch,
    to: lastRungLimit,
    pitch: WALL_PLUG.rungPitch,
    halfLength: WALL_PLUG.railRadius,
  });
  return [...rails, ...rungs];
}

function drawWallPlug() {
  return {
    outline: mirroredOutline(wallPlugEdge),
    strokes: [...verticalStroke(WALL_PLUG.collarDepth, WALL_PLUG.bodyRadius), ...antiRotationWings(), ...ladder()],
  };
}

export const wallPlug = {
  draw: drawWallPlug,
  thinnestDetail: Math.min(WALL_PLUG.finRise, FLAT_BETWEEN_FINS, GAP_BETWEEN_RAILS),
};
