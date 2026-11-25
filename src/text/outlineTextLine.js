import { svgMarkup } from '../svg/svgMarkup.js';

function closeLastContour(commands) {
  if (commands.length > 0 && commands.at(-1).type !== 'Z') {
    commands.push({ type: 'Z' });
  }
}

function closeEveryContour(commands) {
  const closedCommands = [];
  for (const command of commands) {
    if (command.type === 'M') {
      closeLastContour(closedCommands);
    }
    closedCommands.push(command);
  }
  closeLastContour(closedCommands);
  return closedCommands;
}

const PATH_DATA_FORMATS = {
  M: ({ x, y }) => svgMarkup`M${x} ${y}`,
  L: ({ x, y }) => svgMarkup`L${x} ${y}`,
  Q: ({ x1, y1, x, y }) => svgMarkup`Q${x1} ${y1} ${x} ${y}`,
  C: ({ x1, y1, x2, y2, x, y }) => svgMarkup`C${x1} ${y1} ${x2} ${y2} ${x} ${y}`,
  Z: () => 'Z',
};

function toPathData(command) {
  const format = PATH_DATA_FORMATS[command.type];
  if (!format) {
    throw new Error(`Unknown path command: ${command.type}`);
  }
  return format(command);
}

export function outlineTextLine(font, { text, x, baseline, fontSize }) {
  const { commands } = font.getPath(text, x, baseline, fontSize);
  return closeEveryContour(commands).map(toPathData).join('');
}
