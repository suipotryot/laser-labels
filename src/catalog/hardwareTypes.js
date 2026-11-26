export const hardwareTypes = [
  { key: 'screw', name: 'Vis', hasDrive: true },
  { key: 'nail', name: 'Clou', hasDrive: false },
  { key: 'bolt', name: 'Boulon', hasDrive: false },
  { key: 'nut', name: 'Écrou', hasDrive: false },
  { key: 'hook', name: 'Crochet', hasDrive: false },
  { key: 'eyeScrew', name: 'Piton', hasDrive: false },
  { key: 'wallPlug', name: 'Cheville', hasDrive: false },
  { key: 'mollyAnchor', name: 'Cheville Molly', hasDrive: false },
  { key: 'washer', name: 'Rondelle', hasDrive: false },
  { key: 'threadedRod', name: 'Tige filetée', hasDrive: false },
  { key: 'rivet', name: 'Rivet', hasDrive: false },
  { key: 'anchorBolt', name: "Goujon d'ancrage", hasDrive: false },
];

export function findHardwareType(key) {
  return hardwareTypes.find((hardwareType) => hardwareType.key === key);
}
