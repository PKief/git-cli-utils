import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { getFileAuthors, getLastAuthor } from './authors';

// Mock the GitExecutor
const mockExecuteCommand = mock();

mock.module('./executor.js', () => ({
  gitExecutor: {
    executeCommand: mockExecuteCommand,
  },
}));

describe('authors', () => {
  beforeEach(() => {
    mockExecuteCommand.mockClear();
  });

  afterEach(() => {
    mockExecuteCommand.mockReset();
  });

  describe('getLastAuthor', () => {
    test('should return last author for a file', async () => {
      const filePath = 'src/test.ts';
      const mockOutput =
        'John Doe|john.doe@example.com|abc123|25.09.2025 14:30';

      mockExecuteCommand.mockResolvedValue({
        stdout: mockOutput,
        stderr: '',
      });

      const result = await getLastAuthor(filePath);

      expect(mockExecuteCommand).toHaveBeenCalledWith(
        `git log -1 --pretty=format:"%an|%ae|%h|%cd" --date=format:"%d.%m.%Y %H:%M" -- "${filePath}"`
      );

      expect(result).toEqual({
        name: 'John Doe',
        email: 'john.doe@example.com',
        commitHash: 'abc123',
        date: '25.09.2025 14:30',
      });
    });

    test('should return null when no commit history exists', async () => {
      const filePath = 'src/new-file.ts';

      mockExecuteCommand.mockResolvedValue({
        stdout: '',
        stderr: '',
      });

      const result = await getLastAuthor(filePath);

      expect(result).toBeNull();
    });

    test('should handle git errors', async () => {
      const filePath = 'src/test.ts';
      const mockError = new Error('Git command failed');

      mockExecuteCommand.mockRejectedValue(mockError);

      const result = await getLastAuthor(filePath);
      expect(result).toBeNull();
    });

    test('should handle multi-line output correctly', async () => {
      const filePath = 'src/test.ts';
      const mockOutput =
        'Jane Smith|jane.smith@example.com|def456|24.09.2025 09:15';

      mockExecuteCommand.mockResolvedValue({
        stdout: mockOutput,
        stderr: '',
      });

      const result = await getLastAuthor(filePath);

      expect(result).toEqual({
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        commitHash: 'def456',
        date: '24.09.2025 09:15',
      });
    });
  });

  describe('getFileAuthors', () => {
    test('should return authors sorted by commit count for repository', async () => {
      // Mock the optimized git log output with all data in one call
      // Format: "author_name|author_email|commit_hash|commit_date"
      const mockGitLogOutput = `John Doe|john.doe@example.com|abc123|25.09.2025 14:30
John Doe|john.doe@example.com|abc124|24.09.2025 13:20
John Doe|john.doe@example.com|abc125|23.09.2025 12:10
John Doe|john.doe@example.com|abc126|22.09.2025 11:00
John Doe|john.doe@example.com|abc127|21.09.2025 10:30
Jane Smith|jane.smith@example.com|def456|24.09.2025 09:15
Jane Smith|jane.smith@example.com|def457|23.09.2025 08:30
Jane Smith|jane.smith@example.com|def458|22.09.2025 07:45
Bob Wilson|bob.wilson@example.com|ghi789|23.09.2025 16:45`;

      mockExecuteCommand.mockResolvedValue({
        stdout: mockGitLogOutput,
        stderr: '',
      });

      const result = await getFileAuthors();

      expect(result).toHaveLength(3);

      // Should be sorted by commit count descending
      expect(result[0].name).toBe('John Doe');
      expect(result[0].commitCount).toBe(5);
      expect(result[0].lastCommitHash).toBe('abc123'); // Most recent commit
      expect(result[0].lastCommitDate).toBe('25.09.2025 14:30');

      expect(result[1].name).toBe('Jane Smith');
      expect(result[1].commitCount).toBe(3);
      expect(result[1].lastCommitHash).toBe('def456');
      expect(result[1].lastCommitDate).toBe('24.09.2025 09:15');

      expect(result[2].name).toBe('Bob Wilson');
      expect(result[2].commitCount).toBe(1);
      expect(result[2].lastCommitHash).toBe('ghi789');
      expect(result[2].lastCommitDate).toBe('23.09.2025 16:45');

      // Verify only one git command was called (optimized!)
      expect(mockExecuteCommand).toHaveBeenCalledTimes(1);
      expect(mockExecuteCommand).toHaveBeenCalledWith(
        'git log --pretty=format:"%an|%ae|%h|%cd" --date=format:"%d.%m.%Y %H:%M"'
      );
    });

    test('should return authors for specific file', async () => {
      const filePath = 'src/test.ts';
      // Mock the optimized git log output for a specific file
      const mockGitLogOutput = `John Doe|john.doe@example.com|abc123|25.09.2025 14:30
John Doe|john.doe@example.com|abc124|24.09.2025 13:20
Jane Smith|jane.smith@example.com|def456|24.09.2025 09:15`;

      mockExecuteCommand.mockResolvedValue({
        stdout: mockGitLogOutput,
        stderr: '',
      });

      const result = await getFileAuthors(filePath);

      expect(result).toHaveLength(2);
      expect(result[0].commitCount).toBe(2); // John Doe should be first
      expect(result[0].name).toBe('John Doe');
      expect(result[0].lastCommitHash).toBe('abc123');
      expect(result[1].commitCount).toBe(1); // Jane Smith should be second
      expect(result[1].name).toBe('Jane Smith');
      expect(result[1].lastCommitHash).toBe('def456');

      // Verify the correct command was called with file path
      expect(mockExecuteCommand).toHaveBeenCalledWith(
        `git log --pretty=format:"%an|%ae|%h|%cd" --date=format:"%d.%m.%Y %H:%M" -- "${filePath}"`
      );
    });

    test('should return empty array when no authors found', async () => {
      mockExecuteCommand.mockResolvedValue({
        stdout: '',
        stderr: '',
      });

      const result = await getFileAuthors();

      expect(result).toEqual([]);
    });

    test('should handle git log errors', async () => {
      const mockError = new Error('Git log failed');

      mockExecuteCommand.mockRejectedValue(mockError);

      await expect(getFileAuthors()).rejects.toThrow('Git log failed');
    });

    test('should handle malformed log output gracefully', async () => {
      // Mock git log output with some malformed lines (missing parts)
      const mockGitLogOutput = `invalid line without proper format
John Doe|john.doe@example.com|abc123|25.09.2025 14:30
John Doe|john.doe@example.com|abc124|24.09.2025 13:20
John Doe|john.doe@example.com|abc125|23.09.2025 12:10
John Doe|john.doe@example.com|abc126|22.09.2025 11:00
John Doe|john.doe@example.com|abc127|21.09.2025 10:30
another invalid line with|only|two parts
Jane Smith|jane.smith@example.com|def456|24.09.2025 09:15
Jane Smith|jane.smith@example.com|def457|23.09.2025 08:30`;

      mockExecuteCommand.mockResolvedValue({
        stdout: mockGitLogOutput,
        stderr: '',
      });

      const result = await getFileAuthors();

      // Should only include the valid entries (lines with exactly 4 parts)
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('John Doe');
      expect(result[0].commitCount).toBe(5);
      expect(result[1].name).toBe('Jane Smith');
      expect(result[1].commitCount).toBe(2);
    });

    test('should handle empty commit info gracefully', async () => {
      // Mock git log output where some commits have missing hash or date info
      const mockGitLogOutput = `John Doe|john.doe@example.com|abc123|25.09.2025 14:30
John Doe|john.doe@example.com||
John Doe|john.doe@example.com|abc125|`;

      mockExecuteCommand.mockResolvedValue({
        stdout: mockGitLogOutput,
        stderr: '',
      });

      const result = await getFileAuthors();

      // Should still return the author with available info
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'John Doe',
        email: 'john.doe@example.com',
        commitCount: 3,
        lastCommitHash: 'abc123', // First (most recent) commit has hash
        lastCommitDate: '25.09.2025 14:30', // First commit has date
      });
    });
  });
});
