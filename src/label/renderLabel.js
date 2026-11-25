import { computeLayout } from './layout.js';
import { listLabelLines } from './listLabelLines.js';
import { fitTextLines } from '../text/fitTextLines.js';
import { outlineTextLine } from '../text/outlineTextLine.js';
import { svgMarkup } from '../svg/svgMarkup.js';

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

const XML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

function escapeXml(text) {
  return text.replace(/[&<>"]/g, (character) => XML_ESCAPES[character]);
}

function renderTextLine(font, placedLine) {
  return `<path aria-label="${escapeXml(placedLine.text)}" d="${outlineTextLine(font, placedLine)}"/>`;
}

function renderTextLines(font, lines, zone) {
  return fitTextLines(font, lines, zone)
    .map((placedLine) => renderTextLine(font, placedLine))
    .join('');
}

function renderSvg({ width, height }, content) {
  return svgMarkup`<svg xmlns="http://www.w3.org/2000/svg" width="${width}mm" height="${height}mm" viewBox="0 0 ${width} ${height}" fill="none" stroke="#000" stroke-width="${STROKE_WIDTH}">${content}</svg>`;
}

export function renderLabel(spec, font) {
  const { textZone } = computeLayout(spec);
  return renderSvg(spec, renderOptionalFrame(spec) + renderTextLines(font, listLabelLines(spec), textZone));
}
