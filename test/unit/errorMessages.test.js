import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { describeLabelSpecError } from '../../src/label/errorMessages.js';
import { LabelSpecError } from '../../src/label/labelSpec.js';

describe('describeLabelSpecError', () => {
  it('should describe an invalid width to the user', () => {
    const error = new LabelSpecError('width', 'notAPositiveNumber');

    assert.equal(describeLabelSpecError(error), 'La largeur doit être un nombre positif (en mm).');
  });

  it('should list the characters that cannot be engraved', () => {
    const error = new LabelSpecError('dimensions', 'unsupportedCharacters', { characters: ['⌀', '→'] });

    assert.equal(describeLabelSpecError(error), 'Ces caractères ne peuvent pas être gravés : ⌀ →');
  });

  it('should refuse to describe an error it has no message for', () => {
    const error = new LabelSpecError('width', 'tooFunny');

    assert.throws(() => describeLabelSpecError(error), /No message for width\.tooFunny/);
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
      ['dimensions', 'invalidCharacters'],
      ['dimensions', 'unsupportedCharacters', { characters: ['→'] }],
    ];

    for (const [field, reason, details] of raisableErrors) {
      assert.ok(describeLabelSpecError(new LabelSpecError(field, reason, details)));
    }
  });
});
