import { describe, it, expect } from 'bun:test';
import { getPerformanceStatus } from './binary-detection';

describe('Binary Detection Utils', () => {
  describe('getPerformanceStatus', () => {
    it('should return performance status messages', async () => {
      // This is a simple integration test that ensures the function works
      // The actual result depends on whether git-utils is installed globally
      const result = await getPerformanceStatus();
      
      expect(typeof result).toBe('string');
      expect(result).toMatch(/Using (global git-utils binary \(fast\)|npx \(slower startup due to package resolution\))/);
    });
  });
});