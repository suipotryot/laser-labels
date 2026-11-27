import { publishBuild } from './publishBuild.js';

const publishedDirectory = publishBuild('dist', '../suipotryot.github.io');
console.log(`Published to ${publishedDirectory}`);
