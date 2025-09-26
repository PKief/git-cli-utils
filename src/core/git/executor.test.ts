import { describe, expect, it } from 'bun:test';
import { GitError, gitExecutor } from './executor';

describe('GitExecutor', () => {
  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const executor1 = gitExecutor;
      const executor2 = gitExecutor;
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

  describe('integration tests', () => {
    it('should execute simple git commands', async () => {
      // This is an integration test that runs actual git commands
      // It should work in any git repository
      const result = await gitExecutor.executeCommand('git --version');
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('git version');
    });

    it('should handle non-existent git commands', async () => {
      await expect(
        gitExecutor.executeCommand('git invalid-command-that-does-not-exist')
      ).rejects.toThrow(GitError);
    });

    it('should execute streaming commands', async () => {
      // Test with a command that should work in any git repo
      const result = await gitExecutor.executeStreamingCommand('git --help');
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should handle invalid streaming commands', async () => {
      await expect(
        gitExecutor.executeStreamingCommand('git invalid-streaming-command')
      ).rejects.toThrow(GitError);
    });
  });
});
