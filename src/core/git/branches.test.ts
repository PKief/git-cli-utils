import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { filterBranches, type GitBranch, getGitBranches } from './branches';

// Mock the GitExecutor
const mockExecuteCommand = mock();

mock.module('./executor.js', () => ({
  gitExecutor: {
    executeCommand: mockExecuteCommand,
  },
}));

beforeEach(() => {
  mockExecuteCommand.mockClear();
});

afterEach(() => {
  mockExecuteCommand.mockReset();
});

describe('Git Branches', () => {
  describe('getGitBranches', () => {
    it('should parse git branches correctly', async () => {
      // Arrange
      const mockStdout =
        'main|2 hours ago\nfeature/test|1 day ago\ndevelop|3 days ago\n';
      mockExecuteCommand.mockResolvedValue({
        stdout: mockStdout,
        stderr: '',
      });

      // Act
      const branches = await getGitBranches();

      // Assert
      expect(mockExecuteCommand).toHaveBeenCalledWith(
        'git branch --sort=-committerdate --format="%(refname:short)|%(committerdate:relative)" --list'
      );
      expect(branches).toHaveLength(3);
      expect(branches[0]).toEqual({ name: 'main', date: '2 hours ago' });
      expect(branches[1]).toEqual({ name: 'feature/test', date: '1 day ago' });
      expect(branches[2]).toEqual({ name: 'develop', date: '3 days ago' });
    });

    it('should handle empty git branch output', async () => {
      // Arrange
      mockExecuteCommand.mockResolvedValue({
        stdout: '',
        stderr: '',
      });

      // Act
      const branches = await getGitBranches();

      // Assert
      expect(branches).toHaveLength(0);
    });

    it('should filter out empty lines', async () => {
      // Arrange
      const mockStdout = 'main|2 hours ago\n\n\nfeature/test|1 day ago\n\n';
      mockExecuteCommand.mockResolvedValue({
        stdout: mockStdout,
        stderr: '',
      });

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
      mockExecuteCommand.mockRejectedValue(mockError);

      // Act & Assert
      await expect(getGitBranches()).rejects.toThrow('Not a git repository');
    });

    it('should handle branches with special characters', async () => {
      // Arrange
      const mockStdout =
        'feature/user-123|1 hour ago\nbugfix/fix-login-issue|yesterday\n';
      mockExecuteCommand.mockResolvedValue({
        stdout: mockStdout,
        stderr: '',
      });

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

    it('should handle malformed branch output gracefully', async () => {
      // Arrange
      const mockStdout = 'main\nfeature/test|1 day ago\nbugfix|today|\n';
      mockExecuteCommand.mockResolvedValue({
        stdout: mockStdout,
        stderr: '',
      });

      // Act
      const branches = await getGitBranches();

      // Assert
      expect(branches).toHaveLength(3);
      expect(branches[0]).toEqual({ name: 'main', date: undefined });
      expect(branches[1]).toEqual({ name: 'feature/test', date: '1 day ago' });
      expect(branches[2]).toEqual({ name: 'bugfix', date: 'today' });
    });
  });

  describe('filterBranches', () => {
    const mockBranches: GitBranch[] = [
      { name: 'main', date: '2 hours ago' },
      { name: 'feature/authentication', date: '1 day ago' },
      { name: 'feature/user-profile', date: '2 days ago' },
      { name: 'bugfix/login-issue', date: '3 days ago' },
      { name: 'develop', date: '1 week ago' },
    ];

    it('should filter branches by name (case insensitive)', () => {
      // Act
      const result = filterBranches(mockBranches, 'feature');

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('feature/authentication');
      expect(result[1].name).toBe('feature/user-profile');
    });

    it('should handle case insensitive search', () => {
      // Act
      const result = filterBranches(mockBranches, 'MAIN');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('main');
    });

    it('should return all branches when search term is empty', () => {
      // Act
      const result = filterBranches(mockBranches, '');

      // Assert
      expect(result).toHaveLength(5);
      expect(result).toEqual(mockBranches);
    });

    it('should return empty array when no matches found', () => {
      // Act
      const result = filterBranches(mockBranches, 'nonexistent');

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should filter by partial name matches', () => {
      // Act
      const result = filterBranches(mockBranches, 'auth');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('feature/authentication');
    });

    it('should handle special characters in search', () => {
      // Act
      const result = filterBranches(mockBranches, 'user-profile');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('feature/user-profile');
    });
  });
});
