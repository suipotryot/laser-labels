import { fileURLToPath } from 'node:url';
import { publishBuild } from './publishBuild.js';

const BUILD_DIRECTORY = fileURLToPath(new URL('../dist', import.meta.url));
const HUB_DIRECTORY = fileURLToPath(new URL('../../suipotryot.github.io', import.meta.url));

const publishedDirectory = publishBuild(BUILD_DIRECTORY, HUB_DIRECTORY);
console.log(`Published to ${publishedDirectory}`);
