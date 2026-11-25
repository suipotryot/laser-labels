import { placeLabelTextLines } from './placeLabelTextLines.js';
import { outlineTextLine } from '../text/outlineTextLine.js';
import { svgMarkup } from '../svg/svgMarkup.js';
import { toSvgPathData } from '../svg/pathData.js';
import { escapeXml } from '../svg/escapeXml.js';
import { drawDriveIcon } from '../icons/driveIcons.js';
import { fitInCircle } from '../icons/contours.js';

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

function renderDriveIcon({ leadingIcon, iconCircle }) {
  const pathData = toSvgPathData(fitInCircle(drawDriveIcon(leadingIcon), iconCircle));
  return `<path data-drive-icon="${leadingIcon}" d="${pathData}"/>`;
}

function renderOptionalDriveIcon(placedLine) {
  return placedLine.iconCircle ? renderDriveIcon(placedLine) : '';
}

function renderTextLine(font, placedLine) {
  const pathData = toSvgPathData(outlineTextLine(font, placedLine));
  return renderOptionalDriveIcon(placedLine) + `<path aria-label="${escapeXml(placedLine.text)}" d="${pathData}"/>`;
}

function renderTextLines(spec, font) {
  return placeLabelTextLines(spec, font)
    .map((placedLine) => renderTextLine(font, placedLine))
    .join('');
}

function renderSvg({ width, height }, content) {
  return svgMarkup`<svg xmlns="http://www.w3.org/2000/svg" width="${width}mm" height="${height}mm" viewBox="0 0 ${width} ${height}" fill="none" stroke="#000" stroke-width="${STROKE_WIDTH}">${content}</svg>`;
}

export function renderLabel(spec, font) {
  return renderSvg(spec, renderOptionalFrame(spec) + renderTextLines(spec, font));
}
