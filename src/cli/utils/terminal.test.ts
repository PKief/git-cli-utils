import { afterEach, beforeEach, describe, expect, it, jest } from 'bun:test';
import {
  clearScreen,
  write,
  writeError,
  writeErrorLine,
  writeLine,
} from './terminal.js';

describe('terminal utilities', () => {
  let mockStdoutWrite: jest.Mock;
  let mockStderrWrite: jest.Mock;

  beforeEach(() => {
    mockStdoutWrite = jest.fn();
    mockStderrWrite = jest.fn();
    process.stdout.write = mockStdoutWrite;
    process.stderr.write = mockStderrWrite;
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

  describe('writeError', () => {
    it('should write text to stderr', () => {
      writeError('Error message');
      expect(mockStderrWrite).toHaveBeenCalledWith('Error message');
    });

    it('should write empty string to stderr', () => {
      writeError('');
      expect(mockStderrWrite).toHaveBeenCalledWith('');
    });
  });

  describe('writeErrorLine', () => {
    it('should write text with newline to stderr', () => {
      writeErrorLine('Error message');
      expect(mockStderrWrite).toHaveBeenCalledWith('Error message\n');
    });

    it('should write just newline to stderr when no text provided', () => {
      writeErrorLine();
      expect(mockStderrWrite).toHaveBeenCalledWith('\n');
    });

    it('should write empty string with newline to stderr', () => {
      writeErrorLine('');
      expect(mockStderrWrite).toHaveBeenCalledWith('\n');
    });
  });
});
