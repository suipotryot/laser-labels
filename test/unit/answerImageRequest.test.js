import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { answerImageRequest } from '../../src/image/answerImageRequest.js';
import { loadTestFont } from './helpers/loadTestFont.js';

const font = loadTestFont();

describe('answerImageRequest', () => {
  it('should answer with the label svg and its size in millimeters', () => {
    const answer = answerImageRequest('?width=60&height=20&hardwareType=washer', font);

    assert.equal(answer.type, 'engraving-image');
    assert.equal(answer.widthMm, 60);
    assert.equal(answer.heightMm, 20);
    assert.match(answer.svg, /^<svg /);
  });

  it('should answer with the invalid field and the reason when the label is refused', () => {
    const answer = answerImageRequest('?width=2&height=20&hardwareType=washer', font);

    assert.deepEqual(answer, { type: 'engraving-image-error', field: 'width', reason: 'tooSmall' });
  });

  it('should let unexpected errors through instead of answering', () => {
    assert.throws(() => answerImageRequest('?width=60&height=20&hardwareType=washer', null), TypeError);
  });
});
