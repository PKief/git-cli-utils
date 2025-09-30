import { describe, it, expect, jest, beforeEach, afterEach } from 'bun:test';
import { write, writeLine, clearScreen } from './terminal.js';

describe('terminal utilities', () => {
  let mockStdoutWrite: jest.Mock;

  beforeEach(() => {
    mockStdoutWrite = jest.fn();
    process.stdout.write = mockStdoutWrite;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('write', () => {
    it('should write text to stdout', () => {
      write('Hello World');
      expect(mockStdoutWrite).toHaveBeenCalledWith('Hello World');
    });

    it('should write empty string', () => {
      write('');
      expect(mockStdoutWrite).toHaveBeenCalledWith('');
    });
  });

  describe('writeLine', () => {
    it('should write text with newline to stdout', () => {
      writeLine('Hello World');
      expect(mockStdoutWrite).toHaveBeenCalledWith('Hello World\n');
    });

    it('should write just newline when no text provided', () => {
      writeLine();
      expect(mockStdoutWrite).toHaveBeenCalledWith('\n');
    });

    it('should write empty string with newline', () => {
      writeLine('');
      expect(mockStdoutWrite).toHaveBeenCalledWith('\n');
    });
  });

  describe('clearScreen', () => {
    it('should write ANSI escape codes to clear screen and move cursor', () => {
      clearScreen();
      expect(mockStdoutWrite).toHaveBeenCalledWith('\u001b[2J\u001b[0;0H');
    });
  });
});