import { describe, expect, it } from 'bun:test';
import ANSI from './ansi';

describe('ANSI', () => {
  it('should export all expected ANSI color codes', () => {
    // Assert basic control codes
    expect(ANSI.reset).toBe('\x1b[0m');
    expect(ANSI.bold).toBe('\x1b[1m');
    expect(ANSI.reverse).toBe('\x1b[7m');
  });

  it('should export standard color codes', () => {
    // Assert standard colors
    expect(ANSI.yellow).toBe('\x1b[33m');
    expect(ANSI.green).toBe('\x1b[32m');
    expect(ANSI.red).toBe('\x1b[31m');
    expect(ANSI.white).toBe('\x1b[37m');
    expect(ANSI.black).toBe('\x1b[30m');
  });

  it('should export bright color codes', () => {
    // Assert bright colors
    expect(ANSI.brightWhite).toBe('\x1b[97m');
  });

  it('should export background color codes', () => {
    // Assert background colors
    expect(ANSI.bgWhite).toBe('\x1b[47m');
    expect(ANSI.bgYellow).toBe('\x1b[43m');
    expect(ANSI.bgBlue).toBe('\x1b[44m');
    expect(ANSI.bgCyan).toBe('\x1b[46m');
    expect(ANSI.bgMagenta).toBe('\x1b[45m');
    expect(ANSI.bgGreen).toBe('\x1b[42m');
    expect(ANSI.bgRed).toBe('\x1b[41m');
  });

  it('should allow string concatenation for colored text', () => {
    // Test that ANSI codes can be used to format text
    const coloredText = ANSI.green + 'Success' + ANSI.reset;
    expect(coloredText).toBe('\x1b[32mSuccess\x1b[0m');
  });

  it('should allow combining multiple formatting codes', () => {
    // Test combining bold and color
    const formattedText = ANSI.bold + ANSI.red + 'Error' + ANSI.reset;
    expect(formattedText).toBe('\x1b[1m\x1b[31mError\x1b[0m');
  });

  it('should provide working background and foreground combinations', () => {
    // Test background and foreground combination
    const highlightedText = ANSI.bgYellow + ANSI.black + 'Warning' + ANSI.reset;
    expect(highlightedText).toBe('\x1b[43m\x1b[30mWarning\x1b[0m');
  });

  it('should be an object with string values', () => {
    // Assert that all values are strings
    Object.values(ANSI).forEach(value => {
      expect(typeof value).toBe('string');
      expect(value).toMatch(/^\x1b\[\d+m$/);
    });
  });

  it('should export as default', () => {
    // Ensure it can be imported as default
    expect(ANSI).toBeInstanceOf(Object);
    expect(Object.keys(ANSI).length).toBeGreaterThan(0);
  });

  it('should have consistent ESC sequence format', () => {
    // All ANSI codes should start with ESC[ and end with m
    Object.entries(ANSI).forEach(([key, value]) => {
      expect(value).toMatch(/^\x1b\[\d+m$/);
    });
  });
});