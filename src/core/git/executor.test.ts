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
});
