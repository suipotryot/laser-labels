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

  it('should refuse a stored language that is not supported', () => {
    const storage = createStorage({ 'laser-labels.language': 'de' });

    assert.throws(() => readStoredLanguage(storage), /Unknown language: de/);
  });
});

describe('storeLanguage', () => {
  it('should refuse to store a language that is not supported', () => {
    assert.throws(() => storeLanguage(createStorage(), 'de'), /Unknown language: de/);
  });
});
