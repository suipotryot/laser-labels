import { computeLayout } from './layout.js';
import { labelLines } from './labelLines.js';

const STROKE_WIDTH = 0.1;
const FRAME_CORNER_RATIO = 0.1;
const FONT_TO_LINE_RATIO = 0.8;
const CAP_HEIGHT_TO_FONT_RATIO = 0.7;

function renderFrame({ width, height }) {
  const inset = STROKE_WIDTH / 2;
  const cornerRadius = Math.min(width, height) * FRAME_CORNER_RATIO;
  return `<rect x="${inset}" y="${inset}" width="${width - STROKE_WIDTH}" height="${height - STROKE_WIDTH}" rx="${cornerRadius}"/>`;
}

function renderOptionalFrame(spec) {
  return spec.hasFrame ? renderFrame(spec) : '';
}

const XML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };

function escapeXml(text) {
  return text.replace(/[&<>"']/g, (character) => XML_ESCAPES[character]);
}

function renderTextLines(lines, zone) {
  const lineHeight = zone.height / lines.length;
  const fontSize = lineHeight * FONT_TO_LINE_RATIO;
  return lines
    .map((line, index) => {
      const baseline = zone.y + lineHeight * index + (lineHeight + fontSize * CAP_HEIGHT_TO_FONT_RATIO) / 2;
      return `<text x="${zone.x}" y="${baseline}" font-family="sans-serif" font-size="${fontSize}">${escapeXml(line)}</text>`;
    })
    .join('');
}

export function renderLabel(spec) {
  const { width, height } = spec;
  const { textZone } = computeLayout(spec);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}mm" height="${height}mm" viewBox="0 0 ${width} ${height}" fill="none" stroke="#000" stroke-width="${STROKE_WIDTH}">${renderOptionalFrame(spec)}${renderTextLines(labelLines(spec), textZone)}</svg>`;
}
