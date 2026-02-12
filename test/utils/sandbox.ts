/**
 * Git Sandbox - Creates isolated git environments for integration testing
 *
 * This utility creates temporary git repositories with configurable:
 * - Branches
 * - Commits
 * - Worktrees
 *
 * Each sandbox is completely isolated and cleaned up after tests.
 */

import { spawn, spawnSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

export interface SandboxOptions {
  /** Name prefix for the sandbox directory */
  name?: string;
  /** Initialize with a git repository */
  initGit?: boolean;
  /** Create initial commit */
  initialCommit?: boolean;
  /** Branches to create (will be created from main) */
  branches?: string[];
  /** Number of commits to create on main branch */
  commitCount?: number;
}

export interface CLIResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export class GitSandbox {
  public readonly rootDir: string;
  public readonly repoDir: string;
  private worktreePaths: string[] = [];

  constructor(options: SandboxOptions = {}) {
    const uniqueId =
      Date.now().toString(36) + Math.random().toString(36).slice(2);
    const name = options.name ?? 'git-sandbox';
    this.rootDir = join(tmpdir(), `${name}-${uniqueId}`);
    this.repoDir = join(this.rootDir, 'repo');

    this.setup(options);
  }

  private setup(options: SandboxOptions): void {
    // Create root and repo directories
    mkdirSync(this.repoDir, { recursive: true });

    if (options.initGit !== false) {
      this.initGitRepo();
    }

    if (options.initialCommit !== false && options.initGit !== false) {
      this.createInitialCommit();
    }

    // Create additional commits
    if (options.commitCount && options.commitCount > 1) {
      for (let i = 2; i <= options.commitCount; i++) {
        this.createCommit(`Commit ${i}`, `file${i}.txt`, `Content ${i}`);
      }
    }

    // Create branches
    if (options.branches) {
      for (const branch of options.branches) {
        this.createBranch(branch);
      }
      // Return to main branch
      this.git(['checkout', 'main']);
    }
  }

  private initGitRepo(): void {
    this.git(['init', '-b', 'main']);
    this.git(['config', 'user.email', 'test@example.com']);
    this.git(['config', 'user.name', 'Test User']);
    // Disable editor for tests to prevent interactive prompts
    this.git(['config', 'core.editor', 'true']);
    // Disable GPG signing for tests
    this.git(['config', 'commit.gpgsign', 'false']);
    this.git(['config', 'tag.gpgsign', 'false']);
  }

  private createInitialCommit(): void {
    this.writeFile('README.md', '# Test Repository\n');
    this.git(['add', 'README.md']);
    this.git(['commit', '-m', 'Initial commit']);
  }

  /**
   * Execute a git command in the sandbox repository
   */
  public git(args: string[]): string {
    const result = spawnSync('git', args, {
      cwd: this.repoDir,
      encoding: 'utf-8',
      timeout: 30000,
    });

    if (result.error) {
      throw new Error(`Git command failed: ${result.error.message}`);
    }

    if (result.status !== 0) {
      throw new Error(
        `Git command failed with code ${result.status}: ${result.stderr}`
      );
    }

    return result.stdout.trim();
  }

  /**
   * Execute a git command and return result without throwing
   */
  public gitSafe(args: string[]): {
    success: boolean;
    stdout: string;
    stderr: string;
  } {
    const result = spawnSync('git', args, {
      cwd: this.repoDir,
      encoding: 'utf-8',
      timeout: 30000,
    });

    return {
      success: result.status === 0,
      stdout: result.stdout?.trim() ?? '',
      stderr: result.stderr?.trim() ?? '',
    };
  }

  /**
   * Write a file to the repository
   */
  public writeFile(relativePath: string, content: string): void {
    const fullPath = join(this.repoDir, relativePath);
    const dir = join(fullPath, '..');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(fullPath, content);
  }

  /**
   * Create a new branch
   */
  public createBranch(name: string): void {
    this.git(['branch', name]);
  }

  /**
   * Checkout a branch
   */
  public checkout(branch: string): void {
    this.git(['checkout', branch]);
  }

  /**
   * Create a commit with a new file
   */
  public createCommit(
    message: string,
    filename?: string,
    content?: string
  ): void {
    const file = filename ?? `file-${Date.now()}.txt`;
    const fileContent =
      content ?? `Content created at ${new Date().toISOString()}`;

    this.writeFile(file, fileContent);
    this.git(['add', file]);
    this.git(['commit', '-m', message]);
  }

  /**
   * Create a worktree for a branch
   */
  public createWorktree(branch: string, path?: string): string {
    const worktreePath = path ?? join(this.rootDir, `worktree-${branch}`);
    this.git(['worktree', 'add', worktreePath, branch]);
    this.worktreePaths.push(worktreePath);
    return worktreePath;
  }

  /**
   * List all worktrees
   */
  public listWorktrees(): string[] {
    const output = this.git(['worktree', 'list', '--porcelain']);
    const worktrees: string[] = [];

    for (const line of output.split('\n')) {
      if (line.startsWith('worktree ')) {
        worktrees.push(line.substring('worktree '.length));
      }
    }

    return worktrees;
  }

  /**
   * Run the CLI tool in the sandbox environment
   */
  public async runCLI(
    args: string[],
    options: { timeout?: number; cwd?: string; input?: string } = {}
  ): Promise<CLIResult> {
    const timeout = options.timeout ?? 10000;
    const cwd = options.cwd ?? this.repoDir;
    const indexPath = join(process.cwd(), 'src', 'index.ts');

    return new Promise((resolve) => {
      const child = spawn('bun', ['run', indexPath, ...args], {
        cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          // biome-ignore lint/style/useNamingConvention: Standard env var
          FORCE_COLOR: '0',
          // biome-ignore lint/style/useNamingConvention: Standard env var
          CI: '1', // Simulate CI environment for non-interactive mode
        },
      });

      let stdout = '';
      let stderr = '';

      const timeoutId = setTimeout(() => {
        child.kill('SIGTERM');
        resolve({ exitCode: -1, stdout, stderr: stderr + '\nTIMEOUT' });
      }, timeout);

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      // Send input if provided
      if (options.input) {
        child.stdin?.write(options.input);
        child.stdin?.end();
      } else {
        child.stdin?.end();
      }

      child.on('close', (code) => {
        clearTimeout(timeoutId);
        resolve({ exitCode: code ?? 0, stdout, stderr });
      });

      child.on('error', (error) => {
        clearTimeout(timeoutId);
        resolve({ exitCode: -1, stdout, stderr: error.message });
      });
    });
  }

  /**
   * Get the path to a file in the repository
   */
  public path(relativePath: string): string {
    return join(this.repoDir, relativePath);
  }

  /**
   * Check if a file exists in the repository
   */
  public exists(relativePath: string): boolean {
    return existsSync(this.path(relativePath));
  }

  /**
   * List files in a directory
   */
  public listDir(relativePath: string = ''): string[] {
    const fullPath = join(this.repoDir, relativePath);
    if (!existsSync(fullPath)) {
      return [];
    }
    return readdirSync(fullPath);
  }

  /**
   * Get current branch name
   */
  public getCurrentBranch(): string {
    return this.git(['rev-parse', '--abbrev-ref', 'HEAD']);
  }

  /**
   * Get list of branches
   */
  public getBranches(): string[] {
    const output = this.git(['branch', '--format=%(refname:short)']);
    return output.split('\n').filter((b) => b.trim().length > 0);
  }

  /**
   * Get commit log
   */
  public getCommits(count: number = 10): string[] {
    const output = this.git(['log', `--max-count=${count}`, '--format=%s']);
    return output.split('\n').filter((c) => c.trim().length > 0);
  }

  /**
   * Clean up the sandbox
   */
  public cleanup(): void {
    // Remove worktrees first (git requires this)
    for (const worktreePath of this.worktreePaths) {
      if (existsSync(worktreePath)) {
        try {
          this.gitSafe(['worktree', 'remove', '--force', worktreePath]);
        } catch {
          // Ignore errors during cleanup
        }
      }
    }

    // Remove the root directory
    if (existsSync(this.rootDir)) {
      rmSync(this.rootDir, { recursive: true, force: true });
    }
  }
}

/**
 * Create a sandbox with common defaults for testing
 */
export function createTestSandbox(options: SandboxOptions = {}): GitSandbox {
  return new GitSandbox({
    name: 'test',
    initGit: true,
    initialCommit: true,
    ...options,
  });
}
