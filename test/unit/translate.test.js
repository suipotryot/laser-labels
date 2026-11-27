import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../../src/i18n/translate.js';

describe('translate', () => {
  it('should return the text of the key in the requested language', () => {
    assert.equal(translate('fr', 'hardware.nut'), 'Écrou');
    assert.equal(translate('en', 'hardware.nut'), 'Nut');
  });

  it('should refuse a key that has no text', () => {
    assert.throws(() => translate('fr', 'hardware.unicorn'), /No text for hardware\.unicorn in fr/);
  });

  it('should insert the parameters into the text', () => {
    const text = translate('en', 'error.dimensions.unengravableCharacters', { characters: ['⌀', '→'] });

    assert.equal(text, 'These characters cannot be engraved: ⌀ →');
  });

  it('should refuse a text whose parameter is not given', () => {
    assert.throws(() => translate('en', 'error.dimensions.unengravableCharacters'), /Missing parameter characters/);
  });

  it('should refuse an unknown language', () => {
    assert.throws(() => translate('de', 'hardware.nut'), /Unknown language: de/);
  });

  it('should insert the parameters into the text', () => {
    assert.equal(translate('en', 'error.dimensions.unengravableCharacters', { characters: ['⌀', '→'] }), 'These characters cannot be engraved: ⌀ →');
  });
});
