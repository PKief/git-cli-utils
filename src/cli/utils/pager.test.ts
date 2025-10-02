import { beforeEach, describe, expect, it, spyOn } from 'bun:test';
import { Pager, showInPager } from './pager.js';

describe('Pager', () => {
  let pager: Pager;
  let mockConsoleLog: ReturnType<typeof spyOn>;

  beforeEach(() => {
    // Mock console methods
    mockConsoleLog = spyOn(console, 'log').mockImplementation(() => {});

    pager = new Pager();
  });

  describe('constructor', () => {
    it('should create a Pager instance', () => {
      expect(pager).toBeInstanceOf(Pager);
    });

    it('should create a new instance', () => {
      const newPager = new Pager();
      expect(newPager).toBeInstanceOf(Pager);
      expect(newPager).not.toBe(pager);
    });
  });

  describe('display', () => {
    it('should display message when content is empty', async () => {
      await pager.display('');

      expect(mockConsoleLog).toHaveBeenCalledWith('No content to display');
    });

    it('should display short content when content is provided', async () => {
      const content = 'Valid content';
      await pager.display(content);
      expect(mockConsoleLog).toHaveBeenCalledWith(content);
    });

    it('should display short content directly without paging', async () => {
      const shortContent = 'Line 1\nLine 2\nLine 3';

      await pager.display(shortContent);

      expect(mockConsoleLog).toHaveBeenCalledWith(shortContent);
    });

    it('should handle single line content', async () => {
      const singleLine = 'This is a single line of content';

      await pager.display(singleLine);

      expect(mockConsoleLog).toHaveBeenCalledWith(singleLine);
    });

    it('should handle content with special characters', async () => {
      const specialContent = 'Line with émojis 🎉 and special chars: áéíóú';

      await pager.display(specialContent);

      expect(mockConsoleLog).toHaveBeenCalledWith(specialContent);
    });

    it('should handle content with ANSI escape codes', async () => {
      const ansiContent = '\x1b[31mRed text\x1b[0m\n\x1b[32mGreen text\x1b[0m';

      await pager.display(ansiContent);

      expect(mockConsoleLog).toHaveBeenCalledWith(ansiContent);
    });
  });

  describe('line processing', () => {
    it('should split content into lines correctly', async () => {
      const multiLineContent = 'Line 1\nLine 2\nLine 3\nLine 4';

      await pager.display(multiLineContent);

      // For short content, it should display directly
      expect(mockConsoleLog).toHaveBeenCalledWith(multiLineContent);
    });

    it('should handle content with different line endings', async () => {
      const windowsLineEndings = 'Line 1\r\nLine 2\r\nLine 3';

      await pager.display(windowsLineEndings);

      expect(mockConsoleLog).toHaveBeenCalledWith(windowsLineEndings);
    });

    it('should handle content with mixed line endings', async () => {
      const mixedLineEndings = 'Line 1\nLine 2\r\nLine 3\rLine 4';

      await pager.display(mixedLineEndings);

      expect(mockConsoleLog).toHaveBeenCalledWith(mixedLineEndings);
    });
  });

  describe('edge cases', () => {
    it('should handle empty lines in content', async () => {
      const contentWithEmptyLines = 'Line 1\n\nLine 3\n\n\nLine 6';

      await pager.display(contentWithEmptyLines);

      expect(mockConsoleLog).toHaveBeenCalledWith(contentWithEmptyLines);
    });

    it('should handle content that is only whitespace', async () => {
      const whitespaceContent = '   \n\t\n   \n';

      await pager.display(whitespaceContent);

      expect(mockConsoleLog).toHaveBeenCalledWith(whitespaceContent);
    });

    it('should handle very long single line', async () => {
      const longLine = 'A'.repeat(1000);

      await pager.display(longLine);

      expect(mockConsoleLog).toHaveBeenCalledWith(longLine);
    });

    it('should handle content with tabs', async () => {
      const tabbedContent = 'Column1\tColumn2\tColumn3\nValue1\tValue2\tValue3';

      await pager.display(tabbedContent);

      expect(mockConsoleLog).toHaveBeenCalledWith(tabbedContent);
    });
  });

  describe('showInPager convenience function', () => {
    it('should create pager instance and display content', async () => {
      const content = 'Test content for convenience function';

      await showInPager(content);

      expect(mockConsoleLog).toHaveBeenCalledWith(content);
    });

    it('should handle empty content in convenience function', async () => {
      await showInPager('');

      expect(mockConsoleLog).toHaveBeenCalledWith('No content to display');
    });

    it('should handle multi-line content in convenience function', async () => {
      const multiLineContent = 'Line 1\nLine 2\nLine 3';

      await showInPager(multiLineContent);

      expect(mockConsoleLog).toHaveBeenCalledWith(multiLineContent);
    });
  });

  describe('content formatting', () => {
    it('should preserve original content formatting', async () => {
      const formattedContent = `  Indented line
    More indented
  Back to less indent
Normal line`;

      await pager.display(formattedContent);

      expect(mockConsoleLog).toHaveBeenCalledWith(formattedContent);
    });

    it('should handle content with Unicode characters', async () => {
      const unicodeContent = '🚀 Unicode test: café, naïve, résumé → ←↑↓';

      await pager.display(unicodeContent);

      expect(mockConsoleLog).toHaveBeenCalledWith(unicodeContent);
    });

    it('should handle git diff-like content', async () => {
      const gitDiffContent = `diff --git a/file.txt b/file.txt
index 1234567..abcdefg 100644
--- a/file.txt
+++ b/file.txt
@@ -1,3 +1,4 @@
 line 1
-line 2
+line 2 modified
+new line 3
 line 4`;

      await pager.display(gitDiffContent);

      expect(mockConsoleLog).toHaveBeenCalledWith(gitDiffContent);
    });
  });

  describe('edge case handling', () => {
    it('should handle empty string input', async () => {
      await pager.display('');

      expect(mockConsoleLog).toHaveBeenCalledWith('No content to display');
    });

    it('should handle whitespace-only content', async () => {
      const whitespaceOnly = '   ';

      await pager.display(whitespaceOnly);

      expect(mockConsoleLog).toHaveBeenCalledWith(whitespaceOnly);
    });

    it('should handle string with newlines only', async () => {
      const newlinesOnly = '\n\n\n';

      await pager.display(newlinesOnly);

      expect(mockConsoleLog).toHaveBeenCalledWith(newlinesOnly);
    });

    it('should handle very large content strings', async () => {
      const largeContent = 'A'.repeat(10000);

      await pager.display(largeContent);

      expect(mockConsoleLog).toHaveBeenCalledWith(largeContent);
    });
  });
});
