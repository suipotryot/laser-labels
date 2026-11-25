export const hardwareTypes = [
  { key: 'screw', label: 'Vis', hasDrive: true },
  { key: 'nail', label: 'Clou', hasDrive: false },
  { key: 'bolt', label: 'Boulon', hasDrive: false },
  { key: 'nut', label: 'Écrou', hasDrive: false },
  { key: 'hook', label: 'Crochet', hasDrive: false },
  { key: 'eyeScrew', label: 'Piton', hasDrive: false },
  { key: 'wallPlug', label: 'Cheville', hasDrive: false },
  { key: 'mollyAnchor', label: 'Cheville Molly', hasDrive: false },
];

export function findHardwareType(key) {
  return hardwareTypes.find((hardwareType) => hardwareType.key === key);
}
