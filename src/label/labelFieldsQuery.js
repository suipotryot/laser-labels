import { NO_DRIVE } from '../catalog/driveTypes.js';
import { LabelSpecError } from './labelSpec.js';

function readRequired(query, field) {
  const value = query.get(field);
  if (value === null) {
    throw new LabelSpecError(field, 'missing');
  }
  return value;
}

function readUsages(query) {
  const usages = query.get('usages');
  return usages ? usages.split(',') : [];
}

export function readLabelFieldsFromQuery(queryString) {
  const query = new URLSearchParams(queryString);
  return {
    width: readRequired(query, 'width'),
    height: readRequired(query, 'height'),
    hardwareType: readRequired(query, 'hardwareType'),
    driveType: query.get('driveType') ?? NO_DRIVE,
    driveSize: query.get('driveSize') ?? '',
    dimensions: query.get('dimensions') ?? '',
    hasFrame: query.get('hasFrame') === 'true',
    usages: readUsages(query),
  };
}

export function buildLabelFieldsQuery(fields) {
  return new URLSearchParams({
    ...fields,
    usages: fields.usages.join(','),
  }).toString();
}
