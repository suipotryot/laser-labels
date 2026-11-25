function lineHeightPerFontSize(font) {
  const { yMax, yMin } = font.tables.head;
  return (yMax - yMin) / font.unitsPerEm;
}

function ascentPerFontSize(font) {
  return font.tables.head.yMax / font.unitsPerEm;
}

function fontSizeAllowedByHeight(font, lines, zone) {
  return zone.height / (lines.length * lineHeightPerFontSize(font));
}

function fontSizeAllowedByWidth(font, lines, zone) {
  const longestWidthPerFontSize = Math.max(...lines.map((text) => font.getAdvanceWidth(text, 1)));
  return zone.width / longestWidthPerFontSize;
}

function topOfCenteredBlock(zone, blockHeight) {
  return zone.y + (zone.height - blockHeight) / 2;
}

export function fitTextLines(font, lines, zone) {
  const fontSize = Math.min(fontSizeAllowedByHeight(font, lines, zone), fontSizeAllowedByWidth(font, lines, zone));
  const lineHeight = fontSize * lineHeightPerFontSize(font);
  const blockTop = topOfCenteredBlock(zone, lineHeight * lines.length);
  return lines.map((text, index) => ({
    text,
    x: zone.x,
    baseline: blockTop + lineHeight * index + fontSize * ascentPerFontSize(font),
    fontSize,
  }));
}
