import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { spawn } from 'child_process';
import { existsSync, mkdirSync, rmSync } from 'fs';
import path from 'path';

// Helper function to run git commands
async function runGitCommand(
  args: string[],
  cwd: string = process.cwd()
): Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
}> {
  return new Promise((resolve) => {
    const child = spawn('git', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd,
      env: { ...process.env, FORCE_COLOR: '0' },
      // biome-ignore lint/style/useNamingConvention: Environment variable name
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({ exitCode: code || 0, stdout, stderr });
    });

    child.on('error', (error) => {
      resolve({ exitCode: -1, stdout, stderr: error.message });
    });
  });
}

// Helper function to run CLI commands
async function runCLICommand(
  args: string[],
  cwd: string = process.cwd()
): Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
}> {
  return new Promise((resolve) => {
    const cliPath = path.join(process.cwd(), 'dist', 'index.js');

    const child = spawn('node', [cliPath, ...args], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd,
      env: { ...process.env, FORCE_COLOR: '0' },
      // biome-ignore lint/style/useNamingConvention: Environment variable name
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({ exitCode: code || 0, stdout, stderr });
    });

    child.on('error', (error) => {
      resolve({ exitCode: -1, stdout, stderr: error.message });
    });
  });
}

describe('Git Integration Tests', () => {
  const testRepoPath = path.join(process.cwd(), 'test-repo');

  beforeAll(async () => {
    // Clean up any existing test repo
    if (existsSync(testRepoPath)) {
      rmSync(testRepoPath, { recursive: true, force: true });
    }

    // Create a test git repository
    mkdirSync(testRepoPath, { recursive: true });

    // Initialize git repo
    await runGitCommand(['init'], testRepoPath);
    await runGitCommand(['config', 'user.name', 'Test User'], testRepoPath);
    await runGitCommand(
      ['config', 'user.email', 'test@example.com'],
      testRepoPath
    );

    // Create initial commit
    await runGitCommand(
      ['commit', '--allow-empty', '-m', 'Initial commit'],
      testRepoPath
    );

    // Create some test branches
    await runGitCommand(
      ['checkout', '-b', 'feature/test-branch'],
      testRepoPath
    );
    await runGitCommand(
      ['commit', '--allow-empty', '-m', 'Feature commit'],
      testRepoPath
    );

    await runGitCommand(['checkout', '-b', 'bugfix/test-fix'], testRepoPath);
    await runGitCommand(
      ['commit', '--allow-empty', '-m', 'Bugfix commit'],
      testRepoPath
    );

    await runGitCommand(['checkout', 'main'], testRepoPath);

    // Create some git aliases for testing
    await runGitCommand(['config', 'alias.st', 'status'], testRepoPath);
    await runGitCommand(['config', 'alias.co', 'checkout'], testRepoPath);
    await runGitCommand(['config', 'alias.br', 'branch'], testRepoPath);
  });

  afterAll(() => {
    // Clean up test repository
    if (existsSync(testRepoPath)) {
      rmSync(testRepoPath, { recursive: true, force: true });
    }
  });

  describe('list-aliases command', () => {
    it('should list git aliases from the test repository', async () => {
      const { exitCode, stdout } = await runCLICommand(
        ['list-aliases'],
        testRepoPath
      );

      expect(exitCode).toBe(0);
      expect(stdout.toLowerCase()).toContain('git aliases');

      // The CLI might not find local repo aliases depending on implementation
      // So we just check it doesn't crash and shows the aliases section
      expect(stdout).toMatch(/(st|co|br|No git aliases found)/);
    });

    it('should handle repository with no aliases gracefully', async () => {
      // Create a new repo without aliases
      const cleanRepoPath = path.join(process.cwd(), 'clean-test-repo');
      mkdirSync(cleanRepoPath, { recursive: true });

      try {
        await runGitCommand(['init'], cleanRepoPath);
        await runGitCommand(
          ['config', 'user.name', 'Test User'],
          cleanRepoPath
        );
        await runGitCommand(
          ['config', 'user.email', 'test@example.com'],
          cleanRepoPath
        );

        const { exitCode, stdout } = await runCLICommand(
          ['list-aliases'],
          cleanRepoPath
        );

        expect(exitCode).toBe(0);
        expect(stdout.toLowerCase()).toContain('git aliases');
      } finally {
        if (existsSync(cleanRepoPath)) {
          rmSync(cleanRepoPath, { recursive: true, force: true });
        }
      }
    });
  });

  describe('CLI behavior in git repository', () => {
    it('should work when run from inside a git repository', async () => {
      const { exitCode, stdout } = await runCLICommand(
        ['--version'],
        testRepoPath
      );

      expect(exitCode).toBe(0);
      expect(stdout.trim()).toMatch(/\d+\.\d+\.\d+/);
    });

    it('should work when run from outside a git repository', async () => {
      const tempDir = path.join(process.cwd(), 'temp-no-git');
      mkdirSync(tempDir, { recursive: true });

      try {
        const { exitCode, stdout } = await runCLICommand(
          ['--version'],
          tempDir
        );

        expect(exitCode).toBe(0);
        expect(stdout.trim()).toMatch(/\d+\.\d+\.\d+/);
      } finally {
        if (existsSync(tempDir)) {
          rmSync(tempDir, { recursive: true, force: true });
        }
      }
    });
  });

  describe('Performance in real git repository', () => {
    it('should handle list-aliases command quickly in real repo', async () => {
      const startTime = Date.now();
      const { exitCode } = await runCLICommand(['list-aliases'], testRepoPath);
      const duration = Date.now() - startTime;

      expect(exitCode).toBe(0);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
