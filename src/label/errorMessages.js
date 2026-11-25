const errorMessages = {
  width: {
    notAPositiveNumber: 'La largeur doit être un nombre positif (en mm).',
    tooSmall: 'La largeur doit faire au moins 5 mm.',
  },
  height: {
    notAPositiveNumber: 'La hauteur doit être un nombre positif (en mm).',
    tooSmall: 'La hauteur doit faire au moins 5 mm.',
  },
  hardwareType: { unknown: 'Type de quincaillerie inconnu.' },
  driveType: {
    notApplicable: "Ce type de quincaillerie n'a pas d'empreinte.",
    unknown: "Type d'empreinte inconnu.",
  },
  driveSize: { unknown: "Cette taille ne correspond pas au type d'empreinte choisi." },
  dimensions: {
    tooLong: 'Les dimensions ne doivent pas dépasser 40 caractères.',
    invalidCharacters: 'Les dimensions contiennent des caractères invisibles non gravables.',
    unsupportedCharacters: ({ characters }) => `Ces caractères ne peuvent pas être gravés : ${characters.join(' ')}`,
  },
};

function isWrittenFromErrorDetails(message) {
  return typeof message === 'function';
}

export function describeLabelSpecError(error) {
  const message = errorMessages[error.field]?.[error.reason];
  if (!message) {
    throw new Error(`No message for ${error.field}.${error.reason}`);
  }
  return isWrittenFromErrorDetails(message) ? message(error) : message;
}
