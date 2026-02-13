/**
 * Integration tests for stashes command
 */

import { afterEach, describe, expect, it } from 'bun:test';
import { createTestSandbox, GitSandbox } from '../utils/sandbox.js';

describe('stashes', () => {
  let sandbox: GitSandbox;

  afterEach(() => {
    sandbox?.cleanup();
  });

  it('should handle repository with no stashes', async () => {
    sandbox = createTestSandbox();
    const result = await sandbox.runCLI(['stashes']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('No stashes');
  });

  it('should list stashes when they exist', async () => {
    sandbox = createTestSandbox();
    sandbox.writeFile('temp.txt', 'changes');
    sandbox.git(['add', 'temp.txt']);
    sandbox.git(['stash', 'push', '-m', 'test stash']);

    const result = await sandbox.runCLI(['stashes']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('test stash');
  });

  it('should list multiple stashes', async () => {
    sandbox = createTestSandbox();

    sandbox.writeFile('file1.txt', 'content1');
    sandbox.git(['add', 'file1.txt']);
    sandbox.git(['stash', 'push', '-m', 'first stash']);

    sandbox.writeFile('file2.txt', 'content2');
    sandbox.git(['add', 'file2.txt']);
    sandbox.git(['stash', 'push', '-m', 'second stash']);

    const result = await sandbox.runCLI(['stashes']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('first stash');
    expect(result.stdout).toContain('second stash');
  });

  it('should show --new option in help', async () => {
    sandbox = createTestSandbox();
    const result = await sandbox.runCLI(['stashes', '--help']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('--new');
    expect(result.stdout.toLowerCase()).toContain('stash');
  });
});
