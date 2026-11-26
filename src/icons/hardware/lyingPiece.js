import { FLOATING_POINT_TOLERANCE, FULL_TURN, polygonWithRoundedCorners, polyline, solid } from '../contours.js';

export const TOP = -1;
export const BOTTOM = 1;

export function atSide(x, distanceFromAxis, side) {
  return { x, y: side * distanceFromAxis };
}

export function onAxis(x) {
  return { x, y: 0 };
}

export function mirroredCorners(edgeOf, ...pointsOnAxis) {
  return [...edgeOf(TOP), ...pointsOnAxis, ...edgeOf(BOTTOM).reverse()];
}

export function mirroredOutline(edgeOf, ...pointsOnAxis) {
  return solid(polygonWithRoundedCorners(mirroredCorners(edgeOf, ...pointsOnAxis)));
}

export function taperedRadiusAt({ start, end, startRadius, endRadius }, x) {
  const progressAlongTaper = (x - start) / (end - start);
  return startRadius + (endRadius - startRadius) * progressAlongTaper;
}

export function hexagonFaceEdgeDistanceFromAxis(hexagonRadius) {
  return hexagonRadius * Math.cos(FULL_TURN / 6);
}

export function repeatedPositions({ from, pitch, count }) {
  return Array.from({ length: count }, (_, index) => from + index * pitch);
}

export function evenlySpacedPositions({ from, to, pitch }) {
  const count = Math.floor((to - from) / pitch + FLOATING_POINT_TOLERANCE) + 1;
  return repeatedPositions({ from, pitch, count });
}

export function verticalStroke(x, halfLength) {
  return polyline([atSide(x, halfLength, TOP), atSide(x, halfLength, BOTTOM)]);
}

export function verticalStrokesAlong({ from, to, pitch, halfLength }) {
  return evenlySpacedPositions({ from, to, pitch }).flatMap((x) => verticalStroke(x, halfLength));
}

export function mirroredHorizontalStrokes({ from, to, distanceFromAxis }) {
  return [TOP, BOTTOM].flatMap((side) => polyline([atSide(from, distanceFromAxis, side), atSide(to, distanceFromAxis, side)]));
}

export function threadReachOf(threadedShank) {
  return threadedShank.shankRadius + threadedShank.threadOverhang;
}

export function straightThreadStrokes(threadedShank, { from, to }) {
  return verticalStrokesAlong({ from, to, pitch: threadedShank.threadPitch, halfLength: threadReachOf(threadedShank) });
}

export function diagonalThreadStrokes(threadedShank) {
  const threadSlant = threadedShank.threadPitch / 2;
  const threadReach = threadReachOf(threadedShank);
  return evenlySpacedPositions({ from: threadedShank.threadStart, to: threadedShank.shankEnd - threadSlant, pitch: threadedShank.threadPitch })
    .flatMap((x) => polyline([atSide(x, threadReach, TOP), atSide(x + threadSlant, threadReach, BOTTOM)]));
}

function gapBetweenDiagonalThreads(threadedShank) {
  const threadRise = 2 * threadReachOf(threadedShank);
  return (threadedShank.threadPitch * threadRise) / Math.hypot(threadedShank.threadPitch / 2, threadRise);
}

export function thinnestDetailOfThreadedShank(threadedShank) {
  return Math.min(gapBetweenDiagonalThreads(threadedShank), 2 * threadedShank.shankRadius);
}
