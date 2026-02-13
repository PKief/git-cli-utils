/**
 * Integration tests for tags command
 */

import { afterEach, describe, expect, it } from 'bun:test';
import { createTestSandbox, GitSandbox } from '../utils/sandbox.js';

describe('tags', () => {
  let sandbox: GitSandbox;

  afterEach(() => {
    sandbox?.cleanup();
  });

  it('should handle repository with no tags', async () => {
    sandbox = createTestSandbox();
    const result = await sandbox.runCLI(['tags']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('No tags');
  });

  it('should list tags when they exist', async () => {
    sandbox = createTestSandbox();
    sandbox.git(['tag', 'v1.0.0']);
    sandbox.git(['tag', 'v1.1.0']);

    const result = await sandbox.runCLI(['tags']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('v1.0.0');
  });

  it('should list annotated tags', async () => {
    sandbox = createTestSandbox();
    sandbox.git(['tag', '-a', 'v2.0.0', '-m', 'Release version 2']);

    const result = await sandbox.runCLI(['tags']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('v2.0.0');
  });

  it('should show help with --help flag', async () => {
    sandbox = createTestSandbox();
    const result = await sandbox.runCLI(['tags', '--help']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.toLowerCase()).toContain('tag');
  });

  it('should show --new option in help', async () => {
    sandbox = createTestSandbox();
    const result = await sandbox.runCLI(['tags', '--help']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('--new');
    expect(result.stdout.toLowerCase()).toContain('create');
  });
});
