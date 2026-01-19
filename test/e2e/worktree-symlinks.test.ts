/**
 * Integration tests for worktree symlink functionality
 *
 * Focused on testing worktree creation and symlink behavior.
 * CLI command help tests are in commands.test.ts
 */

import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { existsSync } from 'fs';
import { join } from 'path';
import { createWorktreeSandbox, GitSandbox } from '../utils/sandbox.js';

describe('Worktree Symlinks', () => {
  let sandbox: GitSandbox;

  beforeEach(() => {
    sandbox = createWorktreeSandbox();
  });

  afterEach(() => {
    sandbox?.cleanup();
  });

  it('should create worktree without ignored files', () => {
    const worktreePath = sandbox.createWorktree('feature-a');

    expect(existsSync(worktreePath)).toBe(true);
    expect(existsSync(join(worktreePath, 'README.md'))).toBe(true);
    // Git worktrees don't include ignored files
    expect(existsSync(join(worktreePath, 'node_modules'))).toBe(false);
    expect(existsSync(join(worktreePath, '.env'))).toBe(false);
  });

  it('should list worktrees correctly', () => {
    sandbox.createWorktree('feature-a');
    sandbox.createWorktree('feature-b');

    const worktrees = sandbox.listWorktrees();
    expect(worktrees.length).toBe(3); // main + 2 worktrees
  });

  it('should detect ignored files in repository', () => {
    const result = sandbox.gitSafe([
      'ls-files',
      '--others',
      '--ignored',
      '--exclude-standard',
      '--directory',
    ]);

    expect(result.success).toBe(true);
    expect(result.stdout).toContain('node_modules');
    expect(result.stdout).toContain('.env');
  });

  it('should remove worktree cleanly', () => {
    const worktreePath = sandbox.createWorktree('feature-a');
    expect(sandbox.listWorktrees().length).toBe(2);

    sandbox.git(['worktree', 'remove', '--force', worktreePath]);
    expect(sandbox.listWorktrees().length).toBe(1);
  });

  it('should have symlinks config section', async () => {
    const result = await sandbox.runCLI(['config', 'symlinks', '--help']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.toLowerCase()).toContain('symlink');
  });
});
