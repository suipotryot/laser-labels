import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readStoredLanguage, storeLanguage } from '../../src/i18n/storedLanguage.js';

function createStorage(initialContent = {}) {
  const content = { ...initialContent };
  return {
    getItem: (key) => content[key] ?? null,
    setItem: (key, value) => {
      content[key] = value;
    },
  };
}

describe('readStoredLanguage', () => {
  it('should default to French when nothing was stored', () => {
    assert.equal(readStoredLanguage(createStorage()), 'fr');
  });

  it('should return the language stored earlier', () => {
    const storage = createStorage();
    storeLanguage(storage, 'en');

    assert.equal(readStoredLanguage(storage), 'en');
  });

  it('should fall back to French and warn when the stored language is not supported', () => {
    const storage = createStorage({ 'laser-labels.language': 'de' });
    const warnings = [];

    assert.equal(readStoredLanguage(storage, (message) => warnings.push(message)), 'fr');
    assert.match(warnings[0], /Unknown language: de/);
  });

  it('should fall back to French and warn when the storage cannot be read', () => {
    const blockedStorage = {
      getItem: () => {
        throw new Error('Storage is blocked');
      },
    };
    const warnings = [];

    assert.equal(readStoredLanguage(blockedStorage, (message) => warnings.push(message)), 'fr');
    assert.match(warnings[0], /Storage is blocked/);
  });
});

describe('storeLanguage', () => {
  it('should refuse to store a language that is not supported', () => {
    assert.throws(() => storeLanguage(createStorage(), 'de'), /Unknown language: de/);
  });
});
