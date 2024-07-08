'use strict';

const assert = require('assert').strict;
const path = require('path');
const fs = require('fs').promises;
const vendorCopy = require('../');

function readFile(relativePath) {
  return fs.readFile(path.join(__dirname, relativePath), 'utf8');
}

function rmdir(relativePath) {
  return fs.rm(path.join(__dirname, relativePath), { force: true, recursive: true });
}

function mkdir(relativePath) {
  return fs.mkdir(path.join(__dirname, relativePath), { recursive: true });
}

function writeFile(relativePath, content) {
  return fs.writeFile(path.join(__dirname, relativePath), content);
}

function symlink(relativeTargetPath, relativeDestinationPath) {
  const targetPath = path.join(__dirname, relativeTargetPath);
  const destinationPath = path.join(__dirname, relativeDestinationPath);

  return fs.symlink(targetPath, destinationPath);
}

describe('vendorCopy', () => {
  beforeEach(async () => {
    await rmdir('../test-copy-space/');
    await mkdir('../test-copy-space/');
    await Promise.all([
      mkdir('../test-copy-space/source'),
      mkdir('../test-copy-space/target')
    ]);
    await Promise.all([
      writeFile('../test-copy-space/source/fixture.01.txt', 'fixture 01'),
      writeFile('../test-copy-space/source/fixture.02.txt', 'fixture 02')
    ]);
    await symlink('../test-copy-space/source/fixture.01.txt', '../test-copy-space/source/fixture.03.txt');
  });

  it('is a function', () => {
    assert.equal(typeof vendorCopy, 'function');
  });

  describe('a single file into an existing directory', () => {
    beforeEach(() => {
      const copySpecs = [
        {
          from: '../test-copy-space/source/fixture.01.txt',
          to: '../test-copy-space/target/fixture.01.txt'
        }
      ];

      return vendorCopy(__dirname, copySpecs);
    });

    it('copies the file', async () => {
      const content = await readFile('../test-copy-space/target/fixture.01.txt');

      assert.equal(content, 'fixture 01');
    });
  });

  describe('multiple files into an existing directory', () => {
    beforeEach(() => {
      const copySpecs = [
        {
          from: '../test-copy-space/source/fixture.01.txt',
          to: '../test-copy-space/target/fixture.01.txt'
        },
        {
          from: '../test-copy-space/source/fixture.02.txt',
          to: '../test-copy-space/target/fixture.02.txt'
        }
      ];

      return vendorCopy(__dirname, copySpecs);
    });

    it('copies the files', async () => {
      const promises = [
        readFile('../test-copy-space/target/fixture.01.txt'),
        readFile('../test-copy-space/target/fixture.02.txt')
      ];

      const results = await Promise.all(promises);

      assert.deepEqual(results, ['fixture 01', 'fixture 02']);
    });
  });

  describe('files into non-existant directories', () => {
    beforeEach(() => {
      const copySpecs = [
        {
          from: '../test-copy-space/source/fixture.01.txt',
          to: '../test-copy-space/target/some/path/fixture.01.txt'
        }
      ];

      return vendorCopy(__dirname, copySpecs);
    });

    it('creates the path and copies the file', async () => {
      const content = await readFile('../test-copy-space/target/some/path/fixture.01.txt');

      assert.equal(content, 'fixture 01');
    });
  });

  describe('folders into non-existing directories', () => {
    beforeEach(() => {
      const copySpecs = [
        {
          from: '../test-copy-space/source',
          to: '../test-copy-space/target/some/path'
        }
      ];

      return vendorCopy(__dirname, copySpecs);
    });

    it('creates the path and copies the folder across', async () => {
      const promises = [
        readFile('../test-copy-space/target/some/path/fixture.01.txt'),
        readFile('../test-copy-space/target/some/path/fixture.02.txt')
      ];

      const results = await Promise.all(promises);

      assert.deepEqual(results, ['fixture 01', 'fixture 02']);
    });
  });

  describe('simlinks', () => {
    beforeEach(() => {
      const copySpecs = [
        {
          from: '../test-copy-space/source/fixture.03.txt',
          to: '../test-copy-space/target/fixture.03.txt'
        }
      ];

      return vendorCopy(__dirname, copySpecs);
    });

    it('resolves symlinks when copying', async () => {
      const content = await readFile('../test-copy-space/target/fixture.03.txt');

      assert.equal(content, 'fixture 01');
    });
  });
});
