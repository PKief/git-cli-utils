import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { filterBranches, type GitBranch, getGitBranches } from './branches';

// Mock the GitExecutor
const mockExecuteCommand = mock();
const mockExecuteStreamingCommand = mock();

mock.module('./executor.js', () => ({
  gitExecutor: {
    executeCommand: mockExecuteCommand,
    executeStreamingCommand: mockExecuteStreamingCommand,
  },
}));

beforeEach(() => {
  mockExecuteCommand.mockClear();
  mockExecuteStreamingCommand.mockClear();
});

afterEach(() => {
  mockExecuteCommand.mockReset();
  mockExecuteStreamingCommand.mockReset();
});

describe('Git Branches', () => {
  describe('getGitBranches', () => {
    it('should parse git branches correctly', async () => {
      // Arrange
      mockExecuteCommand.mockResolvedValue({
        stdout: 'main',
        stderr: '',
      });
      mockExecuteStreamingCommand.mockResolvedValue({
        data: [
          'main|2 hours ago|origin/main',
          'feature/test|1 day ago|origin/feature/test',
          'develop|3 days ago|',
        ],
      });

      // Act
      const branches = await getGitBranches();

      // Assert
      expect(mockExecuteCommand).toHaveBeenCalledWith(
        'git rev-parse --abbrev-ref HEAD'
      );
      expect(mockExecuteStreamingCommand).toHaveBeenCalledWith(
        'git branch --sort=-committerdate --format=%(refname:short)|%(committerdate:relative)|%(upstream:short) --list'
      );
      expect(branches).toHaveLength(3);
      expect(branches[0]).toEqual({
        name: 'main',
        date: '2 hours ago',
        current: true,
        upstream: 'origin/main',
      });
      expect(branches[1]).toEqual({
        name: 'feature/test',
        date: '1 day ago',
        current: false,
        upstream: 'origin/feature/test',
      });
      expect(branches[2]).toEqual({
        name: 'develop',
        date: '3 days ago',
        current: false,
        upstream: undefined,
      });
    });

    it('should handle empty git branch output', async () => {
      // Arrange
      mockExecuteCommand.mockResolvedValue({
        stdout: 'main',
        stderr: '',
      });
      mockExecuteStreamingCommand.mockResolvedValue({
        data: [],
      });

      // Act
      const branches = await getGitBranches();

      // Assert
      expect(branches).toHaveLength(0);
    });

    it('should filter out empty lines', async () => {
      // Arrange
      mockExecuteCommand.mockResolvedValue({
        stdout: 'main',
        stderr: '',
      });
      mockExecuteStreamingCommand.mockResolvedValue({
        data: [
          'main|2 hours ago|origin/main',
          '',
          '',
          'feature/test|1 day ago|',
          '',
        ],
      });

      // Act
      const branches = await getGitBranches();

      // Assert
      expect(branches).toHaveLength(2);
      expect(branches[0]).toEqual({
        name: 'main',
        date: '2 hours ago',
        current: true,
        upstream: 'origin/main',
      });
      expect(branches[1]).toEqual({
        name: 'feature/test',
        date: '1 day ago',
        current: false,
        upstream: undefined,
      });
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
      mockExecuteCommand.mockResolvedValue({
        stdout: 'main',
        stderr: '',
      });
      mockExecuteStreamingCommand.mockResolvedValue({
        data: [
          'feature/user-123|1 hour ago|upstream/feature/user-123',
          'bugfix/fix-login-issue|yesterday|',
        ],
      });

      // Act
      const branches = await getGitBranches();

      // Assert
      expect(branches).toHaveLength(2);
      expect(branches[0]).toEqual({
        name: 'feature/user-123',
        date: '1 hour ago',
        current: false,
        upstream: 'upstream/feature/user-123',
      });
      expect(branches[1]).toEqual({
        name: 'bugfix/fix-login-issue',
        date: 'yesterday',
        current: false,
        upstream: undefined,
      });
    });

    it('should handle malformed branch output gracefully', async () => {
      // Arrange
      mockExecuteCommand.mockResolvedValue({
        stdout: 'main',
        stderr: '',
      });
      mockExecuteStreamingCommand.mockResolvedValue({
        data: ['main', 'feature/test|1 day ago', 'bugfix|today|origin/bugfix'],
      });

      // Act
      const branches = await getGitBranches();

      // Assert
      expect(branches).toHaveLength(3);
      expect(branches[0]).toEqual({
        name: 'main',
        date: undefined,
        current: true,
        upstream: undefined,
      });
      expect(branches[1]).toEqual({
        name: 'feature/test',
        date: '1 day ago',
        current: false,
        upstream: undefined,
      });
      expect(branches[2]).toEqual({
        name: 'bugfix',
        date: 'today',
        current: false,
        upstream: 'origin/bugfix',
      });
    });
  });

  describe('filterBranches', () => {
    const mockBranches: GitBranch[] = [
      { name: 'main', date: '2 hours ago', current: false },
      { name: 'feature/authentication', date: '1 day ago', current: false },
      { name: 'feature/user-profile', date: '2 days ago', current: false },
      { name: 'bugfix/login-issue', date: '3 days ago', current: false },
      { name: 'develop', date: '1 week ago', current: false },
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
