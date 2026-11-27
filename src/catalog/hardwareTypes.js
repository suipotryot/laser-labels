export const hardwareTypes = [
  { key: 'screw', hasDrive: true },
  { key: 'nail', hasDrive: false },
  { key: 'bolt', hasDrive: false },
  { key: 'nut', hasDrive: false },
  { key: 'hook', hasDrive: false },
  { key: 'eyeScrew', hasDrive: false },
  { key: 'wallPlug', hasDrive: false },
  { key: 'mollyAnchor', hasDrive: false },
  { key: 'washer', hasDrive: false },
  { key: 'threadedRod', hasDrive: false },
  { key: 'rivet', hasDrive: false },
  { key: 'anchorBolt', hasDrive: false },
];

export function findHardwareType(key) {
  return hardwareTypes.find((hardwareType) => hardwareType.key === key);
}
