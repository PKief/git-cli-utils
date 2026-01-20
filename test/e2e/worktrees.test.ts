/**
 * Integration tests for worktrees command
 */

import { afterEach, describe, expect, it } from 'bun:test';
import { existsSync } from 'fs';
import { join } from 'path';
import { createTestSandbox, GitSandbox } from '../utils/sandbox.js';

describe('worktrees', () => {
  let sandbox: GitSandbox;

  afterEach(() => {
    sandbox?.cleanup();
  });

  it('should create worktree for a branch', () => {
    sandbox = createTestSandbox({ branches: ['feature-a'] });
    const worktreePath = sandbox.createWorktree('feature-a');

    expect(existsSync(worktreePath)).toBe(true);
    expect(existsSync(join(worktreePath, 'README.md'))).toBe(true);
  });

  it('should list worktrees correctly', () => {
    sandbox = createTestSandbox({ branches: ['feature-a', 'feature-b'] });
    sandbox.createWorktree('feature-a');
    sandbox.createWorktree('feature-b');

    const worktrees = sandbox.listWorktrees();
    expect(worktrees.length).toBe(3); // main + 2 worktrees
  });

  it('should remove worktree cleanly', () => {
    sandbox = createTestSandbox({ branches: ['feature-a'] });
    const worktreePath = sandbox.createWorktree('feature-a');
    expect(sandbox.listWorktrees().length).toBe(2);

    sandbox.git(['worktree', 'remove', '--force', worktreePath]);
    expect(sandbox.listWorktrees().length).toBe(1);
  });

  it('should show help with --help flag', async () => {
    sandbox = createTestSandbox();
    const result = await sandbox.runCLI(['worktrees', '--help']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.toLowerCase()).toContain('worktree');
  });
});
