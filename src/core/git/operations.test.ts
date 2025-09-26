import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test';
import clipboardy from 'clipboardy';
import { GitOperations } from './operations';

// Mock dependencies
let mockClipboardy: ReturnType<typeof spyOn>;
let consoleSpy: ReturnType<typeof spyOn>;

beforeEach(() => {
  // Mock clipboardy
  mockClipboardy = spyOn(clipboardy, 'write').mockResolvedValue();

  // Mock console.log to avoid output during tests
  consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  // Restore all mocks
  mockClipboardy.mockRestore();
  consoleSpy.mockRestore();
});

describe('GitOperations', () => {
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
