import { cpSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const PROJECT_FOLDER_IN_HUB = 'laser-labels';

function checkFolderExists(folder, description) {
  if (!existsSync(folder)) {
    throw new Error(`${description} not found: ${folder}`);
  }
}

export function publishBuild(buildDirectory, hubDirectory) {
  checkFolderExists(buildDirectory, 'Build folder');
  checkFolderExists(hubDirectory, 'Hub folder');
  const publishedDirectory = join(hubDirectory, PROJECT_FOLDER_IN_HUB);
  rmSync(publishedDirectory, { recursive: true, force: true });
  cpSync(buildDirectory, publishedDirectory, { recursive: true });
  return publishedDirectory;
}
