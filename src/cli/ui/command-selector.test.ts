import { describe, expect, it } from 'bun:test';
import { showCommandSelector } from './command-selector.js';

describe('command selector', () => {
  it('should export showCommandSelector function', () => {
    expect(typeof showCommandSelector).toBe('function');
  });

  it('should be a function that accepts commands array', () => {
    expect(showCommandSelector).toBeInstanceOf(Function);
    expect(showCommandSelector.length).toBe(1); // Expects 1 parameter
  });

  it('should have proper module structure', () => {
    // Verify the function exists and has expected signature
    expect(showCommandSelector.name).toBe('showCommandSelector');
  });
});
