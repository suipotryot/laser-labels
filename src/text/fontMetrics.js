export function fontBoxHeightPerFontSize(font) {
  const { yMax, yMin } = font.tables.head;
  return (yMax - yMin) / font.unitsPerEm;
}

export function fontBoxTopPerFontSize(font) {
  return font.tables.head.yMax / font.unitsPerEm;
}

export function capHeightPerFontSize(font) {
  return font.tables.os2.sCapHeight / font.unitsPerEm;
}
