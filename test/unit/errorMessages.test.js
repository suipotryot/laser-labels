import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { describeLabelSpecError } from '../../src/label/errorMessages.js';
import { languages } from '../../src/i18n/translate.js';
import { LabelSpecError } from '../../src/label/labelSpec.js';

describe('describeLabelSpecError', () => {
  it('should describe an invalid width to the user', () => {
    const error = new LabelSpecError('width', 'notAPositiveNumber');

    assert.equal(describeLabelSpecError('fr', error), 'La largeur doit être un nombre positif (en mm).');
  });

  it('should describe an invalid width in the requested language', () => {
    const error = new LabelSpecError('width', 'notAPositiveNumber');

    assert.equal(describeLabelSpecError('en', error), 'The width must be a positive number (in mm).');
  });

  it('should list the characters that cannot be engraved', () => {
    const error = new LabelSpecError('dimensions', 'unengravableCharacters', { characters: ['⌀', '→'] });

    assert.equal(describeLabelSpecError('fr', error), 'Ces caractères ne peuvent pas être gravés : ⌀ →');
  });

  it('should refuse to describe an error it has no message for', () => {
    const error = new LabelSpecError('width', 'tooFunny');

    assert.throws(() => describeLabelSpecError('fr', error), /No text for error\.width\.tooFunny in fr/);
  });

  it('should describe every error the label spec reader can raise', () => {
    const raisableErrors = [
      ['width', 'notAPositiveNumber'],
      ['width', 'tooSmall'],
      ['height', 'notAPositiveNumber'],
      ['height', 'tooSmall'],
      ['hardwareType', 'unknown'],
      ['driveType', 'notApplicable'],
      ['driveType', 'unknown'],
      ['driveSize', 'unknown'],
      ['dimensions', 'tooLong'],
      ['dimensions', 'nonPrintableCharacters'],
      ['dimensions', 'unengravableCharacters', { characters: ['→'] }],
      ['usages', 'unknown'],
      ['usages', 'duplicated'],
    ];

    for (const language of languages) {
      for (const [field, reason, details] of raisableErrors) {
        assert.ok(describeLabelSpecError(language, new LabelSpecError(field, reason, details)));
      }
    }
  });
});
