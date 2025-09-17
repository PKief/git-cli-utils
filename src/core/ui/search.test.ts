import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test';
import * as branches from '../git/branches';
import * as commits from '../git/commits';
import { searchBranches, searchCommits } from './search';

// Mock dependencies
let mockGetGitBranches: ReturnType<typeof spyOn>;
let mockGetGitCommits: ReturnType<typeof spyOn>;

beforeEach(() => {
  mockGetGitBranches = spyOn(branches, 'getGitBranches');
  mockGetGitCommits = spyOn(commits, 'getGitCommits');
});

afterEach(() => {
  mockGetGitBranches.mockRestore();
  mockGetGitCommits.mockRestore();
});

describe('Search', () => {
  describe('searchBranches', () => {
    const mockBranches = [
      { name: 'main', date: '2 hours ago' },
      { name: 'feature/authentication', date: '1 day ago' },
      { name: 'feature/user-profile', date: '2 days ago' },
      { name: 'bugfix/login-issue', date: '3 days ago' },
      { name: 'develop', date: '1 week ago' },
    ];

    it('should filter branches by search term', async () => {
      // Arrange
      mockGetGitBranches.mockResolvedValue(mockBranches);

      // Act
      const result = await searchBranches('feature');

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('feature/authentication');
      expect(result[1].name).toBe('feature/user-profile');
    });

    it('should return empty array when no matches found', async () => {
      // Arrange
      mockGetGitBranches.mockResolvedValue(mockBranches);

      // Act
      const result = await searchBranches('nonexistent');

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should return all branches when search term is empty', async () => {
      // Arrange
      mockGetGitBranches.mockResolvedValue(mockBranches);

      // Act
      const result = await searchBranches('');

      // Assert
      expect(result).toHaveLength(5);
      expect(result).toEqual(mockBranches);
    });

    it('should handle partial matches', async () => {
      // Arrange
      mockGetGitBranches.mockResolvedValue(mockBranches);

      // Act
      const result = await searchBranches('auth');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('feature/authentication');
    });

    it('should be case sensitive', async () => {
      // Arrange
      mockGetGitBranches.mockResolvedValue(mockBranches);

      // Act
      const result = await searchBranches('FEATURE');

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should handle git command errors', async () => {
      // Arrange
      const error = new Error('Not a git repository');
      mockGetGitBranches.mockRejectedValue(error);

      // Act & Assert
      await expect(searchBranches('test')).rejects.toThrow('Not a git repository');
    });
  });

  describe('searchCommits', () => {
    const mockCommits = [
      {
        hash: 'abc123',
        date: '2023-09-15',
        branch: 'main',
        subject: 'Initial commit with authentication'
      },
      {
        hash: 'def456',
        date: '2023-09-14',
        branch: 'feature/user-profile',
        subject: 'Add user profile functionality'
      },
      {
        hash: 'ghi789',
        date: '2023-09-13',
        branch: 'bugfix/login-issue',
        subject: 'Fix login validation bug'
      },
    ];

    it('should filter commits by subject search term', async () => {
      // Arrange
      mockGetGitCommits.mockResolvedValue(mockCommits);

      // Act
      const result = await searchCommits('authentication');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].subject).toBe('Initial commit with authentication');
    });

    it('should return empty array when no matches found', async () => {
      // Arrange
      mockGetGitCommits.mockResolvedValue(mockCommits);

      // Act
      const result = await searchCommits('nonexistent');

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should return all commits when search term is empty', async () => {
      // Arrange
      mockGetGitCommits.mockResolvedValue(mockCommits);

      // Act
      const result = await searchCommits('');

      // Assert
      expect(result).toHaveLength(3);
      expect(result).toEqual(mockCommits);
    });

    it('should handle partial matches in commit subjects', async () => {
      // Arrange
      mockGetGitCommits.mockResolvedValue(mockCommits);

      // Act
      const result = await searchCommits('user');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].subject).toBe('Add user profile functionality');
    });

    it('should be case sensitive', async () => {
      // Arrange
      mockGetGitCommits.mockResolvedValue(mockCommits);

      // Act
      const result = await searchCommits('USER');

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should handle git command errors', async () => {
      // Arrange
      const error = new Error('Not a git repository');
      mockGetGitCommits.mockRejectedValue(error);

      // Act & Assert
      await expect(searchCommits('test')).rejects.toThrow('Not a git repository');
    });

    it('should handle word boundaries correctly', async () => {
      // Arrange
      mockGetGitCommits.mockResolvedValue(mockCommits);

      // Act
      const result = await searchCommits('Add');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].subject).toBe('Add user profile functionality');
    });
  });
});