import { translate } from '../i18n/translate.js';

export function describeLabelSpecError(language, error) {
  return translate(language, `error.${error.field}.${error.reason}`, error);
}
