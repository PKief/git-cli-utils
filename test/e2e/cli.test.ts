/**
 * Integration tests for basic CLI functionality
 */

import { afterEach, describe, expect, it } from 'bun:test';
import { createTestSandbox, GitSandbox } from '../utils/sandbox.js';

describe('CLI', () => {
  let sandbox: GitSandbox;

  afterEach(() => {
    sandbox?.cleanup();
  });

  it('--version should show version number', async () => {
    sandbox = createTestSandbox();
    const result = await sandbox.runCLI(['--version']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toMatch(/\d+\.\d+\.\d+/);
  });

  it('--help should show usage information', async () => {
    sandbox = createTestSandbox();
    const result = await sandbox.runCLI(['--help']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.toLowerCase()).toContain('usage');
  });

  it('invalid command should fail with error', async () => {
    sandbox = createTestSandbox();
    const result = await sandbox.runCLI(['invalid-command']);

    expect(result.exitCode).not.toBe(0);
  });

  it('should work outside a git repository for help', async () => {
    sandbox = createTestSandbox();
    const result = await sandbox.runCLI(['--help'], { cwd: sandbox.rootDir });

    expect(result.exitCode).toBe(0);
  });
});
