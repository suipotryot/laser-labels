import {
  arc,
  aspectRatioOf,
  circle,
  hollow,
  placeInCircle,
  placeTogetherInBox,
  pointOnCircle,
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
const HOOK = {
  loopCenter: { x: 0.67, y: 0 },
  loopRadius: 0.55,
  loopEndAngle: (5 * Math.PI) / 3,
  bendLength: 0.45,
  junction: 1.6,
  collarStart: 1.95,
  collarEnd: 2.1,
  collarRadius: 0.17,
  shankRadius: 0.12,
  threadOverhang: 0.05,
  threadStart: 2.35,
  threadPitch: 0.16,
  shankEnd: 3.8,
  tipEnd: 4.2,
};
const WALL_PLUG = {
  collarRadius: 0.4,
  collarDepth: 0.2,
  collarRounding: 0.05,
  bodyRadius: 0.32,
  endRadius: 0.27,
  endRounding: 0.2,
  wingStart: 0.55,
  wingReach: 0.12,
  finRise: 0.05,
  finStart: 0.9,
  finPitch: 0.22,
  finCount: 9,
  railRadius: 0.1,
  railStart: 0.3,
  rungPitch: 0.3,
  end: 3.1,
};
const MOLLY_ANCHOR = {
  headRadius: 0.36,
  headRounding: 0.16,
  headDepth: 0.25,
  flangeRadius: 0.5,
  flangeEnd: 0.37,
  spikeRoot: 0.4,
  spikeHalfWidth: 0.05,
  spikeLength: 0.14,
  sleeveRadius: 0.28,
  slotStart: 0.85,
  slotEnd: 2.8,
  slotCenter: 0.13,
  slotHalfWidth: 0.05,
  coneStart: 3.15,
  endRadius: 0.18,
  end: 3.55,
  coneThreadPitch: 0.1,
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

function hookEdge(side) {
  return [
    atSide(HOOK.junction, HOOK.shankRadius, side),
    atSide(HOOK.collarStart, HOOK.shankRadius, side),
    atSide(HOOK.collarStart, HOOK.collarRadius, side),
    atSide(HOOK.collarEnd, HOOK.collarRadius, side),
    atSide(HOOK.collarEnd, HOOK.shankRadius, side),
    atSide(HOOK.shankEnd, HOOK.shankRadius, side),
  ];
}

function bendTowardsLoopTop(offset) {
  const loopTop = HOOK.loopCenter.y - HOOK.loopRadius;
  return {
    type: 'C',
    x1: HOOK.junction - HOOK.bendLength,
    y1: offset,
    x2: HOOK.loopCenter.x + HOOK.bendLength,
    y2: loopTop + offset,
    x: HOOK.loopCenter.x,
    y: loopTop + offset,
  };
}

function bendTowardsShank(offset) {
  const loopTop = HOOK.loopCenter.y - HOOK.loopRadius;
  return {
    type: 'C',
    x1: HOOK.loopCenter.x + HOOK.bendLength,
    y1: loopTop + offset,
    x2: HOOK.junction - HOOK.bendLength,
    y2: offset,
    x: HOOK.junction,
    y: offset,
  };
}

function hookBody() {
  const loop = { center: HOOK.loopCenter };
  const wireEnd = pointOnCircle({ ...loop, radius: HOOK.loopRadius }, HOOK.loopEndAngle);
  const [shankTopAtJunction, ...shankTop] = hookEdge(TOP);
  return [
    { type: 'M', ...shankTopAtJunction },
    ...shankTop.map((point) => ({ type: 'L', ...point })),
    { type: 'L', x: HOOK.tipEnd, y: 0 },
    ...hookEdge(BOTTOM).reverse().map((point) => ({ type: 'L', ...point })),
    bendTowardsLoopTop(HOOK.shankRadius),
    ...arc({ ...loop, radius: HOOK.loopRadius - HOOK.shankRadius, fromAngle: Math.PI / 2, toAngle: HOOK.loopEndAngle }),
    ...arc({ center: wireEnd, radius: HOOK.shankRadius, fromAngle: HOOK.loopEndAngle + Math.PI, toAngle: HOOK.loopEndAngle }),
    ...arc({ ...loop, radius: HOOK.loopRadius + HOOK.shankRadius, fromAngle: HOOK.loopEndAngle, toAngle: Math.PI / 2 }),
    bendTowardsShank(-HOOK.shankRadius),
    { type: 'Z' },
  ];
}

function drawHook() {
  return { outline: solid(hookBody()), strokes: diagonalThreadStrokes(HOOK) };
}

function bodyRadiusAt(x) {
  const taper = (x - WALL_PLUG.collarDepth) / (WALL_PLUG.end - WALL_PLUG.collarDepth);
  return WALL_PLUG.bodyRadius + (WALL_PLUG.endRadius - WALL_PLUG.bodyRadius) * taper;
}

function finEdge(side) {
  return Array.from({ length: WALL_PLUG.finCount }, (_, index) => WALL_PLUG.finStart + index * WALL_PLUG.finPitch)
    .flatMap((finX) => [
      atSide(finX, bodyRadiusAt(finX), side),
      atSide(finX, bodyRadiusAt(finX) + WALL_PLUG.finRise, side),
      atSide(finX + WALL_PLUG.finPitch * 0.85, bodyRadiusAt(finX + WALL_PLUG.finPitch * 0.85), side),
    ]);
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
    atSide(WALL_PLUG.wingStart, bodyRadiusAt(WALL_PLUG.wingStart), side),
    atSide(WALL_PLUG.collarDepth + 0.08, WALL_PLUG.bodyRadius + WALL_PLUG.wingReach, side),
  ]));
}

function ladder() {
  const railEnd = WALL_PLUG.end - WALL_PLUG.endRounding;
  const rails = [TOP, BOTTOM].flatMap((side) => polyline([
    atSide(WALL_PLUG.railStart, WALL_PLUG.railRadius, side),
    atSide(railEnd, WALL_PLUG.railRadius, side),
  ]));
  const rungs = evenlySpacedPositions({ from: WALL_PLUG.railStart + WALL_PLUG.rungPitch, to: railEnd - WALL_PLUG.rungPitch / 2, pitch: WALL_PLUG.rungPitch })
    .flatMap((x) => verticalStroke(x, WALL_PLUG.railRadius));
  return [...rails, ...rungs];
}

function drawWallPlug() {
  return {
    outline: mirroredOutline(wallPlugEdge),
    strokes: [...verticalStroke(WALL_PLUG.collarDepth, WALL_PLUG.bodyRadius), ...antiRotationWings(), ...ladder()],
  };
}

function flangeSpike(side) {
  return [
    atSide(MOLLY_ANCHOR.flangeEnd, MOLLY_ANCHOR.spikeRoot + MOLLY_ANCHOR.spikeHalfWidth, side),
    atSide(MOLLY_ANCHOR.flangeEnd + MOLLY_ANCHOR.spikeLength, MOLLY_ANCHOR.spikeRoot, side),
    atSide(MOLLY_ANCHOR.flangeEnd, MOLLY_ANCHOR.spikeRoot - MOLLY_ANCHOR.spikeHalfWidth, side),
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
  const halfWidth = MOLLY_ANCHOR.slotHalfWidth;
  const slotEdge = (offset) => side * MOLLY_ANCHOR.slotCenter + offset;
  return hollow(polygonWithRoundedCorners([
    { x: MOLLY_ANCHOR.slotStart, y: slotEdge(-halfWidth), rounding: halfWidth },
    { x: MOLLY_ANCHOR.slotEnd, y: slotEdge(-halfWidth), rounding: halfWidth },
    { x: MOLLY_ANCHOR.slotEnd, y: slotEdge(halfWidth), rounding: halfWidth },
    { x: MOLLY_ANCHOR.slotStart, y: slotEdge(halfWidth), rounding: halfWidth },
  ]));
}

function coneThreads() {
  const firstThread = MOLLY_ANCHOR.coneStart + MOLLY_ANCHOR.coneThreadPitch;
  return evenlySpacedPositions({ from: firstThread, to: MOLLY_ANCHOR.end - MOLLY_ANCHOR.coneThreadPitch, pitch: MOLLY_ANCHOR.coneThreadPitch })
    .flatMap((x) => verticalStroke(x, MOLLY_ANCHOR.endRadius));
}

function drawMollyAnchor() {
  return {
    outline: [...mirroredOutline(mollyAnchorEdge), ...expansionSlot(TOP), ...expansionSlot(BOTTOM)],
    strokes: [
      ...verticalStroke(MOLLY_ANCHOR.headDepth, MOLLY_ANCHOR.headRadius),
      ...verticalStroke(MOLLY_ANCHOR.flangeEnd, MOLLY_ANCHOR.sleeveRadius),
      ...verticalStroke(MOLLY_ANCHOR.coneStart, MOLLY_ANCHOR.sleeveRadius),
      ...coneThreads(),
    ],
  };
}

function gapBetweenDiagonalThreads(piece) {
  const threadRise = 2 * threadReachOf(piece);
  return (piece.threadPitch * threadRise) / Math.hypot(piece.threadPitch / 2, threadRise);
}

const HARDWARE_DRAWINGS = {
  screw: { draw: drawScrew, thinnestDetail: Math.min(gapBetweenDiagonalThreads(SCREW), 2 * SCREW.shankRadius) },
  hook: { draw: drawHook, thinnestDetail: Math.min(gapBetweenDiagonalThreads(HOOK), 2 * HOOK.shankRadius) },
  wallPlug: { draw: drawWallPlug, thinnestDetail: Math.min(WALL_PLUG.finRise, WALL_PLUG.railRadius * 2) },
  mollyAnchor: {
    draw: drawMollyAnchor,
    thinnestDetail: Math.min(MOLLY_ANCHOR.flangeEnd - MOLLY_ANCHOR.headDepth, 2 * MOLLY_ANCHOR.slotHalfWidth, MOLLY_ANCHOR.coneThreadPitch),
  },
  eyeScrew: {
    draw: drawEyeScrew,
    thinnestDetail: Math.min(gapBetweenDiagonalThreads(EYE_SCREW), EYE_SCREW.eyeRadius - EYE_SCREW.eyeHoleRadius),
  },
  nail: { draw: drawNail, thinnestDetail: NAIL.headDepth },
  bolt: { draw: drawBolt, thinnestDetail: BOLT.chamfer },
  nut: { draw: drawNut, thinnestDetail: NUT.hexRadius * Math.cos(Math.PI / 6) - NUT.holeRadius },
};

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
