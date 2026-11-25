import {
  arc,
  aspectRatioOf,
  circle,
  hollow,
  placeInCircle,
  placeTogetherInBox,
  polygonWithRoundedCorners,
  polyline,
  regularPolygon,
  solid,
} from './contours.js';

const FLOATING_POINT_TOLERANCE = 1e-9;
const SCREW = {
  headRadius: 0.5,
  headDepth: 0.32,
  shankRadius: 0.22,
  threadOverhang: 0.07,
  threadStart: 1.2,
  threadPitch: 0.2,
  shankEnd: 3.5,
  tipEnd: 4,
};
const NAIL = {
  headRadius: 0.5,
  headDepth: 0.1,
  headRounding: 0.04,
  shankRadius: 0.1,
  shankEnd: 4,
  tipEnd: 4.7,
  bevelStart: 3.85,
  bevelPoint: 4.35,
  notchCount: 6,
};
const BOLT = {
  headRadius: 0.55,
  faceEdgeHeight: 0.55 * Math.cos(Math.PI / 3),
  chamfer: 0.08,
  headDepth: 0.6,
  shankRadius: 0.3,
  threadOverhang: 0.07,
  threadPitch: 0.15,
  length: 3.6,
};
const NUT = { hexRadius: 1, holeRadius: 0.45 };
const EYE_SCREW = {
  eyeCenter: { x: 0.5, y: 0 },
  eyeRadius: 0.5,
  eyeHoleRadius: 0.3,
  shankRadius: 0.12,
  threadOverhang: 0.05,
  threadStart: 1.4,
  threadPitch: 0.16,
  shankEnd: 3.3,
  tipEnd: 3.7,
};
const TOP = -1;
const BOTTOM = 1;

function atSide(x, distanceFromAxis, side) {
  return { x, y: side * distanceFromAxis };
}

function mirroredOutline(edgeOf, ...pointsOnAxis) {
  return solid(polygonWithRoundedCorners([...edgeOf(TOP), ...pointsOnAxis, ...edgeOf(BOTTOM).reverse()]));
}

function evenlySpacedPositions({ from, to, pitch }) {
  const count = Math.floor((to - from) / pitch + FLOATING_POINT_TOLERANCE) + 1;
  return Array.from({ length: count }, (_, index) => from + index * pitch);
}

function threadReachOf(piece) {
  return piece.shankRadius + piece.threadOverhang;
}

function verticalStroke(x, halfLength) {
  return polyline([atSide(x, halfLength, TOP), atSide(x, halfLength, BOTTOM)]);
}

function screwEdge(side) {
  return [
    atSide(0, SCREW.headRadius, side),
    atSide(SCREW.headDepth, SCREW.shankRadius, side),
    atSide(SCREW.shankEnd, SCREW.shankRadius, side),
  ];
}

function diagonalThreadStrokes(piece) {
  const lastThreadStart = piece.shankEnd - piece.threadPitch / 2;
  return evenlySpacedPositions({ from: piece.threadStart, to: lastThreadStart, pitch: piece.threadPitch })
    .flatMap((x) => polyline([
      atSide(x, threadReachOf(piece), TOP),
      atSide(x + piece.threadPitch / 2, threadReachOf(piece), BOTTOM),
    ]));
}

function drawScrew() {
  return {
    outline: mirroredOutline(screwEdge, { x: SCREW.tipEnd, y: 0 }),
    strokes: [...verticalStroke(SCREW.headDepth, SCREW.shankRadius), ...diagonalThreadStrokes(SCREW)],
  };
}

function nailEdge(side) {
  return [
    { ...atSide(0, NAIL.headRadius, side), rounding: NAIL.headRounding },
    { ...atSide(NAIL.headDepth, NAIL.headRadius, side), rounding: NAIL.headRounding },
    atSide(NAIL.headDepth, NAIL.shankRadius, side),
    atSide(NAIL.shankEnd, NAIL.shankRadius, side),
  ];
}

function gripNotches() {
  const firstThirdOfShank = (NAIL.shankEnd - NAIL.headDepth) / 3;
  const notchSpacing = firstThirdOfShank / (NAIL.notchCount + 1);
  const firstNotch = NAIL.headDepth + notchSpacing;
  return evenlySpacedPositions({ from: firstNotch, to: firstNotch + (NAIL.notchCount - 1) * notchSpacing, pitch: notchSpacing })
    .flatMap((x) => polyline([atSide(x, NAIL.shankRadius, TOP), { x, y: 0 }]));
}

function tipBevel() {
  const bevelBend = { x: NAIL.shankEnd, y: NAIL.shankRadius / 2 };
  return [
    { type: 'M', ...atSide(NAIL.bevelStart, NAIL.shankRadius, TOP) },
    { type: 'Q', x1: bevelBend.x, y1: TOP * bevelBend.y, x: NAIL.bevelPoint, y: 0 },
    { type: 'Q', x1: bevelBend.x, y1: BOTTOM * bevelBend.y, ...atSide(NAIL.bevelStart, NAIL.shankRadius, BOTTOM) },
  ];
}

function drawNail() {
  return {
    outline: mirroredOutline(nailEdge, { x: NAIL.tipEnd, y: 0 }),
    strokes: [...verticalStroke(NAIL.headDepth, NAIL.shankRadius), ...gripNotches(), ...tipBevel()],
  };
}

function boltEdge(side) {
  return [
    atSide(0, BOLT.headRadius - BOLT.chamfer, side),
    atSide(BOLT.chamfer, BOLT.headRadius, side),
    atSide(BOLT.headDepth, BOLT.headRadius, side),
    atSide(BOLT.headDepth, BOLT.shankRadius, side),
    atSide(BOLT.length - BOLT.chamfer, BOLT.shankRadius, side),
    atSide(BOLT.length, BOLT.shankRadius - BOLT.chamfer, side),
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
  const firstThread = BOLT.headDepth + BOLT.threadPitch;
  const lastThread = BOLT.length - BOLT.chamfer;
  return evenlySpacedPositions({ from: firstThread, to: lastThread, pitch: BOLT.threadPitch })
    .flatMap((x) => verticalStroke(x, threadReachOf(BOLT)));
}

function drawBolt() {
  return { outline: mirroredOutline(boltEdge), strokes: [...hexHeadStrokes(), ...straightThreadStrokes()] };
}

function drawNut() {
  return {
    outline: [...solid(regularPolygon({ cornerCount: 6, radius: NUT.hexRadius })), ...hollow(circle(NUT.holeRadius))],
    strokes: [],
  };
}

function eyeScrewBody() {
  const eye = { center: EYE_SCREW.eyeCenter, radius: EYE_SCREW.eyeRadius };
  const junctionAngle = Math.asin(EYE_SCREW.shankRadius / EYE_SCREW.eyeRadius);
  const topJunctionX = EYE_SCREW.eyeCenter.x + EYE_SCREW.eyeRadius * Math.cos(junctionAngle);
  return [
    { type: 'M', ...atSide(topJunctionX, EYE_SCREW.shankRadius, TOP) },
    { type: 'L', ...atSide(EYE_SCREW.shankEnd, EYE_SCREW.shankRadius, TOP) },
    { type: 'L', x: EYE_SCREW.tipEnd, y: 0 },
    { type: 'L', ...atSide(EYE_SCREW.shankEnd, EYE_SCREW.shankRadius, BOTTOM) },
    { type: 'L', ...atSide(topJunctionX, EYE_SCREW.shankRadius, BOTTOM) },
    ...arc({ ...eye, fromAngle: 2 * Math.PI - junctionAngle, toAngle: junctionAngle }),
    { type: 'Z' },
  ];
}

function drawEyeScrew() {
  const eyeHole = placeInCircle(circle(1), { ...EYE_SCREW.eyeCenter, radius: EYE_SCREW.eyeHoleRadius });
  return {
    outline: [...solid(eyeScrewBody()), ...hollow(eyeHole)],
    strokes: diagonalThreadStrokes(EYE_SCREW),
  };
}

function gapBetweenDiagonalThreads(piece) {
  const threadRise = 2 * threadReachOf(piece);
  return (piece.threadPitch * threadRise) / Math.hypot(piece.threadPitch / 2, threadRise);
}

const HARDWARE_DRAWINGS = {
  screw: { draw: drawScrew, thinnestDetail: Math.min(gapBetweenDiagonalThreads(SCREW), 2 * SCREW.shankRadius) },
  eyeScrew: {
    draw: drawEyeScrew,
    thinnestDetail: Math.min(gapBetweenDiagonalThreads(EYE_SCREW), EYE_SCREW.eyeRadius - EYE_SCREW.eyeHoleRadius),
  },
  nail: { draw: drawNail, thinnestDetail: NAIL.headDepth },
  bolt: { draw: drawBolt, thinnestDetail: BOLT.chamfer },
  nut: { draw: drawNut, thinnestDetail: NUT.hexRadius * Math.cos(Math.PI / 6) - NUT.holeRadius },
};

const HARDWARE_WAITING_FOR_A_DRAWING = ['hook', 'wallPlug', 'mollyAnchor'];

export function isHardwareDrawingPending(hardwareTypeKey) {
  return HARDWARE_WAITING_FOR_A_DRAWING.includes(hardwareTypeKey);
}

function hardwareDrawingOf(hardwareTypeKey) {
  if (!Object.hasOwn(HARDWARE_DRAWINGS, hardwareTypeKey)) {
    throw new Error(`No icon for hardware type: ${hardwareTypeKey}`);
  }
  return HARDWARE_DRAWINGS[hardwareTypeKey];
}

export function drawHardwareIcon(hardwareTypeKey) {
  return hardwareDrawingOf(hardwareTypeKey).draw();
}

export function thinnestHardwareDetail(hardwareTypeKey) {
  return hardwareDrawingOf(hardwareTypeKey).thinnestDetail;
}

export function aspectRatioOfHardwareIcon(hardwareTypeKey) {
  const { outline, strokes } = drawHardwareIcon(hardwareTypeKey);
  return aspectRatioOf([outline, strokes]);
}

export function drawHardwareIconInBox(hardwareTypeKey, box) {
  const { outline, strokes } = drawHardwareIcon(hardwareTypeKey);
  const { placedDrawings: [placedOutline, placedStrokes], scale } = placeTogetherInBox([outline, strokes], box);
  return { outline: placedOutline, strokes: placedStrokes, scale };
}
