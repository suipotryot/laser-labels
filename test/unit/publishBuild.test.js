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

  beforeEach(() => {
    workDirectory = mkdtempSync(join(tmpdir(), 'publish-build-'));
    buildDirectory = join(workDirectory, 'dist');
    hubDirectory = join(workDirectory, 'hub');
    mkdirSync(buildDirectory);
    mkdirSync(hubDirectory);
    writeFileSync(join(buildDirectory, 'index.html'), '<html>new</html>');
  });

  afterEach(() => {
    rmSync(workDirectory, { recursive: true, force: true });
  });

  it('should copy the build into a laser-labels folder of the hub', () => {
    publishBuild(buildDirectory, hubDirectory);

    assert.equal(readFileSync(join(hubDirectory, 'laser-labels', 'index.html'), 'utf8'), '<html>new</html>');
  });

  it('should replace the previously published build', () => {
    mkdirSync(join(hubDirectory, 'laser-labels'));
    writeFileSync(join(hubDirectory, 'laser-labels', 'old.html'), 'old');

    publishBuild(buildDirectory, hubDirectory);

    assert.equal(existsSync(join(hubDirectory, 'laser-labels', 'old.html')), false);
  });

  it('should refuse to publish when the hub folder does not exist', () => {
    const missingHub = join(workDirectory, 'missing-hub');

    assert.throws(() => publishBuild(buildDirectory, missingHub), /Hub folder not found/);
  });

  it('should refuse to publish when the project was not built', () => {
    const missingBuild = join(workDirectory, 'missing-dist');

    assert.throws(() => publishBuild(missingBuild, hubDirectory), /Build folder not found/);
  });
});
