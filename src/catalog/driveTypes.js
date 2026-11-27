export const NO_DRIVE = '';

export const driveTypes = [
  {
    key: 'phillips',
    sizes: ['PH000', 'PH00', 'PH0', 'PH1', 'PH2', 'PH3', 'PH4'],
  },
  {
    key: 'pozidriv',
    sizes: ['PZ0', 'PZ1', 'PZ2', 'PZ3', 'PZ4'],
  },
  {
    key: 'torx',
    sizes: ['T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T15', 'T20', 'T25', 'T27', 'T30', 'T40', 'T45', 'T50'],
  },
  {
    key: 'torxTamperResistant',
    sizes: ['T8H', 'T9H', 'T10H', 'T15H', 'T20H', 'T25H', 'T27H', 'T30H', 'T40H', 'T45H', 'T50H'],
  },
  {
    key: 'hexSocket',
    sizes: ['H1,5', 'H2', 'H2,5', 'H3', 'H4', 'H5', 'H6', 'H8', 'H10'],
  },
  {
    key: 'slotted',
    sizes: ['SL2,5', 'SL3', 'SL3,5', 'SL4', 'SL5,5', 'SL6,5', 'SL8'],
  },
  {
    key: 'square',
    sizes: ['SQ0', 'SQ1', 'SQ2', 'SQ3'],
  },
];

export function findDriveType(key) {
  return driveTypes.find((driveType) => driveType.key === key);
}
