import { DEFAULT_LANGUAGE, checkLanguageIsSupported } from './translate.js';

const STORAGE_KEY = 'laser-labels.language';

export function readStoredLanguage(storage) {
  const storedLanguage = storage.getItem(STORAGE_KEY);
  return storedLanguage === null ? DEFAULT_LANGUAGE : checkLanguageIsSupported(storedLanguage);
}

export function storeLanguage(storage, language) {
  storage.setItem(STORAGE_KEY, checkLanguageIsSupported(language));
}
