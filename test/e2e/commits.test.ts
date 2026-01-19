/**
 * Integration tests for commits command
 */

import { afterEach, describe, expect, it } from 'bun:test';
import { createTestSandbox, GitSandbox } from '../utils/sandbox.js';

describe('commits', () => {
  let sandbox: GitSandbox;

  afterEach(() => {
    sandbox?.cleanup();
  });

  it('should list commits in non-interactive mode', async () => {
    sandbox = createTestSandbox({ commitCount: 3 });
    const result = await sandbox.runCLI(['commits']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  it('should show commit messages', async () => {
    sandbox = createTestSandbox();
    sandbox.createCommit('Add feature X');

    const result = await sandbox.runCLI(['commits']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Add feature X');
  });

  it('should handle repository with single commit', async () => {
    sandbox = createTestSandbox();
    const result = await sandbox.runCLI(['commits']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Initial commit');
  });

  it('should show help with --help flag', async () => {
    sandbox = createTestSandbox();
    const result = await sandbox.runCLI(['commits', '--help']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.toLowerCase()).toContain('commit');
  });
});
