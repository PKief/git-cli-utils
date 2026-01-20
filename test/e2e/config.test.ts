/**
 * Integration tests for config command
 */

import { afterEach, describe, expect, it } from 'bun:test';
import { createTestSandbox, GitSandbox } from '../utils/sandbox.js';

describe('config', () => {
  let sandbox: GitSandbox;

  afterEach(() => {
    sandbox?.cleanup();
  });

  it('should show editor config', async () => {
    sandbox = createTestSandbox();
    const result = await sandbox.runCLI(['config', 'editor', 'show']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.toLowerCase()).toContain('editor');
  });

  it('should show help with --help flag', async () => {
    sandbox = createTestSandbox();
    const result = await sandbox.runCLI(['config', '--help']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.toLowerCase()).toContain('config');
  });

  it('should show editor subcommand help', async () => {
    sandbox = createTestSandbox();
    const result = await sandbox.runCLI(['config', 'editor', '--help']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.toLowerCase()).toContain('editor');
  });
});
