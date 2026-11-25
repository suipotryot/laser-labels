import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { describeLabelSpecError } from '../../src/label/errorMessages.js';
import { LabelSpecError } from '../../src/label/labelSpec.js';

describe('describeLabelSpecError', () => {
  it('should describe an invalid width to the user', () => {
    const error = new LabelSpecError('width', 'notAPositiveNumber');

    assert.equal(describeLabelSpecError(error), 'La largeur doit être un nombre positif (en mm).');
  });

  it('should refuse to describe an error it has no message for', () => {
    const error = new LabelSpecError('width', 'tooFunny');

    assert.throws(() => describeLabelSpecError(error), /No message for width\.tooFunny/);
  });

  it('should describe every error the label spec reader can raise', () => {
    const raisableErrors = [
      ['width', 'notAPositiveNumber'],
      ['height', 'notAPositiveNumber'],
      ['hardwareType', 'unknown'],
      ['driveType', 'notApplicable'],
      ['driveType', 'unknown'],
      ['driveSize', 'unknown'],
    ];

    for (const [field, reason] of raisableErrors) {
      assert.ok(describeLabelSpecError(new LabelSpecError(field, reason)));
    }
  });
});
