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

function fontSizeAllowedByWidth(font, lines, zone) {
  const widestInkPerFontSize = Math.max(...lines.map((text) => inkSpanPerFontSize(font, text).width));
  return zone.width / widestInkPerFontSize;
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

function inkAlignedOnZoneLeft(font, text, zone, fontSize) {
  return zone.x - inkSpanPerFontSize(font, text).left * fontSize;
}

export function fitTextLines(font, lines, zone) {
  const fontSize = largestFittingFontSize(font, lines, zone);
  const lineBoxHeight = fontSize * fontBoxHeightPerFontSize(font);
  const blockTop = topOfCenteredBlock(zone, lineBoxHeight * lines.length);
  const firstBaseline = blockTop + fontSize * fontBoxTopPerFontSize(font);
  return lines.map((text, index) => ({
    text,
    x: inkAlignedOnZoneLeft(font, text, zone, fontSize),
    baseline: firstBaseline + lineBoxHeight * index,
    fontSize,
  }));
}
