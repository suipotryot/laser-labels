import { aspectRatioOf, placeTogetherInBox } from './contours.js';
import { screw } from './hardware/screw.js';
import { nail } from './hardware/nail.js';
import { bolt } from './hardware/bolt.js';
import { nut } from './hardware/nut.js';
import { hook } from './hardware/hook.js';
import { eyeScrew } from './hardware/eyeScrew.js';
import { wallPlug } from './hardware/wallPlug.js';
import { mollyAnchor } from './hardware/mollyAnchor.js';

const HARDWARE_DRAWINGS = { screw, nail, bolt, nut, hook, eyeScrew, wallPlug, mollyAnchor };

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
