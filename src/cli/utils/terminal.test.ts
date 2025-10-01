import { afterEach, beforeEach, describe, expect, it, jest } from 'bun:test';
import {
  clearScreen,
  write,
  writeError,
  writeErrorLine,
  writeLine,
} from './terminal.js';

describe('terminal utilities', () => {
  let stdoutSpy: ReturnType<typeof jest.spyOn>;
  let stderrSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    // Use spyOn to mock the process streams
    stdoutSpy = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);
    stderrSpy = jest
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);
  });

  afterEach(() => {
    // Restore all spies
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  describe('write', () => {
    it('should write text to stdout', () => {
      stdoutSpy.mockClear();
      write('Hello World');
      expect(stdoutSpy).toHaveBeenCalledTimes(1);
      expect(stdoutSpy).toHaveBeenCalledWith('Hello World');
    });

    it('should write empty string', () => {
      stdoutSpy.mockClear();
      write('');
      expect(stdoutSpy).toHaveBeenCalledTimes(1);
      expect(stdoutSpy).toHaveBeenCalledWith('');
    });
  });

  describe('writeLine', () => {
    it('should write text with newline to stdout', () => {
      stdoutSpy.mockClear(); // Clear any previous calls
      writeLine('Hello World');
      expect(stdoutSpy).toHaveBeenCalledTimes(1);
      expect(stdoutSpy).toHaveBeenCalledWith('Hello World\n');
    });

    it('should write just newline when no text provided', () => {
      stdoutSpy.mockClear(); // Clear any previous calls
      writeLine();
      expect(stdoutSpy).toHaveBeenCalledTimes(1);
      expect(stdoutSpy).toHaveBeenCalledWith('\n');
    });

    it('should write empty string with newline', () => {
      stdoutSpy.mockClear(); // Clear any previous calls
      writeLine('');
      expect(stdoutSpy).toHaveBeenCalledTimes(1);
      expect(stdoutSpy).toHaveBeenCalledWith('\n');
    });
  });

  describe('clearScreen', () => {
    it('should write ANSI escape codes to clear screen and move cursor', () => {
      stdoutSpy.mockClear();
      clearScreen();
      expect(stdoutSpy).toHaveBeenCalledTimes(1);
      expect(stdoutSpy).toHaveBeenCalledWith('\u001b[2J\u001b[0;0H');
    });
  });

  describe('writeError', () => {
    it('should write text to stderr', () => {
      stderrSpy.mockClear();
      writeError('Error message');
      expect(stderrSpy).toHaveBeenCalledTimes(1);
      expect(stderrSpy).toHaveBeenCalledWith('Error message');
    });

    it('should write empty string to stderr', () => {
      stderrSpy.mockClear();
      writeError('');
      expect(stderrSpy).toHaveBeenCalledTimes(1);
      expect(stderrSpy).toHaveBeenCalledWith('');
    });
  });

  describe('writeErrorLine', () => {
    it('should write text with newline to stderr', () => {
      stderrSpy.mockClear();
      writeErrorLine('Error message');
      expect(stderrSpy).toHaveBeenCalledTimes(1);
      expect(stderrSpy).toHaveBeenCalledWith('Error message\n');
    });

    it('should write just newline to stderr when no text provided', () => {
      stderrSpy.mockClear();
      writeErrorLine();
      expect(stderrSpy).toHaveBeenCalledTimes(1);
      expect(stderrSpy).toHaveBeenCalledWith('\n');
    });

    it('should write empty string with newline to stderr', () => {
      stderrSpy.mockClear();
      writeErrorLine('');
      expect(stderrSpy).toHaveBeenCalledTimes(1);
      expect(stderrSpy).toHaveBeenCalledWith('\n');
    });
  });
});
