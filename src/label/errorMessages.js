const errorMessages = {
  width: { notAPositiveNumber: 'La largeur doit être un nombre positif (en mm).' },
  height: { notAPositiveNumber: 'La hauteur doit être un nombre positif (en mm).' },
  hardwareType: { unknown: 'Type de quincaillerie inconnu.' },
  driveType: {
    notApplicable: "Ce type de quincaillerie n'a pas d'empreinte.",
    unknown: "Type d'empreinte inconnu.",
  },
  driveSize: { unknown: "Cette taille ne correspond pas au type d'empreinte choisi." },
};

export function describeLabelSpecError({ field, reason }) {
  const message = errorMessages[field]?.[reason];
  if (!message) {
    throw new Error(`No message for ${field}.${reason}`);
  }
  return message;
}
