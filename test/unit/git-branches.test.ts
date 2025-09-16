import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test';
import * as cp from 'child_process';
import { getGitBranches } from '../../src/core/git/branches';

// Mock child_process exec
let mockExec: ReturnType<typeof spyOn>;

beforeEach(() => {
  // Reset mocks before each test
  mockExec = spyOn(cp, 'exec');
});

afterEach(() => {
  // Restore mocks after each test
  mockExec.mockRestore();
});

describe('Git Branches', () => {
  describe('getGitBranches', () => {
    it('should parse git branches correctly', async () => {
      // Arrange
      const mockStdout =
        'main|2 hours ago\nfeature/test|1 day ago\ndevelop|3 days ago\n';
      mockExec.mockImplementation(
        (
          command: string,
          callback: (error: Error | null, stdout: string) => void
        ) => {
          expect(command).toBe(
            'git branch --sort=-committerdate --format="%(refname:short)|%(committerdate:relative)" --list'
          );
          callback(null, mockStdout);
        }
      );

      // Act
      const branches = await getGitBranches();

      // Assert
      expect(branches).toHaveLength(3);
      expect(branches[0]).toEqual({ name: 'main', date: '2 hours ago' });
      expect(branches[1]).toEqual({ name: 'feature/test', date: '1 day ago' });
      expect(branches[2]).toEqual({ name: 'develop', date: '3 days ago' });
    });

    it('should handle empty git branch output', async () => {
      // Arrange
      const mockStdout = '';
      mockExec.mockImplementation(
        (
          command: string,
          callback: (error: Error | null, stdout: string) => void
        ) => {
          callback(null, mockStdout);
        }
      );

      // Act
      const branches = await getGitBranches();

      // Assert
      expect(branches).toHaveLength(0);
    });

    it('should filter out empty lines', async () => {
      // Arrange
      const mockStdout = 'main|2 hours ago\n\n\nfeature/test|1 day ago\n\n';
      mockExec.mockImplementation(
        (
          command: string,
          callback: (error: Error | null, stdout: string) => void
        ) => {
          callback(null, mockStdout);
        }
      );

      // Act
      const branches = await getGitBranches();

      // Assert
      expect(branches).toHaveLength(2);
      expect(branches[0]).toEqual({ name: 'main', date: '2 hours ago' });
      expect(branches[1]).toEqual({ name: 'feature/test', date: '1 day ago' });
    });

    it('should reject on git command error', async () => {
      // Arrange
      const mockError = new Error('Not a git repository');
      mockExec.mockImplementation(
        (
          command: string,
          callback: (error: Error | null, stdout: string) => void
        ) => {
          callback(mockError, '');
        }
      );

      // Act & Assert
      await expect(getGitBranches()).rejects.toThrow(
        'Error executing git command: Not a git repository'
      );
    });

    it('should handle branches with special characters', async () => {
      // Arrange
      const mockStdout =
        'feature/user-123|1 hour ago\nbugfix/fix-login-issue|yesterday\n';
      mockExec.mockImplementation(
        (
          command: string,
          callback: (error: Error | null, stdout: string) => void
        ) => {
          callback(null, mockStdout);
        }
      );

      // Act
      const branches = await getGitBranches();

      // Assert
      expect(branches).toHaveLength(2);
      expect(branches[0]).toEqual({
        name: 'feature/user-123',
        date: '1 hour ago',
      });
      expect(branches[1]).toEqual({
        name: 'bugfix/fix-login-issue',
        date: 'yesterday',
      });
    });
  });
});
