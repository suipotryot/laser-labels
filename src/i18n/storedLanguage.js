import { DEFAULT_LANGUAGE, checkLanguageIsSupported } from './translate.js';

const STORAGE_KEY = 'laser-labels.language';

function readLanguageStoredIn(storage) {
  const storedLanguage = storage.getItem(STORAGE_KEY);
  return storedLanguage === null ? DEFAULT_LANGUAGE : checkLanguageIsSupported(storedLanguage);
}

export function readStoredLanguage(storage, warn = console.warn) {
  try {
    return readLanguageStoredIn(storage);
  } catch (error) {
    warn(`Stored language ignored, falling back to ${DEFAULT_LANGUAGE}: ${error.message}`);
    return DEFAULT_LANGUAGE;
  }
}

export function storeLanguage(storage, language) {
  storage.setItem(STORAGE_KEY, checkLanguageIsSupported(language));
}
