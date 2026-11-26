import { polyline } from '../contours.js';
import {
  BOTTOM,
  TOP,
  atSide,
  mirroredOutline,
  repeatedPositions,
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
  finStart: 0.9,
  finPitch: 0.22,
  finLength: 0.187,
  finCount: 9,
  railRadius: 0.1,
  railStart: 0.3,
  rungPitch: 0.3,
  end: 3.1,
};

function wallPlugRadiusAt(x) {
  const progressAlongBody = (x - WALL_PLUG.collarDepth) / (WALL_PLUG.end - WALL_PLUG.collarDepth);
  return WALL_PLUG.bodyRadius + (WALL_PLUG.endRadius - WALL_PLUG.bodyRadius) * progressAlongBody;
}

function finEdge(side) {
  return repeatedPositions({ from: WALL_PLUG.finStart, pitch: WALL_PLUG.finPitch, count: WALL_PLUG.finCount })
    .flatMap((finStart) => {
      const finEnd = finStart + WALL_PLUG.finLength;
      return [
        atSide(finStart, wallPlugRadiusAt(finStart), side),
        atSide(finStart, wallPlugRadiusAt(finStart) + WALL_PLUG.finRise, side),
        atSide(finEnd, wallPlugRadiusAt(finEnd), side),
      ];
    });
}

function wallPlugEdge(side) {
  return [
    { ...atSide(0, WALL_PLUG.collarRadius, side), rounding: WALL_PLUG.collarRounding },
    { ...atSide(WALL_PLUG.collarDepth, WALL_PLUG.collarRadius, side), rounding: WALL_PLUG.collarRounding },
    atSide(WALL_PLUG.collarDepth, WALL_PLUG.bodyRadius, side),
    ...finEdge(side),
    { ...atSide(WALL_PLUG.end, WALL_PLUG.endRadius, side), rounding: WALL_PLUG.endRounding },
  ];
}

function antiRotationWings() {
  return [TOP, BOTTOM].flatMap((side) => polyline([
    atSide(WALL_PLUG.wingRoot, wallPlugRadiusAt(WALL_PLUG.wingRoot), side),
    atSide(WALL_PLUG.wingTip, WALL_PLUG.bodyRadius + WALL_PLUG.wingReach, side),
  ]));
}

function ladder() {
  const railEnd = WALL_PLUG.end - WALL_PLUG.endRounding;
  const rails = [TOP, BOTTOM].flatMap((side) => polyline([
    atSide(WALL_PLUG.railStart, WALL_PLUG.railRadius, side),
    atSide(railEnd, WALL_PLUG.railRadius, side),
  ]));
  const rungs = verticalStrokesAlong({
    from: WALL_PLUG.railStart + WALL_PLUG.rungPitch,
    to: railEnd - WALL_PLUG.rungPitch / 2,
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
  thinnestDetail: Math.min(WALL_PLUG.finRise, WALL_PLUG.finPitch - WALL_PLUG.finLength, 2 * WALL_PLUG.railRadius),
};
