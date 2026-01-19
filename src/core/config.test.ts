import { describe, expect, it } from 'bun:test';
import {
  getWorktreeSymlinkConfig,
  loadConfig,
  saveConfig,
  setWorktreeSymlinkConfig,
  type WorktreeSymlinkConfig,
} from './config.js';

describe('Worktree Symlink Config', () => {
  // We'll test the config functions using the actual config file
  // since the config module uses a fixed path

  describe('getWorktreeSymlinkConfig', () => {
    it('should return default config when no config exists', () => {
      // Clear any existing worktree config
      const current = loadConfig();
      delete current.worktreeSymlinks;
      saveConfig(current);

      const config = getWorktreeSymlinkConfig();

      expect(config.mode).toBe('selective');
      expect(config.defaultPatterns).toContain('node_modules');
      expect(config.defaultPatterns).toContain('.env');
      expect(config.defaultPatterns).toContain('.env.*');
    });

    it('should return stored config when set', () => {
      const testConfig: WorktreeSymlinkConfig = {
        mode: 'plain',
        defaultPatterns: ['custom_folder', '.secret'],
      };

      setWorktreeSymlinkConfig(testConfig);
      const retrieved = getWorktreeSymlinkConfig();

      expect(retrieved.mode).toBe('plain');
      expect(retrieved.defaultPatterns).toEqual(['custom_folder', '.secret']);
    });

    it('should handle backward compatibility with legacy enabled field', () => {
      // Simulate legacy config with 'enabled' instead of 'mode'
      const current = loadConfig();
      (current as Record<string, unknown>).worktreeSymlinks = {
        enabled: true,
        defaultPatterns: ['legacy_pattern'],
      };
      saveConfig(current);

      const config = getWorktreeSymlinkConfig();

      expect(config.mode).toBe('selective');
      expect(config.defaultPatterns).toEqual(['legacy_pattern']);
    });

    it('should convert legacy enabled=false to mode=plain', () => {
      // Simulate legacy config with enabled: false
      const current = loadConfig();
      (current as Record<string, unknown>).worktreeSymlinks = {
        enabled: false,
        defaultPatterns: ['some_pattern'],
      };
      saveConfig(current);

      const config = getWorktreeSymlinkConfig();

      expect(config.mode).toBe('plain');
      expect(config.defaultPatterns).toEqual(['some_pattern']);
    });
  });

  describe('setWorktreeSymlinkConfig', () => {
    it('should save and return the config', () => {
      const testConfig: WorktreeSymlinkConfig = {
        mode: 'selective',
        defaultPatterns: ['node_modules', '.env', 'dist'],
      };

      const returned = setWorktreeSymlinkConfig(testConfig);

      expect(returned).toEqual(testConfig);

      // Verify it was persisted
      const retrieved = getWorktreeSymlinkConfig();
      expect(retrieved).toEqual(testConfig);
    });

    it('should overwrite existing config', () => {
      // Set initial config
      setWorktreeSymlinkConfig({
        mode: 'selective',
        defaultPatterns: ['initial'],
      });

      // Overwrite with new config
      setWorktreeSymlinkConfig({
        mode: 'plain',
        defaultPatterns: ['updated'],
      });

      const retrieved = getWorktreeSymlinkConfig();
      expect(retrieved.mode).toBe('plain');
      expect(retrieved.defaultPatterns).toEqual(['updated']);
    });
  });

  describe('mode values', () => {
    it('should accept selective mode', () => {
      setWorktreeSymlinkConfig({
        mode: 'selective',
        defaultPatterns: ['test'],
      });

      const config = getWorktreeSymlinkConfig();
      expect(config.mode).toBe('selective');
    });

    it('should accept plain mode', () => {
      setWorktreeSymlinkConfig({
        mode: 'plain',
        defaultPatterns: ['test'],
      });

      const config = getWorktreeSymlinkConfig();
      expect(config.mode).toBe('plain');
    });
  });

  describe('defaultPatterns', () => {
    it('should preserve empty patterns array', () => {
      setWorktreeSymlinkConfig({
        mode: 'selective',
        defaultPatterns: [],
      });

      const config = getWorktreeSymlinkConfig();
      expect(config.defaultPatterns).toEqual([]);
    });

    it('should handle patterns with wildcards', () => {
      const patterns = ['.env.*', '*.local', 'temp_*'];
      setWorktreeSymlinkConfig({
        mode: 'selective',
        defaultPatterns: patterns,
      });

      const config = getWorktreeSymlinkConfig();
      expect(config.defaultPatterns).toEqual(patterns);
    });
  });
});
