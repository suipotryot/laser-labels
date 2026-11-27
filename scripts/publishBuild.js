import { cpSync, existsSync, renameSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PROJECT_FOLDER_IN_HUB = 'laser-labels';
const UNFINISHED_FOLDER_IN_HUB = 'laser-labels.unfinished';

function assertFolderExists(folder, description) {
  if (!existsSync(folder)) {
    throw new Error(`${description} not found: ${folder}`);
  }
  if (!statSync(folder).isDirectory()) {
    throw new Error(`${description} is not a folder: ${folder}`);
  }
}

function assertBuildHasEntryPage(buildDirectory) {
  if (!existsSync(join(buildDirectory, 'index.html'))) {
    throw new Error(`Build has no index.html: ${buildDirectory}`);
  }
}

function copyBuildBesidePublishedFolder(buildDirectory, unfinishedDirectory) {
  rmSync(unfinishedDirectory, { recursive: true, force: true });
  try {
    cpSync(buildDirectory, unfinishedDirectory, { recursive: true });
  } catch (error) {
    rmSync(unfinishedDirectory, { recursive: true, force: true });
    throw error;
  }
}

function replacePublishedFolderWithBuild(buildDirectory, hubDirectory) {
  const publishedDirectory = join(hubDirectory, PROJECT_FOLDER_IN_HUB);
  const unfinishedDirectory = join(hubDirectory, UNFINISHED_FOLDER_IN_HUB);
  copyBuildBesidePublishedFolder(buildDirectory, unfinishedDirectory);
  rmSync(publishedDirectory, { recursive: true, force: true });
  renameSync(unfinishedDirectory, publishedDirectory);
  return publishedDirectory;
}

export function publishBuild(buildDirectory, hubDirectory) {
  assertFolderExists(buildDirectory, 'Build folder');
  assertBuildHasEntryPage(buildDirectory);
  assertFolderExists(hubDirectory, 'Hub folder');
  return replacePublishedFolderWithBuild(buildDirectory, hubDirectory);
}
