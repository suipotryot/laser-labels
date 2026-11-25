export const driveTypes = [
  {
    key: 'phillips',
    label: 'Phillips',
    sizes: ['PH000', 'PH00', 'PH0', 'PH1', 'PH2', 'PH3', 'PH4'],
  },
  {
    key: 'pozidriv',
    label: 'Pozidriv',
    sizes: ['PZ0', 'PZ1', 'PZ2', 'PZ3', 'PZ4'],
  },
  {
    key: 'torx',
    label: 'Torx',
    sizes: ['T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T15', 'T20', 'T25', 'T27', 'T30', 'T40', 'T45', 'T50'],
  },
  {
    key: 'hexSocket',
    label: 'Six pans creux',
    sizes: ['H1,5', 'H2', 'H2,5', 'H3', 'H4', 'H5', 'H6', 'H8', 'H10'],
  },
  {
    key: 'slotted',
    label: 'Fente',
    sizes: ['SL2,5', 'SL3', 'SL3,5', 'SL4', 'SL5,5', 'SL6,5', 'SL8'],
  },
  {
    key: 'square',
    label: 'Carré',
    sizes: ['SQ0', 'SQ1', 'SQ2', 'SQ3'],
  },
];

export function findDriveType(key) {
  return driveTypes.find((driveType) => driveType.key === key);
}
