import { placeLabelTextLines } from './placeLabelTextLines.js';
import { outlineTextLine } from '../text/outlineTextLine.js';
import { svgMarkup } from '../svg/svgMarkup.js';
import { toSvgPathData } from '../svg/pathData.js';
import { escapeXml } from '../svg/escapeXml.js';
import { hasLeadingIcon } from '../text/fitTextLines.js';
import { drawDriveIconInCircle } from '../icons/driveIcons.js';
import { isHardwareDrawingPending } from '../icons/hardwareIcons.js';
import { placeHardwareIcon } from './placeHardwareIcon.js';

const STROKE_WIDTH = 0.1;
const FRAME_CORNER_RATIO = 0.1;

function renderFrame({ width, height }) {
  const inset = STROKE_WIDTH / 2;
  const cornerRadius = Math.min(width, height) * FRAME_CORNER_RATIO;
  return svgMarkup`<rect x="${inset}" y="${inset}" width="${width - STROKE_WIDTH}" height="${height - STROKE_WIDTH}" rx="${cornerRadius}"/>`;
}

function renderOptionalFrame(spec) {
  return spec.hasFrame ? renderFrame(spec) : '';
}

function renderDriveIcon({ leadingIcon, leadingIconCircle }) {
  const pathData = toSvgPathData(drawDriveIconInCircle(leadingIcon, leadingIconCircle));
  return `<path data-drive-icon="${escapeXml(leadingIcon)}" d="${pathData}"/>`;
}

function renderOptionalDriveIcon(placedLine) {
  return hasLeadingIcon(placedLine) ? renderDriveIcon(placedLine) : '';
}

function renderLineText(font, placedLine) {
  const pathData = toSvgPathData(outlineTextLine(font, placedLine));
  return `<path aria-label="${escapeXml(placedLine.text)}" d="${pathData}"/>`;
}

function renderLine(font, placedLine) {
  return renderOptionalDriveIcon(placedLine) + renderLineText(font, placedLine);
}

function renderLines(spec, font) {
  return placeLabelTextLines(spec, font)
    .map((placedLine) => renderLine(font, placedLine))
    .join('');
}

function renderHardwareStrokes(hardwareTypeKey, strokes) {
  return `<path data-hardware-strokes="${escapeXml(hardwareTypeKey)}" d="${toSvgPathData(strokes)}"/>`;
}

function renderOptionalHardwareStrokes(hardwareTypeKey, strokes) {
  return strokes.length > 0 ? renderHardwareStrokes(hardwareTypeKey, strokes) : '';
}

function renderHardwareIcon(spec) {
  const { outline, strokes } = placeHardwareIcon(spec);
  const pathData = toSvgPathData(outline);
  return `<path data-hardware-outline="${escapeXml(spec.hardwareType)}" d="${pathData}"/>` + renderOptionalHardwareStrokes(spec.hardwareType, strokes);
}

function renderOptionalHardwareIcon(spec) {
  return isHardwareDrawingPending(spec.hardwareType) ? '' : renderHardwareIcon(spec);
}

function renderSvg({ width, height }, content) {
  return svgMarkup`<svg xmlns="http://www.w3.org/2000/svg" width="${width}mm" height="${height}mm" viewBox="0 0 ${width} ${height}" fill="none" stroke="#000" stroke-width="${STROKE_WIDTH}">${content}</svg>`;
}

export function renderLabel(spec, font) {
  return renderSvg(spec, renderOptionalFrame(spec) + renderOptionalHardwareIcon(spec) + renderLines(spec, font));
}
