const MARGIN_RATIO = 0.08;
const ICON_SHARE = 0.4;
export const ICON_MAX_ASPECT_RATIO = 2.5;

function isTallerThanWide({ width, height }) {
  return height > width;
}

function marginFor({ width, height }) {
  return Math.min(width, height) * MARGIN_RATIO;
}

function innerZone({ width, height }, margin) {
  return { x: margin, y: margin, width: width - 2 * margin, height: height - 2 * margin };
}

function splitSideBySide(inner, gap) {
  const iconWidth = Math.min(inner.width * ICON_SHARE, inner.height * ICON_MAX_ASPECT_RATIO);
  return {
    iconZone: { ...inner, width: iconWidth },
    textZone: { ...inner, x: inner.x + iconWidth + gap, width: inner.width - iconWidth - gap },
  };
}

function splitOneAboveTheOther(inner, gap) {
  const iconHeight = Math.min(inner.height * ICON_SHARE, inner.width * ICON_MAX_ASPECT_RATIO);
  return {
    iconZone: { ...inner, height: iconHeight },
    textZone: { ...inner, y: inner.y + iconHeight + gap, height: inner.height - iconHeight - gap },
  };
}

export function computeLayout(size) {
  const margin = marginFor(size);
  const inner = innerZone(size, margin);
  if (isTallerThanWide(size)) {
    return { orientation: 'stacked', ...splitOneAboveTheOther(inner, margin) };
  }
  return { orientation: 'sideBySide', ...splitSideBySide(inner, margin) };
}
