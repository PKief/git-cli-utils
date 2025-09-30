import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { getGitAliases } from './aliases';

// Mock the GitExecutor
const mockExecuteCommand = mock();

mock.module('./executor.js', () => ({
  gitExecutor: {
    executeCommand: mockExecuteCommand,
  },
}));

describe('getGitAliases', () => {
  beforeEach(() => {
    mockExecuteCommand.mockClear();
  });

  afterEach(() => {
    mockExecuteCommand.mockReset();
  });

  it('should return parsed aliases when git config succeeds', async () => {
    const mockOutput = `alias.co checkout
alias.st status
alias.cp cherry-pick`;

    mockExecuteCommand.mockResolvedValue({
      stdout: mockOutput,
      stderr: '',
    });

    const aliases = await getGitAliases();

    expect(aliases).toEqual([
      { name: 'co', command: 'checkout' },
      { name: 'st', command: 'status' },
      { name: 'cp', command: 'cherry-pick' },
    ]);

    expect(mockExecuteCommand).toHaveBeenCalledWith(
      'git config --global --get-regexp alias'
    );
  });

  it('should return empty array when no aliases exist', async () => {
    mockExecuteCommand.mockResolvedValue({
      stdout: '',
      stderr: '',
    });

    const aliases = await getGitAliases();

    expect(aliases).toEqual([]);
  });

  it('should handle complex commands with multiple spaces', async () => {
    const mockOutput = `alias.please push --force-with-lease
alias.fire add -A && git commit -m "🔥" && git push`;

    mockExecuteCommand.mockResolvedValue({
      stdout: mockOutput,
      stderr: '',
    });

    const aliases = await getGitAliases();

    expect(aliases).toEqual([
      { name: 'please', command: 'push --force-with-lease' },
      { name: 'fire', command: 'add -A && git commit -m "🔥" && git push' },
    ]);
  });

  it('should return empty array when git command fails', async () => {
    mockExecuteCommand.mockRejectedValue(new Error('Git not found'));

    const aliases = await getGitAliases();

    expect(aliases).toEqual([]);
  });
});
