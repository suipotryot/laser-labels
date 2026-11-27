import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { publishBuild } from '../../scripts/publishBuild.js';

describe('publishBuild', () => {
  let workDirectory;
  let buildDirectory;
  let hubDirectory;
  let publishedDirectory;

  beforeEach(() => {
    workDirectory = mkdtempSync(join(tmpdir(), 'publish-build-'));
    buildDirectory = join(workDirectory, 'dist');
    hubDirectory = join(workDirectory, 'hub');
    publishedDirectory = join(hubDirectory, 'laser-labels');
    mkdirSync(buildDirectory);
    mkdirSync(hubDirectory);
    writeFileSync(join(buildDirectory, 'index.html'), '<html>new</html>');
  });

  afterEach(() => {
    rmSync(workDirectory, { recursive: true, force: true });
  });

  it('should copy the build into a laser-labels folder of the hub', () => {
    publishBuild(buildDirectory, hubDirectory);

    assert.equal(readFileSync(join(publishedDirectory, 'index.html'), 'utf8'), '<html>new</html>');
  });

  it('should replace the previously published build', () => {
    mkdirSync(publishedDirectory);
    writeFileSync(join(publishedDirectory, 'old.html'), 'old');

    publishBuild(buildDirectory, hubDirectory);

    assert.equal(existsSync(join(publishedDirectory, 'old.html')), false);
  });

  it('should refuse to publish when the hub folder does not exist', () => {
    const missingHub = join(workDirectory, 'missing-hub');

    assert.throws(() => publishBuild(buildDirectory, missingHub), /Hub folder not found/);
  });

  it('should refuse to publish when the project was not built', () => {
    const missingBuild = join(workDirectory, 'missing-dist');

    assert.throws(() => publishBuild(missingBuild, hubDirectory), /Build folder not found/);
  });

  it('should refuse to publish a build without index.html and keep the published one', () => {
    mkdirSync(publishedDirectory);
    writeFileSync(join(publishedDirectory, 'old.html'), 'old');
    rmSync(join(buildDirectory, 'index.html'));

    assert.throws(() => publishBuild(buildDirectory, hubDirectory), /Build has no index\.html/);
    assert.equal(existsSync(join(publishedDirectory, 'old.html')), true);
  });

  it('should refuse a build or a hub that is not a folder', () => {
    const aFile = join(workDirectory, 'file.txt');
    writeFileSync(aFile, 'x');

    assert.throws(() => publishBuild(aFile, hubDirectory), /Build folder is not a folder/);
    assert.throws(() => publishBuild(buildDirectory, aFile), /Hub folder is not a folder/);
  });

  it('should keep the published build when the copy fails', () => {
    const hubInsideBuild = join(buildDirectory, 'hub');
    mkdirSync(join(hubInsideBuild, 'laser-labels'), { recursive: true });
    writeFileSync(join(hubInsideBuild, 'laser-labels', 'old.html'), 'old');

    assert.throws(() => publishBuild(buildDirectory, hubInsideBuild));
    assert.equal(existsSync(join(hubInsideBuild, 'laser-labels', 'old.html')), true);
  });
});
