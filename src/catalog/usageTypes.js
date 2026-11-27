export const usageTypes = [
  { key: 'metal' },
  { key: 'outdoor' },
  { key: 'masonry' },
];

export function findUsageType(key) {
  return usageTypes.find((usageType) => usageType.key === key);
}
