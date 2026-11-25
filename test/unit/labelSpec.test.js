import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readLabelSpec } from '../../src/label/labelSpec.js';
import { NO_DRIVE } from '../../src/catalog/driveTypes.js';

const validFields = {
  width: '60',
  height: '20',
  hardwareType: 'screw',
  driveType: 'pozidriv',
  driveSize: 'PZ2',
  dimensions: '3,5x50',
  hasFrame: false,
};

describe('readLabelSpec', () => {
  it('should read width and height as millimeter numbers', () => {
    const spec = readLabelSpec(validFields);

    assert.equal(spec.width, 60);
    assert.equal(spec.height, 20);
  });

  it('should accept a comma as decimal separator in millimeter values', () => {
    const spec = readLabelSpec({ ...validFields, width: '62,5' });

    assert.equal(spec.width, 62.5);
  });

  it('should reject a width that is not a number', () => {
    assert.throws(
      () => readLabelSpec({ ...validFields, width: 'abc' }),
      { name: 'LabelSpecError', field: 'width', reason: 'notAPositiveNumber' },
    );
  });

  it('should reject a height that is zero, negative or empty', () => {
    for (const height of ['0', '-5', '']) {
      assert.throws(
        () => readLabelSpec({ ...validFields, height }),
        { name: 'LabelSpecError', field: 'height', reason: 'notAPositiveNumber' },
      );
    }
  });

  it('should keep a hardware type known by the catalog', () => {
    const spec = readLabelSpec({ ...validFields, hardwareType: 'nut', driveType: NO_DRIVE, driveSize: '' });

    assert.equal(spec.hardwareType, 'nut');
  });

  it('should reject a hardware type unknown to the catalog', () => {
    assert.throws(
      () => readLabelSpec({ ...validFields, hardwareType: 'spaceship' }),
      { name: 'LabelSpecError', field: 'hardwareType', reason: 'unknown' },
    );
  });

  it('should read the drive type and size of a screw', () => {
    const spec = readLabelSpec(validFields);

    assert.deepEqual(spec.drive, { type: 'pozidriv', size: 'PZ2' });
  });

  it('should have no drive when the drive type is left empty', () => {
    const spec = readLabelSpec({ ...validFields, driveType: NO_DRIVE, driveSize: '' });

    assert.equal(spec.drive, null);
  });

  it('should reject a drive given for a hardware type without drive', () => {
    assert.throws(
      () => readLabelSpec({ ...validFields, hardwareType: 'nut' }),
      { name: 'LabelSpecError', field: 'driveType', reason: 'notApplicable' },
    );
  });

  it('should reject a drive type unknown to the catalog', () => {
    assert.throws(
      () => readLabelSpec({ ...validFields, driveType: 'banana' }),
      { name: 'LabelSpecError', field: 'driveType', reason: 'unknown' },
    );
  });

  it('should reject a drive size that does not belong to the drive type', () => {
    assert.throws(
      () => readLabelSpec({ ...validFields, driveSize: 'T25' }),
      { name: 'LabelSpecError', field: 'driveSize', reason: 'unknown' },
    );
  });

  it('should keep the part dimensions as typed, without surrounding spaces', () => {
    const spec = readLabelSpec({ ...validFields, dimensions: '  M6 x 40 ' });

    assert.equal(spec.dimensions, 'M6 x 40');
  });

  it('should tell whether the label has a frame', () => {
    const spec = readLabelSpec({ ...validFields, hasFrame: true });

    assert.equal(spec.hasFrame, true);
  });

  it('should reject millimeter values written in a non decimal notation', () => {
    for (const width of ['0x10', '0b11', '1e3', '9'.repeat(400)]) {
      assert.throws(
        () => readLabelSpec({ ...validFields, width }),
        { name: 'LabelSpecError', field: 'width', reason: 'notAPositiveNumber' },
      );
    }
  });

  it('should reject a width or height too small to engrave a label', () => {
    assert.throws(
      () => readLabelSpec({ ...validFields, height: '4,9' }),
      { name: 'LabelSpecError', field: 'height', reason: 'tooSmall' },
    );
  });

  it('should reject part dimensions containing control characters', () => {
    assert.throws(
      () => readLabelSpec({ ...validFields, dimensions: '3,5x50' }),
      { name: 'LabelSpecError', field: 'dimensions', reason: 'invalidCharacters' },
    );
  });
});
