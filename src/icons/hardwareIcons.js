import { circle, hollow, polygon, polyline, regularPolygon, solid, threeQuarterArc } from './contours.js';

const SCREW = {
  headRadius: 0.5,
  headDepth: 0.32,
  shankRadius: 0.22,
  threadRootRadius: 0.16,
  threadStart: 1.2,
  threadEnd: 3.5,
  threadPitch: 0.2,
  tipEnd: 4,
};
const NAIL = { headRadius: 0.5, headDepth: 0.1, shankRadius: 0.1, shankEnd: 4.2, tipEnd: 4.6 };
const BOLT = {
  hexRadius: 0.55,
  hexFaceRadius: 0.27,
  chamfer: 0.08,
  headDepth: 0.6,
  shankRadius: 0.3,
  threadStart: 1.7,
  threadPitch: 0.15,
  nutStart: 2.4,
  nutEnd: 2.9,
  end: 3.6,
};
const NUT = { hexRadius: 1, holeRadius: 0.45, threadRadius: 0.58 };
const TOP = -1;
const BOTTOM = 1;

function threadCrestsAlong(offset) {
  const crestCount = Math.floor((SCREW.threadEnd - SCREW.threadStart - offset) / SCREW.threadPitch);
  return Array.from({ length: crestCount }, (_, index) => SCREW.threadStart + offset + index * SCREW.threadPitch);
}

function sawtoothEdge(side, offset) {
  return threadCrestsAlong(offset).flatMap((crestX) => [
    { x: crestX, y: side * SCREW.shankRadius },
    { x: crestX + SCREW.threadPitch / 2, y: side * SCREW.threadRootRadius },
  ]);
}

function screwEdge(side, offset) {
  return [
    { x: 0, y: side * SCREW.headRadius },
    { x: SCREW.headDepth, y: side * SCREW.shankRadius },
    ...sawtoothEdge(side, offset),
    { x: SCREW.threadEnd, y: side * SCREW.shankRadius },
  ];
}

function threadStrokes() {
  return threadCrestsAlong(0).flatMap((crestX) => polyline([
    { x: crestX, y: TOP * SCREW.shankRadius },
    { x: crestX + SCREW.threadPitch / 2, y: BOTTOM * SCREW.shankRadius },
  ]));
}

function drawScrew() {
  const tip = { x: SCREW.tipEnd, y: 0 };
  const outline = polygon([...screwEdge(TOP, 0), tip, ...screwEdge(BOTTOM, SCREW.threadPitch / 2).reverse()]);
  return { outline: solid(outline), strokes: threadStrokes() };
}

function nailEdge(side) {
  return [
    { x: 0, y: side * NAIL.headRadius },
    { x: NAIL.headDepth, y: side * NAIL.headRadius },
    { x: NAIL.headDepth, y: side * NAIL.shankRadius },
    { x: NAIL.shankEnd, y: side * NAIL.shankRadius },
  ];
}

function drawNail() {
  const tip = { x: NAIL.tipEnd, y: 0 };
  return { outline: solid(polygon([...nailEdge(TOP), tip, ...nailEdge(BOTTOM).reverse()])), strokes: [] };
}

function boltEdge(side) {
  return [
    { x: 0, y: side * (BOLT.hexRadius - BOLT.chamfer) },
    { x: BOLT.chamfer, y: side * BOLT.hexRadius },
    { x: BOLT.headDepth, y: side * BOLT.hexRadius },
    { x: BOLT.headDepth, y: side * BOLT.shankRadius },
    { x: BOLT.nutStart, y: side * BOLT.shankRadius },
    { x: BOLT.nutStart, y: side * BOLT.hexRadius },
    { x: BOLT.nutEnd, y: side * BOLT.hexRadius },
    { x: BOLT.nutEnd, y: side * BOLT.shankRadius },
    { x: BOLT.end - BOLT.chamfer, y: side * BOLT.shankRadius },
    { x: BOLT.end, y: side * (BOLT.shankRadius - BOLT.chamfer) },
  ];
}

function hexFaceStrokes(from, to) {
  return [TOP, BOTTOM].flatMap((side) => polyline([
    { x: from, y: side * BOLT.hexFaceRadius },
    { x: to, y: side * BOLT.hexFaceRadius },
  ]));
}

function isUnderTheNut(x) {
  return x >= BOLT.nutStart && x <= BOLT.nutEnd;
}

function straightThreadStrokes() {
  const threadCount = Math.floor((BOLT.end - BOLT.chamfer - BOLT.threadStart) / BOLT.threadPitch) + 1;
  return Array.from({ length: threadCount }, (_, index) => BOLT.threadStart + index * BOLT.threadPitch)
    .filter((x) => !isUnderTheNut(x))
    .flatMap((x) => polyline([{ x, y: TOP * BOLT.shankRadius }, { x, y: BOTTOM * BOLT.shankRadius }]));
}

function drawBolt() {
  return {
    outline: solid(polygon([...boltEdge(TOP), ...boltEdge(BOTTOM).reverse()])),
    strokes: [
      ...hexFaceStrokes(BOLT.chamfer, BOLT.headDepth),
      ...hexFaceStrokes(BOLT.nutStart, BOLT.nutEnd),
      ...straightThreadStrokes(),
    ],
  };
}

function drawNut() {
  return {
    outline: [...solid(regularPolygon({ cornerCount: 6, radius: NUT.hexRadius })), ...hollow(circle(NUT.holeRadius))],
    strokes: threeQuarterArc(NUT.threadRadius),
  };
}

const HARDWARE_DRAWINGS = {
  screw: drawScrew,
  nail: drawNail,
  bolt: drawBolt,
  nut: drawNut,
};

export function drawHardwareIcon(hardwareTypeKey) {
  const drawHardware = HARDWARE_DRAWINGS[hardwareTypeKey];
  if (!drawHardware) {
    throw new Error(`No icon for hardware type: ${hardwareTypeKey}`);
  }
  return drawHardware();
}
