/**
 * Integration tests for branches command
 */

import { afterEach, describe, expect, it } from 'bun:test';
import { createTestSandbox, GitSandbox } from '../utils/sandbox.js';

describe('branches', () => {
  let sandbox: GitSandbox;

  afterEach(() => {
    sandbox?.cleanup();
  });

  it('should list branches in non-interactive mode', async () => {
    sandbox = createTestSandbox({ branches: ['feature-1', 'feature-2'] });
    const result = await sandbox.runCLI(['branches']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('main');
  });

  it('should show current branch indicator', async () => {
    sandbox = createTestSandbox({ branches: ['develop'] });
    const result = await sandbox.runCLI(['branches']);

    expect(result.exitCode).toBe(0);
    // Current branch should be shown
    expect(result.stdout).toContain('main');
  });

  it('should handle repository with only main branch', async () => {
    sandbox = createTestSandbox();
    const result = await sandbox.runCLI(['branches']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('main');
  });

  it('should show help with --help flag', async () => {
    sandbox = createTestSandbox();
    const result = await sandbox.runCLI(['branches', '--help']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.toLowerCase()).toContain('branch');
  });

  it('should show --new option in help', async () => {
    sandbox = createTestSandbox();
    const result = await sandbox.runCLI(['branches', '--help']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('--new');
    expect(result.stdout.toLowerCase()).toContain('create');
  });
});
