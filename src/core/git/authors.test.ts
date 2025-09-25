import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { EventEmitter } from 'events';
import { getFileAuthors, getLastAuthor } from './authors';

// Create a mock process that extends EventEmitter
class MockProcess extends EventEmitter {
  stdout = new EventEmitter();

  constructor() {
    super();
  }
}

// Mock the spawn function from child_process
const mockSpawn = mock((command: string, args: string[]) => new MockProcess());

// Mock the child_process module
mock.module('child_process', () => ({
  spawn: mockSpawn,
}));

describe('authors', () => {
  let mockProcess: MockProcess;

  beforeEach(() => {
    mockProcess = new MockProcess();
    mockSpawn.mockImplementation(() => mockProcess);
  });

  afterEach(() => {
    mockSpawn.mockClear();
  });

  describe('getLastAuthor', () => {
    test('should return last author for a file', async () => {
      const filePath = 'src/test.ts';
      const mockOutput =
        'John Doe|john.doe@example.com|abc123|25.09.2025 14:30';

      const promise = getLastAuthor(filePath);

      // Simulate git output
      queueMicrotask(() => {
        mockProcess.stdout.emit('data', Buffer.from(mockOutput));
        mockProcess.stdout.emit('end');
      });

      const result = await promise;

      expect(mockSpawn).toHaveBeenCalledWith('git', [
        'log',
        '-1',
        '--pretty=format:%an|%ae|%h|%cd',
        '--date=format:%d.%m.%Y %H:%M',
        '--',
        filePath,
      ]);

      expect(result).toEqual({
        name: 'John Doe',
        email: 'john.doe@example.com',
        commitHash: 'abc123',
        date: '25.09.2025 14:30',
      });
    });

    test('should return null when no commit history exists', async () => {
      const filePath = 'src/new-file.ts';

      const promise = getLastAuthor(filePath);

      // Simulate empty git output
      queueMicrotask(() => {
        mockProcess.stdout.emit('data', Buffer.from(''));
        mockProcess.stdout.emit('end');
      });

      const result = await promise;

      expect(result).toBeNull();
    });

    test('should handle git errors', async () => {
      const filePath = 'src/test.ts';
      const mockError = new Error('Git command failed');

      const promise = getLastAuthor(filePath);

      // Simulate git error
      queueMicrotask(() => {
        mockProcess.emit('error', mockError);
      });

      await expect(promise).rejects.toThrow('Git command failed');
    });

    test('should handle multi-line output correctly', async () => {
      const filePath = 'src/test.ts';
      const mockOutput =
        'Jane Smith|jane.smith@example.com|def456|24.09.2025 09:15';

      const promise = getLastAuthor(filePath);

      // Simulate git output with extra whitespace
      queueMicrotask(() => {
        mockProcess.stdout.emit('data', Buffer.from(`  ${mockOutput}  \n\n`));
        mockProcess.stdout.emit('end');
      });

      const result = await promise;

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
      const mockShortlogOutput = `     5\tJohn Doe <john.doe@example.com>
     3\tJane Smith <jane.smith@example.com>
     1\tBob Wilson <bob.wilson@example.com>`;

      let spawnCallCount = 0;
      const mockLastCommitOutputs = [
        'abc123|25.09.2025 14:30', // John Doe
        'def456|24.09.2025 09:15', // Jane Smith
        'ghi789|23.09.2025 16:45', // Bob Wilson
      ];

      mockSpawn.mockImplementation((command: string, args: string[]) => {
        const newMockProcess = new MockProcess();

        if (spawnCallCount === 0) {
          // First call is shortlog
          queueMicrotask(() => {
            newMockProcess.stdout.emit('data', Buffer.from(mockShortlogOutput));
            newMockProcess.stdout.emit('end');
          });
          spawnCallCount++;
        } else {
          // Subsequent calls are getLastCommitByAuthor calls
          const outputIndex = spawnCallCount - 1;
          queueMicrotask(() => {
            if (outputIndex < mockLastCommitOutputs.length) {
              newMockProcess.stdout.emit(
                'data',
                Buffer.from(mockLastCommitOutputs[outputIndex])
              );
            }
            newMockProcess.stdout.emit('end');
          });
          spawnCallCount++;
        }

        return newMockProcess;
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
      const mockShortlogOutput = `     2\tJohn Doe <john.doe@example.com>
     1\tJane Smith <jane.smith@example.com>`;

      let spawnCallCount = 0;
      const mockLastCommitOutputs = [
        'abc123|25.09.2025 14:30',
        'def456|24.09.2025 09:15',
      ];

      mockSpawn.mockImplementation((command: string, args: string[]) => {
        const newMockProcess = new MockProcess();

        if (spawnCallCount === 0) {
          // First call is shortlog
          queueMicrotask(() => {
            newMockProcess.stdout.emit('data', Buffer.from(mockShortlogOutput));
            newMockProcess.stdout.emit('end');
          });
          spawnCallCount++;
        } else {
          // Subsequent calls are getLastCommitByAuthor calls
          const outputIndex = spawnCallCount - 1;
          queueMicrotask(() => {
            if (outputIndex < mockLastCommitOutputs.length) {
              newMockProcess.stdout.emit(
                'data',
                Buffer.from(mockLastCommitOutputs[outputIndex])
              );
            }
            newMockProcess.stdout.emit('end');
          });
          spawnCallCount++;
        }

        return newMockProcess;
      });

      const result = await getFileAuthors(filePath);

      expect(result).toHaveLength(2);
      expect(result[0].commitCount).toBe(2); // John Doe should be first
      expect(result[1].commitCount).toBe(1); // Jane Smith should be second
    });

    test('should return empty array when no authors found', async () => {
      const promise = getFileAuthors();

      // Simulate empty shortlog output
      queueMicrotask(() => {
        mockProcess.stdout.emit('data', Buffer.from(''));
        mockProcess.stdout.emit('end');
      });

      const result = await promise;

      expect(result).toEqual([]);
    });

    test('should handle shortlog with incomplete lines in buffer', async () => {
      let spawnCallCount = 0;
      const mockLastCommitOutputs = [
        'abc123|25.09.2025 14:30',
        'def456|24.09.2025 09:15',
      ];

      mockSpawn.mockImplementation((command: string, args: string[]) => {
        const newMockProcess = new MockProcess();

        if (spawnCallCount === 0) {
          // First call is shortlog - simulate chunked output
          queueMicrotask(() => {
            newMockProcess.stdout.emit(
              'data',
              Buffer.from('     2\tJohn Doe <jo')
            );
            newMockProcess.stdout.emit(
              'data',
              Buffer.from('hn.doe@example.com>\n     1\tJane')
            );
            newMockProcess.stdout.emit(
              'data',
              Buffer.from(' Smith <jane.smith@example.com>')
            );
            newMockProcess.stdout.emit('end');
          });
          spawnCallCount++;
        } else {
          // Subsequent calls are getLastCommitByAuthor calls
          const outputIndex = spawnCallCount - 1;
          queueMicrotask(() => {
            if (outputIndex < mockLastCommitOutputs.length) {
              newMockProcess.stdout.emit(
                'data',
                Buffer.from(mockLastCommitOutputs[outputIndex])
              );
            }
            newMockProcess.stdout.emit('end');
          });
          spawnCallCount++;
        }

        return newMockProcess;
      });

      const result = await getFileAuthors();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('John Doe');
      expect(result[1].name).toBe('Jane Smith');
    });

    test('should handle git shortlog errors', async () => {
      const mockError = new Error('Git shortlog failed');

      const promise = getFileAuthors();

      // Simulate git error
      queueMicrotask(() => {
        mockProcess.emit('error', mockError);
      });

      await expect(promise).rejects.toThrow('Git shortlog failed');
    });

    test('should handle malformed shortlog output gracefully', async () => {
      const mockShortlogOutput = `invalid line without proper format
     5\tJohn Doe <john.doe@example.com>
another invalid line
     2\tJane Smith <jane.smith@example.com>`;

      let spawnCallCount = 0;
      const mockLastCommitOutputs = [
        'abc123|25.09.2025 14:30',
        'def456|24.09.2025 09:15',
      ];

      mockSpawn.mockImplementation((command: string, args: string[]) => {
        const newMockProcess = new MockProcess();

        if (spawnCallCount === 0) {
          // First call is shortlog
          queueMicrotask(() => {
            newMockProcess.stdout.emit('data', Buffer.from(mockShortlogOutput));
            newMockProcess.stdout.emit('end');
          });
          spawnCallCount++;
        } else {
          // Subsequent calls are getLastCommitByAuthor calls
          const outputIndex = spawnCallCount - 1;
          queueMicrotask(() => {
            if (outputIndex < mockLastCommitOutputs.length) {
              newMockProcess.stdout.emit(
                'data',
                Buffer.from(mockLastCommitOutputs[outputIndex])
              );
            }
            newMockProcess.stdout.emit('end');
          });
          spawnCallCount++;
        }

        return newMockProcess;
      });

      const result = await getFileAuthors();

      // Should only include the valid entries
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('John Doe');
      expect(result[1].name).toBe('Jane Smith');
    });

    test('should handle errors in getLastCommitByAuthor gracefully', async () => {
      const mockShortlogOutput = `     3\tJohn Doe <john.doe@example.com>`;

      let spawnCallCount = 0;

      mockSpawn.mockImplementation((command: string, args: string[]) => {
        const newMockProcess = new MockProcess();

        if (spawnCallCount === 0) {
          // First call is shortlog
          queueMicrotask(() => {
            newMockProcess.stdout.emit('data', Buffer.from(mockShortlogOutput));
            newMockProcess.stdout.emit('end');
          });
          spawnCallCount++;
        } else {
          // Subsequent call should error
          queueMicrotask(() => {
            newMockProcess.emit('error', new Error('Last commit query failed'));
          });
          spawnCallCount++;
        }

        return newMockProcess;
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
