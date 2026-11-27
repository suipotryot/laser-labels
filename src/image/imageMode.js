import { answerImageRequest } from './answerImageRequest.js';
import { loadEngravingFont } from '../text/loadEngravingFont.js';

const ANY_EMBEDDING_ORIGIN = '*';

export async function answerEmbeddingPage() {
  const font = await loadEngravingFont();
  window.parent.postMessage(answerImageRequest(location.search, font), ANY_EMBEDDING_ORIGIN);
}
