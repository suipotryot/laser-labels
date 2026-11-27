export const usageTypes = [
  { key: 'metal', name: 'Métal' },
  { key: 'outdoor', name: 'Extérieur' },
  { key: 'masonry', name: 'Béton / maçonnerie' },
];

export function findUsageType(key) {
  return usageTypes.find((usageType) => usageType.key === key);
}
