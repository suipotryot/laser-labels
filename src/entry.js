const isImageMode = new URLSearchParams(location.search).get('mode') === 'image';

if (isImageMode) {
  const { answerEmbeddingPage } = await import('./image/imageMode.js');
  await answerEmbeddingPage();
} else {
  await import('./main.js');
}
