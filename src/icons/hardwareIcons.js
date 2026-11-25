import { circle, hollow, polygon, polyline, regularPolygon, solid } from './contours.js';

const SCREW = {
  headRadius: 0.5,
  headDepth: 0.32,
  shankRadius: 0.22,
  threadOverhang: 0.07,
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
  threadPitch: 0.15,
  end: 3.6,
};
const NUT = { hexRadius: 1, holeRadius: 0.45 };
const TOP = -1;
const BOTTOM = 1;

function screwEdge(side) {
  return [
    { x: 0, y: side * SCREW.headRadius },
    { x: SCREW.headDepth, y: side * SCREW.shankRadius },
    { x: SCREW.threadEnd, y: side * SCREW.shankRadius },
  ];
}

function threadPositions() {
  const threadCount = Math.floor((SCREW.threadEnd - SCREW.threadStart) / SCREW.threadPitch);
  return Array.from({ length: threadCount }, (_, index) => SCREW.threadStart + index * SCREW.threadPitch);
}

function diagonalThreadStrokes() {
  const threadReach = SCREW.shankRadius + SCREW.threadOverhang;
  return threadPositions().flatMap((x) => polyline([
    { x, y: TOP * threadReach },
    { x: x + SCREW.threadPitch / 2, y: BOTTOM * threadReach },
  ]));
}

function drawScrew() {
  const tip = { x: SCREW.tipEnd, y: 0 };
  const outline = polygon([...screwEdge(TOP), tip, ...screwEdge(BOTTOM).reverse()]);
  return { outline: solid(outline), strokes: diagonalThreadStrokes() };
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
    { x: BOLT.end - BOLT.chamfer, y: side * BOLT.shankRadius },
    { x: BOLT.end, y: side * (BOLT.shankRadius - BOLT.chamfer) },
  ];
}

function verticalStroke(x, radius) {
  return polyline([{ x, y: TOP * radius }, { x, y: BOTTOM * radius }]);
}

function hexHeadStrokes() {
  const faceEdges = [TOP, BOTTOM].flatMap((side) => polyline([
    { x: BOLT.chamfer, y: side * BOLT.hexFaceRadius },
    { x: BOLT.headDepth, y: side * BOLT.hexFaceRadius },
  ]));
  return [
    ...verticalStroke(BOLT.chamfer, BOLT.hexRadius),
    ...faceEdges,
    ...verticalStroke(BOLT.headDepth, BOLT.hexRadius),
  ];
}

function straightThreadStrokes() {
  const threadStart = BOLT.headDepth + BOLT.threadPitch;
  const threadCount = Math.floor((BOLT.end - BOLT.chamfer - threadStart) / BOLT.threadPitch) + 1;
  return Array.from({ length: threadCount }, (_, index) => threadStart + index * BOLT.threadPitch)
    .flatMap((x) => verticalStroke(x, BOLT.shankRadius));
}

function drawBolt() {
  return {
    outline: solid(polygon([...boltEdge(TOP), ...boltEdge(BOTTOM).reverse()])),
    strokes: [...hexHeadStrokes(), ...straightThreadStrokes()],
  };
}

function drawNut() {
  return {
    outline: [...solid(regularPolygon({ cornerCount: 6, radius: NUT.hexRadius })), ...hollow(circle(NUT.holeRadius))],
    strokes: [],
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
