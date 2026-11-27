import { fr } from './fr.js';
import { en } from './en.js';

const dictionaries = { fr, en };

export const DEFAULT_LANGUAGE = 'fr';

export const languages = Object.keys(dictionaries);

export function checkLanguageIsSupported(language) {
  if (!languages.includes(language)) {
    throw new Error(`Unknown language: ${language}`);
  }
  return language;
}

function findDictionary(language) {
  return dictionaries[checkLanguageIsSupported(language)];
}

function toParameterText(value) {
  return Array.isArray(value) ? value.join(' ') : String(value);
}

function insertParameters(text, parameters) {
  return text.replace(/\{(\w+)\}/g, (placeholder, name) => {
    if (!(name in parameters)) {
      throw new Error(`Missing parameter ${name}`);
    }
    return toParameterText(parameters[name]);
  });
}

export function translate(language, key, parameters = {}) {
  const text = findDictionary(language)[key];
  if (text === undefined) {
    throw new Error(`No text for ${key} in ${language}`);
  }
  return insertParameters(text, parameters);
}
