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
      // Mock the raw git log output (what the new implementation expects)
      const mockGitLogOutput = `John Doe <john.doe@example.com>
John Doe <john.doe@example.com>
John Doe <john.doe@example.com>
John Doe <john.doe@example.com>
John Doe <john.doe@example.com>
Jane Smith <jane.smith@example.com>
Jane Smith <jane.smith@example.com>
Jane Smith <jane.smith@example.com>
Bob Wilson <bob.wilson@example.com>`;

      const mockLastCommitOutputs = [
        'abc123|25.09.2025 14:30', // John Doe
        'def456|24.09.2025 09:15', // Jane Smith
        'ghi789|23.09.2025 16:45', // Bob Wilson
      ];

      let callCount = 0;
      mockExecuteCommand.mockImplementation(() => {
        if (callCount === 0) {
          callCount++;
          return Promise.resolve({
            stdout: mockGitLogOutput,
            stderr: '',
          });
        } else {
          const output = mockLastCommitOutputs[callCount - 1];
          callCount++;
          return Promise.resolve({
            stdout: output,
            stderr: '',
          });
        }
      });

      const result = await getFileAuthors();

      expect(result).toHaveLength(3);

      // Should be sorted by commit count descending
      expect(result[0].name).toBe('John Doe');
      expect(result[0].commitCount).toBe(5);
      expect(result[1].name).toBe('Jane Smith');
      expect(result[1].commitCount).toBe(3);
      expect(result[2].name).toBe('Bob Wilson');
      expect(result[2].commitCount).toBe(1);
    });

    test('should return authors for specific file', async () => {
      const filePath = 'src/test.ts';
      // Mock the raw git log output for a specific file
      const mockGitLogOutput = `John Doe <john.doe@example.com>
John Doe <john.doe@example.com>
Jane Smith <jane.smith@example.com>`;

      const mockLastCommitOutputs = [
        'abc123|25.09.2025 14:30',
        'def456|24.09.2025 09:15',
      ];

      let callCount = 0;
      mockExecuteCommand.mockImplementation(() => {
        if (callCount === 0) {
          callCount++;
          return Promise.resolve({
            stdout: mockGitLogOutput,
            stderr: '',
          });
        } else {
          const output = mockLastCommitOutputs[callCount - 1];
          callCount++;
          return Promise.resolve({
            stdout: output,
            stderr: '',
          });
        }
      });

      const result = await getFileAuthors(filePath);

      expect(result).toHaveLength(2);
      expect(result[0].commitCount).toBe(2); // John Doe should be first
      expect(result[1].commitCount).toBe(1); // Jane Smith should be second
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
      // Mock raw git log output with some malformed lines
      const mockGitLogOutput = `invalid line without proper format
John Doe <john.doe@example.com>
John Doe <john.doe@example.com>
John Doe <john.doe@example.com>
John Doe <john.doe@example.com>
John Doe <john.doe@example.com>
another invalid line
Jane Smith <jane.smith@example.com>
Jane Smith <jane.smith@example.com>`;

      const mockLastCommitOutputs = [
        'abc123|25.09.2025 14:30',
        'def456|24.09.2025 09:15',
      ];

      let callCount = 0;
      mockExecuteCommand.mockImplementation(() => {
        if (callCount === 0) {
          callCount++;
          return Promise.resolve({
            stdout: mockGitLogOutput,
            stderr: '',
          });
        } else {
          const output = mockLastCommitOutputs[callCount - 1];
          callCount++;
          return Promise.resolve({
            stdout: output,
            stderr: '',
          });
        }
      });

      const result = await getFileAuthors();

      // Should only include the valid entries
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('John Doe');
      expect(result[1].name).toBe('Jane Smith');
    });

    test('should handle errors in getLastCommitByAuthor gracefully', async () => {
      const mockGitLogOutput = `John Doe <john.doe@example.com>
John Doe <john.doe@example.com>
John Doe <john.doe@example.com>`;

      let callCount = 0;
      mockExecuteCommand.mockImplementation(() => {
        if (callCount === 0) {
          callCount++;
          return Promise.resolve({
            stdout: mockGitLogOutput,
            stderr: '',
          });
        } else {
          // Mock the getLastCommitByAuthor call to fail
          return Promise.reject(new Error('Last commit query failed'));
        }
      });

      const result = await getFileAuthors();

      // Should still return the author but without last commit info
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'John Doe',
        email: 'john.doe@example.com',
        commitCount: 3,
        lastCommitHash: '',
        lastCommitDate: '',
      });
    });
  });
});
