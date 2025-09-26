import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Result interface for simple Git command execution
 */
export interface GitResult {
  stdout: string;
  stderr: string;
  success: boolean;
}

/**
 * Result interface for streaming Git command execution
 */
export interface GitStreamResult {
  data: string[];
  success: boolean;
  error?: string;
}

/**
 * Configuration options for Git command execution
 */
export interface GitExecutorOptions {
  timeout?: number;
  cwd?: string;
  maxBuffer?: number;
}

/**
 * Custom error class for Git operations
 */
export class GitError extends Error {
  constructor(
    message: string,
    public command: string,
    public stderr?: string,
    public exitCode?: number
  ) {
    super(message);
    this.name = 'GitError';
  }
}

/**
 * Centralized Git command executor with consistent error handling and execution methods
 */
export class GitExecutor {
  private static instance: GitExecutor;
  private defaultOptions: GitExecutorOptions;

  private constructor(options: GitExecutorOptions = {}) {
    this.defaultOptions = {
      timeout: 30000, // 30 seconds default timeout
      maxBuffer: 1024 * 1024 * 10, // 10MB default buffer
      ...options,
    };
  }

  /**
   * Get singleton instance of GitExecutor
   */
  static getInstance(options?: GitExecutorOptions): GitExecutor {
    if (!GitExecutor.instance) {
      GitExecutor.instance = new GitExecutor(options);
    }
    return GitExecutor.instance;
  }

  /**
   * Execute a simple Git command and return the result
   */
  async executeCommand(
    command: string,
    options: GitExecutorOptions = {}
  ): Promise<GitResult> {
    const mergedOptions = { ...this.defaultOptions, ...options };

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: mergedOptions.timeout,
        cwd: mergedOptions.cwd,
        maxBuffer: mergedOptions.maxBuffer,
      });

      return {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        success: true,
      };
    } catch (error) {
      interface ExecError extends Error {
        stderr?: string;
        code?: number;
      }

      const execError = error as ExecError;
      const stderr = execError.stderr || '';
      const message = execError.message || 'Git command failed';
      const exitCode = execError.code;

      throw new GitError(
        `Failed to execute git command: ${message}`,
        command,
        stderr,
        exitCode
      );
    }
  }

  /**
   * Execute a Git command with streaming support for large outputs
   */
  async executeStreamingCommand(
    command: string,
    options: GitExecutorOptions = {}
  ): Promise<GitStreamResult> {
    return new Promise((resolve, reject) => {
      const mergedOptions = { ...this.defaultOptions, ...options };
      const args = command.split(' ').slice(1); // Remove 'git' from command
      const git = spawn('git', args, {
        cwd: mergedOptions.cwd,
      });

      const data: string[] = [];
      let buffer = '';
      let errorOutput = '';

      // Set up timeout
      let timeoutId: NodeJS.Timeout | undefined;
      if (mergedOptions.timeout) {
        timeoutId = setTimeout(() => {
          git.kill('SIGTERM');
          reject(
            new GitError(
              'Git command timed out',
              command,
              `Command exceeded timeout of ${mergedOptions.timeout}ms`
            )
          );
        }, mergedOptions.timeout);
      }

      git.stdout.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line

        lines.forEach((line) => {
          if (line.trim()) {
            data.push(line.trim());
          }
        });
      });

      git.stderr.on('data', (chunk: Buffer) => {
        errorOutput += chunk.toString();
      });

      git.on('close', (code) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // Process any remaining buffer content
        if (buffer.trim()) {
          data.push(buffer.trim());
        }

        if (code === 0) {
          resolve({
            data,
            success: true,
          });
        } else {
          reject(
            new GitError(
              `Git command failed with exit code ${code}`,
              command,
              errorOutput,
              code ?? undefined
            )
          );
        }
      });

      git.on('error', (error) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        reject(
          new GitError(
            `Failed to execute git command: ${error.message}`,
            command,
            error.message
          )
        );
      });
    });
  }

  /**
   * Execute a Git command and parse the result with a custom parser function
   */
  async executeFormattedCommand<T>(
    command: string,
    parser: (output: string) => T,
    options: GitExecutorOptions = {}
  ): Promise<T> {
    const result = await this.executeCommand(command, options);

    if (!result.success) {
      throw new GitError('Git command failed', command, result.stderr);
    }

    try {
      return parser(result.stdout);
    } catch (error) {
      throw new GitError(
        `Failed to parse git command output: ${error instanceof Error ? error.message : String(error)}`,
        command,
        result.stderr
      );
    }
  }

  /**
   * Validate that a command starts with 'git'
   */
  private validateGitCommand(command: string): void {
    if (!command.trim().startsWith('git ')) {
      throw new GitError('Invalid command: must start with "git "', command);
    }
  }

  /**
   * Execute a Git command with automatic validation
   */
  async executeSafeCommand(
    command: string,
    options: GitExecutorOptions = {}
  ): Promise<GitResult> {
    this.validateGitCommand(command);
    return this.executeCommand(command, options);
  }

  /**
   * Execute a streaming Git command with automatic validation
   */
  async executeSafeStreamingCommand(
    command: string,
    options: GitExecutorOptions = {}
  ): Promise<GitStreamResult> {
    this.validateGitCommand(command);
    return this.executeStreamingCommand(command, options);
  }

  /**
   * Check if git is available in the system
   */
  async checkGitAvailability(): Promise<boolean> {
    try {
      await this.executeCommand('git --version');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current working directory for git operations
   */
  getCurrentWorkingDirectory(): string {
    return this.defaultOptions.cwd || process.cwd();
  }

  /**
   * Update default options
   */
  updateDefaultOptions(options: Partial<GitExecutorOptions>): void {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }
}

// Export a default instance for convenience
export const gitExecutor = GitExecutor.getInstance();
