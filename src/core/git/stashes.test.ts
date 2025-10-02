import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { gitExecutor } from './executor';
import { filterStashes, getGitStashes } from './stashes';

// Store original function
const originalExecuteCommand = gitExecutor.executeCommand;

describe('Git Stashes', () => {
  beforeEach(() => {
    // Reset to default mock
    gitExecutor.executeCommand = async () => ({
      stdout: '',
      stderr: '',
      success: true,
    });
  });

  afterEach(() => {
    // Restore original function
    gitExecutor.executeCommand = originalExecuteCommand;
  });

  describe('getGitStashes', () => {
    test('should parse git stashes correctly', async () => {
      const mockStashOutput = `stash@{0}|WIP on feature/auth: abc1234 Add login functionality|abc1234567890|2 hours ago|WIP on feature/auth: abc1234 Add login functionality
stash@{1}|WIP on main: def5678 Fix bug in user service|def5678901234|1 day ago|WIP on main: def5678 Fix bug in user service
stash@{2}|On hotfix/critical: 123abcd Emergency fix for production|123abcd567890|3 days ago|On hotfix/critical: 123abcd Emergency fix for production`;

      gitExecutor.executeCommand = async () => ({
        stdout: mockStashOutput,
        stderr: '',
        success: true,
      });

      const result = await getGitStashes();

      expect(result).toEqual([
        {
          index: 0,
          branch: 'feature/auth',
          message: 'WIP on feature/auth: abc1234 Add login functionality',
          hash: 'abc1234',
          date: '2 hours ago',
        },
        {
          index: 1,
          branch: 'main',
          message: 'WIP on main: def5678 Fix bug in user service',
          hash: 'def5678',
          date: '1 day ago',
        },
        {
          index: 2,
          branch: 'hotfix/critical',
          message: 'On hotfix/critical: 123abcd Emergency fix for production',
          hash: '123abcd',
          date: '3 days ago',
        },
      ]);
    });

    test('should handle empty stash list', async () => {
      gitExecutor.executeCommand = async () => ({
        stdout: '',
        stderr: '',
        success: true,
      });

      const result = await getGitStashes();

      expect(result).toEqual([]);
    });

    test('should handle git command errors', async () => {
      gitExecutor.executeCommand = async () => {
        throw new Error('Git command failed');
      };

      await expect(getGitStashes()).rejects.toThrow(
        'Failed to get git stashes: Git command failed'
      );
    });

    test('should handle malformed stash output gracefully', async () => {
      const mockStashOutput = `stash@{0}|WIP on main|incomplete-line
stash@{1}|WIP on feature/test: abc1234 Test commit|abc1234567890|1 hour ago|Complete stash entry`;

      gitExecutor.executeCommand = async () => ({
        stdout: mockStashOutput,
        stderr: '',
        success: true,
      });

      const result = await getGitStashes();

      // Should only include the complete entry
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        index: 1,
        branch: 'feature/test',
        message: 'Complete stash entry',
        hash: 'abc1234',
        date: '1 hour ago',
      });
    });

    test('should handle branches with special characters', async () => {
      const mockStashOutput = `stash@{0}|WIP on feature/user-auth-2024: abc1234 Add OAuth support|abc1234567890|1 hour ago|WIP on feature/user-auth-2024: abc1234 Add OAuth support`;

      gitExecutor.executeCommand = async () => ({
        stdout: mockStashOutput,
        stderr: '',
        success: true,
      });

      const result = await getGitStashes();

      expect(result[0].branch).toBe('feature/user-auth-2024');
    });

    test('should handle stash without WIP prefix', async () => {
      const mockStashOutput = `stash@{0}|On main: abc1234 Manual stash message|abc1234567890|30 minutes ago|Custom stash message`;

      gitExecutor.executeCommand = async () => ({
        stdout: mockStashOutput,
        stderr: '',
        success: true,
      });

      const result = await getGitStashes();

      expect(result[0]).toEqual({
        index: 0,
        branch: 'main',
        message: 'Custom stash message',
        hash: 'abc1234',
        date: '30 minutes ago',
      });
    });
  });

  describe('filterStashes', () => {
    const mockStashes = [
      {
        index: 0,
        branch: 'feature/auth',
        message: 'WIP on feature/auth: Add login functionality',
        hash: 'abc1234',
        date: '2 hours ago',
      },
      {
        index: 1,
        branch: 'main',
        message: 'WIP on main: Fix user service bug',
        hash: 'def5678',
        date: '1 day ago',
      },
      {
        index: 2,
        branch: 'hotfix/critical',
        message: 'Emergency production fix',
        hash: '123abcd',
        date: '3 days ago',
      },
    ];

    test('should filter stashes by message', async () => {
      const result = filterStashes(mockStashes, 'login');

      expect(result).toHaveLength(1);
      expect(result[0].message).toContain('login');
    });

    test('should filter stashes by branch name', async () => {
      const result = filterStashes(mockStashes, 'auth');

      expect(result).toHaveLength(1);
      expect(result[0].branch).toBe('feature/auth');
    });

    test('should filter stashes by hash', async () => {
      const result = filterStashes(mockStashes, 'def5678');

      expect(result).toHaveLength(1);
      expect(result[0].hash).toBe('def5678');
    });

    test('should filter stashes by date', async () => {
      const result = filterStashes(mockStashes, 'day');

      expect(result).toHaveLength(2);
      expect(result.some((stash) => stash.date.includes('day'))).toBe(true);
    });

    test('should be case insensitive', async () => {
      const result = filterStashes(mockStashes, 'MAIN');

      expect(result).toHaveLength(1);
      expect(result[0].branch).toBe('main');
    });

    test('should return all stashes when search term is empty', async () => {
      const result = filterStashes(mockStashes, '');

      expect(result).toHaveLength(3);
      expect(result).toEqual(mockStashes);
    });

    test('should return empty array when no matches found', async () => {
      const result = filterStashes(mockStashes, 'nonexistent');

      expect(result).toHaveLength(0);
    });

    test('should handle partial matches', async () => {
      const result = filterStashes(mockStashes, 'fix');

      expect(result).toHaveLength(2);
      expect(
        result.some((stash) => stash.message.toLowerCase().includes('fix'))
      ).toBe(true);
    });
  });
});
