/**
 * Integration tests for CLI commands
 *
 * Following the test pyramid: one simple test per command.
 * Detailed behavior is tested in unit tests.
 */

import { afterEach, describe, expect, it } from 'bun:test';
import { createTestSandbox, GitSandbox } from '../utils/sandbox.js';

describe('CLI Commands', () => {
  let sandbox: GitSandbox;

  afterEach(() => {
    sandbox?.cleanup();
  });

  describe('Basic CLI', () => {
    it('--help should show usage', async () => {
      sandbox = createTestSandbox();
      const result = await sandbox.runCLI(['--help']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout.toLowerCase()).toContain('usage');
    });

    it('--version should show version number', async () => {
      sandbox = createTestSandbox();
      const result = await sandbox.runCLI(['--version']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toMatch(/\d+\.\d+\.\d+/);
    });

    it('invalid command should fail', async () => {
      sandbox = createTestSandbox();
      const result = await sandbox.runCLI(['invalid-command']);

      expect(result.exitCode).not.toBe(0);
    });
  });
});
