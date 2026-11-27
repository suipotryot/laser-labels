import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { answerImageRequest } from '../../src/image/answerImageRequest.js';
import { loadTestFont } from './helpers/loadTestFont.js';

const font = loadTestFont();
const VALID_QUERY = '?width=60&height=20&hardwareType=washer';
const TOO_SMALL_WIDTH_QUERY = '?width=2&height=20&hardwareType=washer';

describe('answerImageRequest', () => {
  it('should answer with the label svg and its size in millimeters', () => {
    const answer = answerImageRequest(VALID_QUERY, font);

    assert.equal(answer.type, 'engraving-image');
    assert.equal(answer.widthMm, 60);
    assert.equal(answer.heightMm, 20);
    assert.match(answer.svg, /^<svg /);
  });

  it('should answer with the invalid field and the reason when the label is refused', () => {
    const answer = answerImageRequest(TOO_SMALL_WIDTH_QUERY, font);

    assert.deepEqual(answer, { type: 'engraving-image-error', field: 'width', reason: 'tooSmall' });
  });

  it('should list the characters that cannot be engraved', () => {
    const answer = answerImageRequest('?width=60&height=20&hardwareType=washer&dimensions=%E2%98%83', font);

    assert.deepEqual(answer, { type: 'engraving-image-error', field: 'dimensions', reason: 'unengravableCharacters', characters: ['☃'] });
  });

  it('should let unexpected errors through instead of answering', () => {
    assert.throws(() => answerImageRequest(VALID_QUERY, null), TypeError);
  });
});
