const LEADING_ICON_DIAMETER_PER_FONT_SIZE = 0.9;
const LEADING_ICON_GAP_PER_FONT_SIZE = 0.3;

function fontBoxHeightPerFontSize(font) {
  const { yMax, yMin } = font.tables.head;
  return (yMax - yMin) / font.unitsPerEm;
}

function fontSizeAllowedByHeight(font, lines, zone) {
  return zone.height / (lines.length * fontBoxHeightPerFontSize(font));
}

function inkSpanPerFontSize(font, text) {
  const { x1, x2 } = font.getPath(text, 0, 0, 1).getBoundingBox();
  return { left: x1, width: x2 - x1 };
}

function leadingIconWidthPerFontSize(line) {
  return line.leadingIcon ? LEADING_ICON_DIAMETER_PER_FONT_SIZE + LEADING_ICON_GAP_PER_FONT_SIZE : 0;
}

function lineWidthPerFontSize(font, line) {
  return leadingIconWidthPerFontSize(line) + inkSpanPerFontSize(font, line.text).width;
}

function fontSizeAllowedByWidth(font, lines, zone) {
  const widestLinePerFontSize = Math.max(...lines.map((line) => lineWidthPerFontSize(font, line)));
  return zone.width / widestLinePerFontSize;
}

function largestFittingFontSize(font, lines, zone) {
  return Math.min(fontSizeAllowedByHeight(font, lines, zone), fontSizeAllowedByWidth(font, lines, zone));
}

function topOfCenteredBlock(zone, blockHeight) {
  return zone.y + (zone.height - blockHeight) / 2;
}

function fontBoxTopPerFontSize(font) {
  return font.tables.head.yMax / font.unitsPerEm;
}

function xAligningInkOn(font, text, leftEdge, fontSize) {
  return leftEdge - inkSpanPerFontSize(font, text).left * fontSize;
}

function capHeightPerFontSize(font) {
  return font.tables.os2.sCapHeight / font.unitsPerEm;
}

function leadingIconCircle(font, zone, { fontSize, baseline }) {
  const radius = (fontSize * LEADING_ICON_DIAMETER_PER_FONT_SIZE) / 2;
  return { x: zone.x + radius, y: baseline - (fontSize * capHeightPerFontSize(font)) / 2, radius };
}

function placeLine(font, line, zone, { fontSize, baseline }) {
  const textLeftEdge = zone.x + leadingIconWidthPerFontSize(line) * fontSize;
  const placedLine = { ...line, x: xAligningInkOn(font, line.text, textLeftEdge, fontSize), baseline, fontSize };
  return line.leadingIcon ? { ...placedLine, iconCircle: leadingIconCircle(font, zone, placedLine) } : placedLine;
}

export function fitTextLines(font, lines, zone) {
  const fontSize = largestFittingFontSize(font, lines, zone);
  const lineBoxHeight = fontSize * fontBoxHeightPerFontSize(font);
  const blockTop = topOfCenteredBlock(zone, lineBoxHeight * lines.length);
  const firstBaseline = blockTop + fontSize * fontBoxTopPerFontSize(font);
  return lines.map((line, index) => placeLine(font, line, zone, { fontSize, baseline: firstBaseline + lineBoxHeight * index }));
}
