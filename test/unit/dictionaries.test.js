import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fr } from '../../src/i18n/fr.js';
import { en } from '../../src/i18n/en.js';
import { hardwareTypes } from '../../src/catalog/hardwareTypes.js';
import { usageTypes } from '../../src/catalog/usageTypes.js';
import { driveTypes } from '../../src/catalog/driveTypes.js';

describe('dictionaries', () => {
  it('should have the same keys in French and in English', () => {
    assert.deepEqual(Object.keys(fr).sort(), Object.keys(en).sort());
  });

  it('should name every hardware type, usage and drive type of the catalogs', () => {
    const expectedKeys = [
      ...hardwareTypes.map(({ key }) => `hardware.${key}`),
      ...usageTypes.map(({ key }) => `usage.${key}`),
      ...driveTypes.map(({ key }) => `drive.${key}`),
    ];

    for (const dictionary of [fr, en]) {
      assert.deepEqual(expectedKeys.filter((key) => !(key in dictionary)), []);
    }
  });
});
