function hasOpenContour(commands) {
  return commands.length > 0 && commands.at(-1).type !== 'Z';
}

function closeOpenContour(commands) {
  if (hasOpenContour(commands)) {
    commands.push({ type: 'Z' });
  }
}

function closeEveryContour(commands) {
  const closedCommands = [];
  for (const command of commands) {
    if (command.type === 'M') {
      closeOpenContour(closedCommands);
    }
    closedCommands.push(command);
  }
  closeOpenContour(closedCommands);
  return closedCommands;
}

export function outlineTextLine(font, { text, x, baseline, fontSize }) {
  return closeEveryContour(font.getPath(text, x, baseline, fontSize).commands);
}
