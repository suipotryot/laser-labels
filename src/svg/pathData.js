import { svgMarkup } from './svgMarkup.js';

const PATH_COMMAND_FORMATS = {
  M: ({ x, y }) => svgMarkup`M${x} ${y}`,
  L: ({ x, y }) => svgMarkup`L${x} ${y}`,
  Q: ({ x1, y1, x, y }) => svgMarkup`Q${x1} ${y1} ${x} ${y}`,
  C: ({ x1, y1, x2, y2, x, y }) => svgMarkup`C${x1} ${y1} ${x2} ${y2} ${x} ${y}`,
  Z: () => 'Z',
};

function formatPathCommand(command) {
  const format = PATH_COMMAND_FORMATS[command.type];
  if (!format) {
    throw new Error(`Unknown path command: ${command.type}`);
  }
  return format(command);
}

export function toSvgPathData(commands) {
  return commands.map(formatPathCommand).join('');
}
