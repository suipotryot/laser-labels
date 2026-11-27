import { answerImageRequest } from './answerImageRequest.js';
import { loadEngravingFont } from '../text/loadEngravingFont.js';

const ANY_EMBEDDING_ORIGIN = '*';
const INTERNAL_ERROR_ANSWER = { type: 'engraving-image-error', field: null, reason: 'internal' };

function sendToEmbeddingPage(answer) {
  window.parent.postMessage(answer, ANY_EMBEDDING_ORIGIN);
}

async function answerWithFont() {
  sendToEmbeddingPage(answerImageRequest(location.search, await loadEngravingFont()));
}

export async function answerEmbeddingPage() {
  try {
    await answerWithFont();
  } catch (error) {
    sendToEmbeddingPage(INTERNAL_ERROR_ANSWER);
    throw error;
  }
}
