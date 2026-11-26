import { aspectRatioOf, placeTogetherInBox } from './contours.js';
import { screw } from './hardware/screw.js';
import { nail } from './hardware/nail.js';
import { bolt } from './hardware/bolt.js';
import { nut } from './hardware/nut.js';
import { hook } from './hardware/hook.js';
import { eyeScrew } from './hardware/eyeScrew.js';
import { wallPlug } from './hardware/wallPlug.js';
import { mollyAnchor } from './hardware/mollyAnchor.js';
import { washer } from './hardware/washer.js';

const HARDWARE_ICONS = { screw, nail, bolt, nut, hook, eyeScrew, wallPlug, mollyAnchor, washer };

function hardwareIconOf(hardwareTypeKey) {
  if (!Object.hasOwn(HARDWARE_ICONS, hardwareTypeKey)) {
    throw new Error(`No icon for hardware type: ${hardwareTypeKey}`);
  }
  return HARDWARE_ICONS[hardwareTypeKey];
}

export function drawHardwareIcon(hardwareTypeKey) {
  return hardwareIconOf(hardwareTypeKey).draw();
}

export function thinnestHardwareDetail(hardwareTypeKey) {
  return hardwareIconOf(hardwareTypeKey).thinnestDetail;
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
