const USAGE_ROW_HEIGHT_SHARE = 0.25;
const GAP_TO_USAGE_SIDE_RATIO = 0.25;

function usageSideFor(iconZone, usageCount) {
  const widthInUsageSides = usageCount + (usageCount - 1) * GAP_TO_USAGE_SIDE_RATIO;
  return Math.min(iconZone.height * USAGE_ROW_HEIGHT_SHARE, iconZone.width / widthInUsageSides);
}

function usageBoxesAlongTheBottom(iconZone, usageCount, side) {
  const gap = side * GAP_TO_USAGE_SIDE_RATIO;
  const rowWidth = usageCount * side + (usageCount - 1) * gap;
  const rowLeft = iconZone.x + (iconZone.width - rowWidth) / 2;
  return Array.from({ length: usageCount }, (_, index) => ({
    x: rowLeft + index * (side + gap),
    y: iconZone.y + iconZone.height - side,
    width: side,
    height: side,
  }));
}

export function splitIconZone(iconZone, usageCount) {
  if (usageCount === 0) {
    return { drawingZone: iconZone, usageBoxes: [] };
  }
  const side = usageSideFor(iconZone, usageCount);
  const drawingHeight = iconZone.height - side * (1 + GAP_TO_USAGE_SIDE_RATIO);
  return {
    drawingZone: { ...iconZone, height: drawingHeight },
    usageBoxes: usageBoxesAlongTheBottom(iconZone, usageCount, side),
  };
}
