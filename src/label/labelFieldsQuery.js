import { NO_DRIVE } from '../catalog/driveTypes.js';
import { LabelSpecError } from './labelSpec.js';

function readRequired(searchParams, field) {
  const value = searchParams.get(field);
  if (value === null) {
    throw new LabelSpecError(field, 'missing');
  }
  return value;
}

function readDriveType(searchParams) {
  if (searchParams.has('driveSize') && !searchParams.has('driveType')) {
    throw new LabelSpecError('driveType', 'missing');
  }
  return searchParams.get('driveType') ?? NO_DRIVE;
}

function readHasFrame(searchParams) {
  const hasFrame = searchParams.get('hasFrame') ?? 'false';
  if (hasFrame !== 'true' && hasFrame !== 'false') {
    throw new LabelSpecError('hasFrame', 'invalid');
  }
  return hasFrame === 'true';
}

function readUsages(searchParams) {
  const usages = searchParams.get('usages');
  return usages ? usages.split(',') : [];
}

export function readLabelFieldsFromQuery(queryString) {
  const searchParams = new URLSearchParams(queryString);
  return {
    width: readRequired(searchParams, 'width'),
    height: readRequired(searchParams, 'height'),
    hardwareType: readRequired(searchParams, 'hardwareType'),
    driveType: readDriveType(searchParams),
    driveSize: searchParams.get('driveSize') ?? '',
    dimensions: searchParams.get('dimensions') ?? '',
    hasFrame: readHasFrame(searchParams),
    usages: readUsages(searchParams),
  };
}

export function buildLabelFieldsQuery(fields) {
  return new URLSearchParams({
    ...fields,
    usages: fields.usages.join(','),
  }).toString();
}
