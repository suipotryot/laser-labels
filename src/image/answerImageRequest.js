import { readLabelFieldsFromQuery } from '../label/labelFieldsQuery.js';
import { readLabelSpec, LabelSpecError } from '../label/labelSpec.js';
import { renderLabel } from '../label/renderLabel.js';

function answerWithLabel(spec, font) {
  return {
    type: 'engraving-image',
    svg: renderLabel(spec, font),
    widthMm: spec.width,
    heightMm: spec.height,
  };
}

function answerWithRefusal({ field, reason, characters }) {
  return { type: 'engraving-image-error', field, reason, ...(characters && { characters }) };
}

export function answerImageRequest(queryString, font) {
  try {
    return answerWithLabel(readLabelSpec(readLabelFieldsFromQuery(queryString), font), font);
  } catch (error) {
    if (error instanceof LabelSpecError) {
      return answerWithRefusal(error);
    }
    throw error;
  }
}
