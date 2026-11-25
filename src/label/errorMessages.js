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
  dimensions: { invalidCharacters: 'Les dimensions contiennent des caractères invisibles non gravables.' },
};

export function describeLabelSpecError({ field, reason }) {
  const message = errorMessages[field]?.[reason];
  if (!message) {
    throw new Error(`No message for ${field}.${reason}`);
  }
  return message;
}
