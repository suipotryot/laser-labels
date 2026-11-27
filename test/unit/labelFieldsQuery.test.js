import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NO_DRIVE } from '../../src/catalog/driveTypes.js';
import { LabelSpecError } from '../../src/label/labelSpec.js';
import { buildLabelFieldsQuery, readLabelFieldsFromQuery } from '../../src/label/labelFieldsQuery.js';

describe('readLabelFieldsFromQuery', () => {
  it('should read every form field from the query string', () => {
    const query = '?width=60&height=20&hardwareType=screw&driveType=pozidriv&driveSize=PZ2&dimensions=3%2C5x50&hasFrame=true&usages=metal,outdoor';

    assert.deepEqual(readLabelFieldsFromQuery(query), {
      width: '60',
      height: '20',
      hardwareType: 'screw',
      driveType: 'pozidriv',
      driveSize: 'PZ2',
      dimensions: '3,5x50',
      hasFrame: true,
      usages: ['metal', 'outdoor'],
    });
  });

  it('should default the optional fields to an empty form', () => {
    assert.deepEqual(readLabelFieldsFromQuery('?width=60&height=20&hardwareType=washer'), {
      width: '60',
      height: '20',
      hardwareType: 'washer',
      driveType: NO_DRIVE,
      driveSize: '',
      dimensions: '',
      hasFrame: false,
      usages: [],
    });
  });

  for (const field of ['width', 'height', 'hardwareType']) {
    it(`should refuse a query without the required ${field}`, () => {
      const query = new URLSearchParams({ width: '60', height: '20', hardwareType: 'washer' });
      query.delete(field);

      assert.throws(
        () => readLabelFieldsFromQuery(query.toString()),
        (error) => error instanceof LabelSpecError && error.field === field && error.reason === 'missing',
      );
    });
  }
});

describe('buildLabelFieldsQuery', () => {
  it('should build a query that readLabelFieldsFromQuery reads back to the same fields', () => {
    const fields = {
      width: '60',
      height: '20',
      hardwareType: 'screw',
      driveType: 'pozidriv',
      driveSize: 'PZ2',
      dimensions: '3,5x50 & plus',
      hasFrame: true,
      usages: ['metal', 'outdoor'],
    };

    assert.deepEqual(readLabelFieldsFromQuery(buildLabelFieldsQuery(fields)), fields);
  });
});
