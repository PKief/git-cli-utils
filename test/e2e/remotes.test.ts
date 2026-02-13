/**
 * Integration tests for remotes command
 */

import { afterEach, describe, expect, it } from 'bun:test';
import { createTestSandbox, GitSandbox } from '../utils/sandbox.js';

describe('remotes', () => {
  let sandbox: GitSandbox;

  afterEach(() => {
    sandbox?.cleanup();
  });

  it('should handle repository with no remotes', async () => {
    sandbox = createTestSandbox();
    const result = await sandbox.runCLI(['remotes']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('No remotes');
  });

  it('should list remotes when configured', async () => {
    sandbox = createTestSandbox();
    sandbox.git([
      'remote',
      'add',
      'origin',
      'https://github.com/test/repo.git',
    ]);

    const result = await sandbox.runCLI(['remotes']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('origin');
  });

  it('should list multiple remotes', async () => {
    sandbox = createTestSandbox();
    sandbox.git([
      'remote',
      'add',
      'origin',
      'https://github.com/test/repo.git',
    ]);
    sandbox.git([
      'remote',
      'add',
      'upstream',
      'https://github.com/upstream/repo.git',
    ]);

    const result = await sandbox.runCLI(['remotes']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('origin');
    expect(result.stdout).toContain('upstream');
  });

  it('should show help with --help flag', async () => {
    sandbox = createTestSandbox();
    const result = await sandbox.runCLI(['remotes', '--help']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.toLowerCase()).toContain('remote');
  });

  it('should show --add option in help', async () => {
    sandbox = createTestSandbox();
    const result = await sandbox.runCLI(['remotes', '--help']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('--add');
    expect(result.stdout.toLowerCase()).toContain('add');
  });
});
