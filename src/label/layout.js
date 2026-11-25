const MARGIN_RATIO = 0.08;
const ICON_SHARE = 0.4;

function marginFor({ width, height }) {
  return Math.min(width, height) * MARGIN_RATIO;
}

function innerZone({ width, height }, margin) {
  return { x: margin, y: margin, width: width - 2 * margin, height: height - 2 * margin };
}

function splitSideBySide(inner, gap, iconAspectRatio) {
  const iconWidth = Math.min(inner.width * ICON_SHARE, inner.height * iconAspectRatio);
  return {
    iconZone: { ...inner, width: iconWidth },
    textZone: { ...inner, x: inner.x + iconWidth + gap, width: inner.width - iconWidth - gap },
  };
}

function splitTextAboveIcon(inner, gap, iconAspectRatio) {
  const iconHeight = Math.min(inner.height * ICON_SHARE, inner.width / iconAspectRatio);
  return {
    textZone: { ...inner, height: inner.height - iconHeight - gap },
    iconZone: { ...inner, y: inner.y + inner.height - iconHeight, height: iconHeight },
  };
}

const SPLITS = {
  sideBySide: splitSideBySide,
  stacked: splitTextAboveIcon,
};

export const ORIENTATIONS = Object.keys(SPLITS);

export function computeLayout(size, orientation, iconAspectRatio) {
  const margin = marginFor(size);
  const inner = innerZone(size, margin);
  if (iconAspectRatio === null) {
    return { orientation, iconZone: null, textZone: inner };
  }
  return { orientation, ...SPLITS[orientation](inner, margin, iconAspectRatio) };
}
