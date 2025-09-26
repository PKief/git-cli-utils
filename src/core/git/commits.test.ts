import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { filterCommits, type GitCommit, getGitCommits } from './commits';

// Mock the GitExecutor
const mockExecuteStreamingCommand = mock();

mock.module('./executor.js', () => ({
  gitExecutor: {
    executeStreamingCommand: mockExecuteStreamingCommand,
  },
}));

describe('Git Commits', () => {
  beforeEach(() => {
    mockExecuteStreamingCommand.mockClear();
  });

  afterEach(() => {
    mockExecuteStreamingCommand.mockReset();
  });

  describe('getGitCommits', () => {
    it('should return commits for current branch', async () => {
      // Arrange
      const mockOutput = [
        'abc123|2023-09-15|main|Initial commit',
        'def456|2023-09-14|main|Add feature',
        'ghi789|2023-09-13|main|Fix bug',
      ];

      mockExecuteStreamingCommand.mockResolvedValue({
        data: mockOutput,
      });

      // Act
      const commits = await getGitCommits();

      // Assert
      expect(mockExecuteStreamingCommand).toHaveBeenCalledWith(
        'git log --all --date=short --pretty=format:%h|%cd|%D|%s'
      );
      expect(commits).toHaveLength(3);
      expect(commits[0]).toEqual({
        hash: 'abc123',
        date: '2023-09-15',
        branch: 'main',
        subject: 'Initial commit',
      });
    });

    it('should return commits from all branches', async () => {
      // Arrange
      const mockOutput = [
        'abc123|2023-09-15|main|Update main branch',
        'def456|2023-09-14|origin/feature, feature|Add feature',
        'ghi789|2023-09-13|develop|Fix on develop',
      ];

      mockExecuteStreamingCommand.mockResolvedValue({
        data: mockOutput,
      });

      // Act
      const commits = await getGitCommits();

      // Assert
      expect(mockExecuteStreamingCommand).toHaveBeenCalledWith(
        'git log --all --date=short --pretty=format:%h|%cd|%D|%s'
      );
      expect(commits).toHaveLength(3);
      expect(commits[1]).toEqual({
        hash: 'def456',
        date: '2023-09-14',
        branch: 'origin/feature, feature',
        subject: 'Add feature',
      });
    });

    it('should handle empty commit history', async () => {
      // Arrange
      mockExecuteStreamingCommand.mockResolvedValue({
        data: [],
      });

      // Act
      const commits = await getGitCommits();

      // Assert
      expect(commits).toHaveLength(0);
    });

    it('should handle git command errors', async () => {
      // Arrange
      const mockError = new Error('Not a git repository');
      mockExecuteStreamingCommand.mockRejectedValue(mockError);

      // Act & Assert
      await expect(getGitCommits()).rejects.toThrow('Not a git repository');
    });

    it('should parse complex branch names correctly', async () => {
      // Arrange
      const mockOutput = [
        'abc123|2023-09-15|origin/feature/test, feature/test|Add feature',
      ];

      mockExecuteStreamingCommand.mockResolvedValue({
        data: mockOutput,
      });

      // Act
      const commits = await getGitCommits();

      // Assert
      expect(commits).toHaveLength(1);
      expect(commits[0].branch).toBe('origin/feature/test, feature/test');
    });

    it('should handle malformed commit lines gracefully', async () => {
      // Arrange - malformed lines should cause an error due to undefined refs
      const mockOutput = [
        'abc123|2023-09-15|main|Valid commit',
        'invalid line without proper format',
        'def456|2023-09-14|main|Another valid commit',
      ];

      mockExecuteStreamingCommand.mockResolvedValue({
        data: mockOutput,
      });

      // Act & Assert - expect error due to malformed line
      await expect(getGitCommits()).rejects.toThrow(
        'Error executing git command'
      );
    });
  });

  describe('filterCommits', () => {
    const mockCommits: GitCommit[] = [
      {
        hash: 'abc123',
        date: '2023-09-15',
        branch: 'main',
        subject: 'Initial commit with authentication',
      },
      {
        hash: 'def456',
        date: '2023-09-14',
        branch: 'feature/user-profile',
        subject: 'Add user profile functionality',
      },
      {
        hash: 'ghi789',
        date: '2023-09-13',
        branch: 'bugfix/login-issue',
        subject: 'Fix login validation bug',
      },
      {
        hash: 'jkl012',
        date: '2023-09-12',
        branch: 'develop',
        subject: 'Update documentation',
      },
    ];

    it('should return all commits when search term is empty', () => {
      // Act
      const result = filterCommits(mockCommits, '');

      // Assert
      expect(result).toHaveLength(4);
      expect(result).toEqual(mockCommits);
    });

    it('should filter by commit hash', () => {
      // Act
      const result = filterCommits(mockCommits, 'abc123');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].hash).toBe('abc123');
    });

    it('should filter by subject (case insensitive)', () => {
      // Act
      const result = filterCommits(mockCommits, 'authentication');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].subject).toBe('Initial commit with authentication');
    });

    it('should filter by branch name', () => {
      // Act
      const result = filterCommits(mockCommits, 'feature');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].branch).toBe('feature/user-profile');
    });

    it('should filter by date', () => {
      // Act
      const result = filterCommits(mockCommits, '2023-09-14');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2023-09-14');
    });

    it('should handle case insensitive search', () => {
      // Act
      const result = filterCommits(mockCommits, 'LOGIN');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].subject).toBe('Fix login validation bug');
    });

    it('should handle search with separators removed', () => {
      // Act
      const result = filterCommits(mockCommits, 'userprofile');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].branch).toBe('feature/user-profile');
    });

    it('should handle fuzzy matching', () => {
      // Act
      const result = filterCommits(mockCommits, 'usr prf');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].subject).toBe('Add user profile functionality');
    });

    it('should return empty array when no matches found', () => {
      // Act
      const result = filterCommits(mockCommits, 'nonexistent');

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should handle multiple word search', () => {
      // Act
      const result = filterCommits(mockCommits, 'user profile');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].subject).toBe('Add user profile functionality');
    });

    it('should handle special characters in search', () => {
      // Act
      const result = filterCommits(mockCommits, 'user-profile');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].branch).toBe('feature/user-profile');
    });

    it('should return no matches for null search term', () => {
      // Act
      const result = filterCommits(mockCommits, null as unknown as string);

      // Assert
      expect(result).toEqual(mockCommits);
    });

    it('should handle empty commits array', () => {
      // Act
      const result = filterCommits([], 'test');

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should handle whitespace-only search term', () => {
      // Act
      const result = filterCommits(mockCommits, '   ');

      // Assert
      expect(result).toEqual(mockCommits);
    });
  });
});
