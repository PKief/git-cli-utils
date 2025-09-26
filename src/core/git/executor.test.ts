import { describe, expect, it } from 'bun:test';
import { GitError, GitExecutor } from './executor';

describe('GitExecutor', () => {
  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const executor1 = GitExecutor.getInstance();
      const executor2 = GitExecutor.getInstance();
      expect(executor1).toBe(executor2);
    });
  });

  describe('GitError', () => {
    it('should create GitError with all parameters', () => {
      const error = new GitError(
        'Test error',
        'git status',
        'stderr output',
        128
      );
      expect(error.message).toBe('Test error');
      expect(error.command).toBe('git status');
      expect(error.stderr).toBe('stderr output');
      expect(error.exitCode).toBe(128);
      expect(error.name).toBe('GitError');
    });

    it('should create GitError with minimal parameters', () => {
      const error = new GitError('Test error', 'git status');
      expect(error.message).toBe('Test error');
      expect(error.command).toBe('git status');
      expect(error.stderr).toBeUndefined();
      expect(error.exitCode).toBeUndefined();
      expect(error.name).toBe('GitError');
    });

    it('should be instance of Error', () => {
      const error = new GitError('Test error', 'git status');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(GitError);
    });
  });

  describe('utility methods', () => {
    const executor = GitExecutor.getInstance();

    it('should get current working directory', () => {
      const cwd = executor.getCurrentWorkingDirectory();
      expect(typeof cwd).toBe('string');
      expect(cwd.length).toBeGreaterThan(0);
    });

    it('should update default options', () => {
      const executor = GitExecutor.getInstance();

      // Test that we can call the method without errors
      expect(() => {
        executor.updateDefaultOptions({ timeout: 5000 });
      }).not.toThrow();
    });

    it('should validate git commands correctly', async () => {
      const executor = GitExecutor.getInstance();

      // Test safe command validation - should throw for invalid git commands
      await expect(
        executor.executeSafeCommand('not-git-command')
      ).rejects.toThrow(GitError);
    });
  });

  describe('executeFormattedCommand', () => {
    it('should handle parser errors gracefully', async () => {
      const executor = GitExecutor.getInstance();

      // Test with a parser that throws an error
      // We use a command that might fail in CI, but we handle both cases
      await expect(
        executor.executeFormattedCommand('git --version', () => {
          throw new Error('Parser error');
        })
      ).rejects.toThrow(GitError);
    });
  });

  describe('checkGitAvailability', () => {
    it('should check if git is available', async () => {
      const executor = GitExecutor.getInstance();
      const isAvailable = await executor.checkGitAvailability();

      // The result should be a boolean
      expect(typeof isAvailable).toBe('boolean');

      // In most environments, git should be available
      // but we don't make this assumption in CI - we just test the return type
    });
  });

  describe('command validation', () => {
    const executor = GitExecutor.getInstance();

    it('should validate safe commands', async () => {
      // Test that non-git commands are rejected
      await expect(executor.executeSafeCommand('ls -la')).rejects.toThrow(
        GitError
      );

      await expect(executor.executeSafeCommand('pwd')).rejects.toThrow(
        GitError
      );
    });

    it('should validate safe streaming commands', async () => {
      // Test that non-git commands are rejected for streaming
      await expect(
        executor.executeSafeStreamingCommand('ls -la')
      ).rejects.toThrow(GitError);

      await expect(executor.executeSafeStreamingCommand('pwd')).rejects.toThrow(
        GitError
      );
    });
  });

  describe('configuration', () => {
    it('should allow updating default options', () => {
      const executor = GitExecutor.getInstance();

      // Should not throw when updating options
      expect(() => {
        executor.updateDefaultOptions({
          timeout: 10000,
          maxBuffer: 5000,
        });
      }).not.toThrow();
    });

    it('should return current working directory', () => {
      const executor = GitExecutor.getInstance();
      const cwd = executor.getCurrentWorkingDirectory();

      expect(typeof cwd).toBe('string');
      expect(cwd.length).toBeGreaterThan(0);
    });
  });
});
