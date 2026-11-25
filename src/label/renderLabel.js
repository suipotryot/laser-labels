import { computeLayout } from './layout.js';
import { labelLines } from './labelLines.js';

const STROKE_WIDTH = 0.1;
const FRAME_CORNER_RATIO = 0.1;
const FONT_SIZE_TO_LINE_HEIGHT_RATIO = 0.8;
const CAP_HEIGHT_TO_FONT_SIZE_RATIO = 0.7;
const MICROMETERS_PER_MILLIMETER = 1000;

function roundToMicrometer(millimeters) {
  return Math.round(millimeters * MICROMETERS_PER_MILLIMETER) / MICROMETERS_PER_MILLIMETER;
}

function roundIfNumber(value) {
  return typeof value === 'number' ? roundToMicrometer(value) : value;
}

function svgMarkup(strings, ...values) {
  return strings.reduce((markup, string, index) => markup + roundIfNumber(values[index - 1]) + string);
}

function renderFrame({ width, height }) {
  const inset = STROKE_WIDTH / 2;
  const cornerRadius = Math.min(width, height) * FRAME_CORNER_RATIO;
  return svgMarkup`<rect x="${inset}" y="${inset}" width="${width - STROKE_WIDTH}" height="${height - STROKE_WIDTH}" rx="${cornerRadius}"/>`;
}

function renderOptionalFrame(spec) {
  return spec.hasFrame ? renderFrame(spec) : '';
}

const XML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };

function escapeXml(text) {
  return text.replace(/[&<>]/g, (character) => XML_ESCAPES[character]);
}

function centeredBaseline(lineTop, lineHeight, fontSize) {
  const capHeight = fontSize * CAP_HEIGHT_TO_FONT_SIZE_RATIO;
  return lineTop + (lineHeight + capHeight) / 2;
}

function renderTextLine(line, x, baseline, fontSize) {
  return svgMarkup`<text x="${x}" y="${baseline}" font-family="sans-serif" font-size="${fontSize}">${escapeXml(line)}</text>`;
}

function renderTextLines(lines, zone) {
  const lineHeight = zone.height / lines.length;
  const fontSize = lineHeight * FONT_SIZE_TO_LINE_HEIGHT_RATIO;
  return lines
    .map((line, index) => {
      const lineTop = zone.y + lineHeight * index;
      return renderTextLine(line, zone.x, centeredBaseline(lineTop, lineHeight, fontSize), fontSize);
    })
    .join('');
}

function renderSvg({ width, height }, content) {
  return svgMarkup`<svg xmlns="http://www.w3.org/2000/svg" width="${width}mm" height="${height}mm" viewBox="0 0 ${width} ${height}" fill="none" stroke="#000" stroke-width="${STROKE_WIDTH}">${content}</svg>`;
}

export function renderLabel(spec) {
  const { textZone } = computeLayout(spec);
  return renderSvg(spec, renderOptionalFrame(spec) + renderTextLines(labelLines(spec), textZone));
}
