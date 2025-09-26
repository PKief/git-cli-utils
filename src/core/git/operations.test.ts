import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from 'bun:test';
import clipboardy from 'clipboardy';
import { GitOperations } from './operations';

// Mock the GitExecutor
const mockExecuteCommand = mock();

mock.module('./executor.js', () => ({
  gitExecutor: {
    executeCommand: mockExecuteCommand,
  },
}));

// Mock dependencies
let mockClipboardy: ReturnType<typeof spyOn>;
let consoleSpy: ReturnType<typeof spyOn>;

beforeEach(() => {
  // Reset GitExecutor mock
  mockExecuteCommand.mockClear();

  // Mock clipboardy
  mockClipboardy = spyOn(clipboardy, 'write').mockResolvedValue();

  // Mock console.log to avoid output during tests
  consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  // Restore all mocks
  mockExecuteCommand.mockReset();
  mockClipboardy.mockRestore();
  consoleSpy.mockRestore();
});

describe('GitOperations', () => {
  describe('checkoutBranch', () => {
    it('should successfully checkout a branch', async () => {
      // Arrange
      const branchName = 'feature/test';
      const mockStdout = "Switched to branch 'feature/test'";
      mockExecuteCommand.mockResolvedValue({
        stdout: mockStdout,
        stderr: "Switched to branch 'feature/test'",
      });

      // Act
      await GitOperations.checkoutBranch(branchName);

      // Assert
      expect(mockExecuteCommand).toHaveBeenCalledWith(
        'git checkout "feature/test"'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "Switched to branch 'feature/test'"
      );
      expect(consoleSpy).toHaveBeenCalledWith(mockStdout);
    });

    it('should handle already on branch message', async () => {
      // Arrange
      const branchName = 'main';
      mockExecuteCommand.mockResolvedValue({
        stdout: '',
        stderr: "Already on 'main'",
      });

      // Act
      await GitOperations.checkoutBranch(branchName);

      // Assert
      expect(mockExecuteCommand).toHaveBeenCalledWith('git checkout "main"');
      expect(consoleSpy).toHaveBeenCalledWith("Switched to branch 'main'");
    });

    it('should throw error when git checkout fails', async () => {
      // Arrange
      const branchName = 'nonexistent';
      const mockError = new Error(
        "pathspec 'nonexistent' did not match any file(s) known to git"
      );
      mockExecuteCommand.mockRejectedValue(mockError);

      // Act & Assert
      await expect(GitOperations.checkoutBranch(branchName)).rejects.toThrow(
        "Failed to checkout branch 'nonexistent': pathspec 'nonexistent' did not match any file(s) known to git"
      );
    });

    it('should throw error for unexpected stderr', async () => {
      // Arrange
      const branchName = 'test';
      mockExecuteCommand.mockResolvedValue({
        stdout: '',
        stderr: 'Unexpected error message',
      });

      // Act & Assert
      await expect(GitOperations.checkoutBranch(branchName)).rejects.toThrow(
        "Failed to checkout branch 'test': Unexpected error message"
      );
    });

    it('should handle branch names with special characters', async () => {
      // Arrange
      const branchName = 'feature/user-123';
      mockExecuteCommand.mockResolvedValue({
        stdout: "Switched to a new branch 'feature/user-123'",
        stderr: "Switched to branch 'feature/user-123'",
      });

      // Act
      await GitOperations.checkoutBranch(branchName);

      // Assert
      expect(mockExecuteCommand).toHaveBeenCalledWith(
        'git checkout "feature/user-123"'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "Switched to branch 'feature/user-123'"
      );
    });
  });

  describe('copyToClipboard', () => {
    it('should successfully copy text to clipboard', async () => {
      // Arrange
      const text = 'test text';
      mockClipboardy.mockResolvedValue(undefined);

      // Act
      await GitOperations.copyToClipboard(text);

      // Assert
      expect(mockClipboardy).toHaveBeenCalledWith(text);
      expect(consoleSpy).toHaveBeenCalledWith(`Copied to clipboard: ${text}`);
    });

    it('should throw error when clipboard operation fails', async () => {
      // Arrange
      const text = 'test text';
      const clipboardError = new Error('Clipboard access denied');
      mockClipboardy.mockRejectedValue(clipboardError);

      // Act & Assert
      await expect(GitOperations.copyToClipboard(text)).rejects.toThrow(
        'Failed to copy to clipboard: Clipboard access denied'
      );
    });

    it('should handle non-Error clipboard failures', async () => {
      // Arrange
      const text = 'test text';
      mockClipboardy.mockRejectedValue('String error');

      // Act & Assert
      await expect(GitOperations.copyToClipboard(text)).rejects.toThrow(
        'Failed to copy to clipboard: String error'
      );
    });

    it('should handle empty text', async () => {
      // Arrange
      const text = '';
      mockClipboardy.mockResolvedValue(undefined);

      // Act
      await GitOperations.copyToClipboard(text);

      // Assert
      expect(mockClipboardy).toHaveBeenCalledWith('');
      expect(consoleSpy).toHaveBeenCalledWith('Copied to clipboard: ');
    });

    it('should handle special characters', async () => {
      // Arrange
      const text = 'feature/user-123 ñáéíóú';
      mockClipboardy.mockResolvedValue(undefined);

      // Act
      await GitOperations.copyToClipboard(text);

      // Assert
      expect(mockClipboardy).toHaveBeenCalledWith(text);
      expect(consoleSpy).toHaveBeenCalledWith(`Copied to clipboard: ${text}`);
    });
  });
});
