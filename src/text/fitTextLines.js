import { capHeightPerFontSize, fontBoxHeightPerFontSize, fontBoxTopPerFontSize } from './fontMetrics.js';

const LEADING_ICON_DIAMETER_PER_FONT_SIZE = 0.9;
const LEADING_ICON_GAP_PER_FONT_SIZE = 0.3;

export function hasLeadingIcon(line) {
  return Boolean(line.leadingIcon);
}

function scaleOf(line) {
  return line.scale ?? 1;
}

function totalScaleOf(lines) {
  return lines.reduce((total, line) => total + scaleOf(line), 0);
}

function fontSizeAllowedByHeight(font, lines, zone) {
  return zone.height / (totalScaleOf(lines) * fontBoxHeightPerFontSize(font));
}

function inkSpanPerFontSize(font, text) {
  const { x1, x2 } = font.getPath(text, 0, 0, 1).getBoundingBox();
  return { left: x1, width: x2 - x1 };
}

function leadingIconAdvancePerFontSize(line) {
  return hasLeadingIcon(line) ? LEADING_ICON_DIAMETER_PER_FONT_SIZE + LEADING_ICON_GAP_PER_FONT_SIZE : 0;
}

function lineWidthPerFontSize(font, line) {
  return leadingIconAdvancePerFontSize(line) + inkSpanPerFontSize(font, line.text).width;
}

function fontSizeAllowedByWidth(font, lines, zone) {
  const widestLinePerFontSize = Math.max(...lines.map((line) => lineWidthPerFontSize(font, line) * scaleOf(line)));
  return zone.width / widestLinePerFontSize;
}

function largestFittingFontSize(font, lines, zone) {
  return Math.min(fontSizeAllowedByHeight(font, lines, zone), fontSizeAllowedByWidth(font, lines, zone));
}

function topOfCenteredBlock(zone, blockHeight) {
  return zone.y + (zone.height - blockHeight) / 2;
}

function xStartingInkAt(font, text, leftEdge, fontSize) {
  return leftEdge - inkSpanPerFontSize(font, text).left * fontSize;
}

function middleOfCapitals(font, { fontSize, baseline }) {
  return baseline - (fontSize * capHeightPerFontSize(font)) / 2;
}

function leadingIconCircle(font, zone, placedLine) {
  const radius = (placedLine.fontSize * LEADING_ICON_DIAMETER_PER_FONT_SIZE) / 2;
  return { x: zone.x + radius, y: middleOfCapitals(font, placedLine), radius };
}

function placeLine(font, line, zone, { fontSize, baseline }) {
  const textLeftEdge = zone.x + leadingIconAdvancePerFontSize(line) * fontSize;
  const placedLine = { ...line, x: xStartingInkAt(font, line.text, textLeftEdge, fontSize), baseline, fontSize };
  return hasLeadingIcon(line) ? { ...placedLine, leadingIconCircle: leadingIconCircle(font, zone, placedLine) } : placedLine;
}

function placeLinesBelow(font, lines, zone, { blockTop, baseFontSize }) {
  let lineTop = blockTop;
  return lines.map((line) => {
    const fontSize = baseFontSize * scaleOf(line);
    const baseline = lineTop + fontSize * fontBoxTopPerFontSize(font);
    lineTop += fontSize * fontBoxHeightPerFontSize(font);
    return placeLine(font, line, zone, { fontSize, baseline });
  });
}

export function fitTextLines(font, lines, zone) {
  const baseFontSize = largestFittingFontSize(font, lines, zone);
  const blockHeight = totalScaleOf(lines) * baseFontSize * fontBoxHeightPerFontSize(font);
  return placeLinesBelow(font, lines, zone, { blockTop: topOfCenteredBlock(zone, blockHeight), baseFontSize });
}
