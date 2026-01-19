import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { platform, tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createCrossplatformSymlink,
  createSymlinksForIgnored,
  filterByPatterns,
  findSymlinksInDirectory,
  type IgnoredPath,
  removeSymlinksInDirectory,
} from './worktree-symlinks.js';

describe('Worktree Symlinks', () => {
  let testDir: string;
  let sourceDir: string;
  let targetDir: string;

  beforeEach(() => {
    // Create unique test directories
    const uniqueId =
      Date.now().toString(36) + Math.random().toString(36).slice(2);
    testDir = join(tmpdir(), `worktree-symlinks-test-${uniqueId}`);
    sourceDir = join(testDir, 'source');
    targetDir = join(testDir, 'target');

    mkdirSync(sourceDir, { recursive: true });
    mkdirSync(targetDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up test directories
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('filterByPatterns', () => {
    it('should filter paths by exact match', () => {
      const paths: IgnoredPath[] = [
        { relativePath: 'node_modules', isDirectory: true },
        { relativePath: '.env', isDirectory: false },
        { relativePath: 'dist', isDirectory: true },
      ];

      const result = filterByPatterns(paths, ['node_modules', '.env']);

      expect(result).toHaveLength(2);
      expect(result.map((p) => p.relativePath)).toContain('node_modules');
      expect(result.map((p) => p.relativePath)).toContain('.env');
    });

    it('should filter paths by wildcard pattern', () => {
      const paths: IgnoredPath[] = [
        { relativePath: '.env', isDirectory: false },
        { relativePath: '.env.local', isDirectory: false },
        { relativePath: '.env.production', isDirectory: false },
        { relativePath: 'config.json', isDirectory: false },
      ];

      const result = filterByPatterns(paths, ['.env.*']);

      expect(result).toHaveLength(2);
      expect(result.map((p) => p.relativePath)).toContain('.env.local');
      expect(result.map((p) => p.relativePath)).toContain('.env.production');
      expect(result.map((p) => p.relativePath)).not.toContain('.env');
    });

    it('should handle multiple patterns including wildcards', () => {
      const paths: IgnoredPath[] = [
        { relativePath: 'node_modules', isDirectory: true },
        { relativePath: '.env', isDirectory: false },
        { relativePath: '.env.local', isDirectory: false },
        { relativePath: 'dist', isDirectory: true },
        { relativePath: 'coverage', isDirectory: true },
      ];

      const result = filterByPatterns(paths, [
        'node_modules',
        '.env',
        '.env.*',
      ]);

      expect(result).toHaveLength(3);
      expect(result.map((p) => p.relativePath)).toContain('node_modules');
      expect(result.map((p) => p.relativePath)).toContain('.env');
      expect(result.map((p) => p.relativePath)).toContain('.env.local');
    });

    it('should return empty array when no patterns match', () => {
      const paths: IgnoredPath[] = [
        { relativePath: 'src', isDirectory: true },
        { relativePath: 'index.ts', isDirectory: false },
      ];

      const result = filterByPatterns(paths, ['node_modules', '.env']);

      expect(result).toHaveLength(0);
    });

    it('should handle empty patterns array', () => {
      const paths: IgnoredPath[] = [
        { relativePath: 'node_modules', isDirectory: true },
      ];

      const result = filterByPatterns(paths, []);

      expect(result).toHaveLength(0);
    });

    it('should handle empty paths array', () => {
      const result = filterByPatterns([], ['node_modules']);

      expect(result).toHaveLength(0);
    });

    it('should match patterns with special regex characters', () => {
      const paths: IgnoredPath[] = [
        { relativePath: '.env.local', isDirectory: false },
        { relativePath: 'envlocal', isDirectory: false },
      ];

      // The dot should be treated literally, not as regex "any char"
      const result = filterByPatterns(paths, ['.env.local']);

      expect(result).toHaveLength(1);
      expect(result[0].relativePath).toBe('.env.local');
    });
  });

  describe('createCrossplatformSymlink', () => {
    it('should create symlink for a directory (junction on Windows)', async () => {
      const sourceSubDir = join(sourceDir, 'subdir');
      const targetSubDir = join(targetDir, 'subdir');

      mkdirSync(sourceSubDir);
      writeFileSync(join(sourceSubDir, 'file.txt'), 'content');

      await createCrossplatformSymlink(sourceSubDir, targetSubDir, true);

      expect(existsSync(targetSubDir)).toBe(true);
      // On Windows, junctions appear as directories, not symlinks to lstat
      const stat = lstatSync(targetSubDir);
      expect(stat.isSymbolicLink() || stat.isDirectory()).toBe(true);
    });

    it('should create parent directories if needed for directory symlinks', async () => {
      const sourceSubDir = join(sourceDir, 'subdir');
      const targetSubDir = join(targetDir, 'nested', 'deep', 'subdir');

      mkdirSync(sourceSubDir);

      await createCrossplatformSymlink(sourceSubDir, targetSubDir, true);

      expect(existsSync(targetSubDir)).toBe(true);
    });
  });

  describe('createSymlinksForIgnored', () => {
    it('should create symlinks for directory paths', async () => {
      // Create source directory
      const nodeModules = join(sourceDir, 'node_modules');
      mkdirSync(nodeModules);
      writeFileSync(join(nodeModules, 'package.json'), '{}');

      const pathsToSymlink: IgnoredPath[] = [
        { relativePath: 'node_modules', isDirectory: true },
      ];

      const results = await createSymlinksForIgnored(
        sourceDir,
        targetDir,
        pathsToSymlink
      );

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(existsSync(join(targetDir, 'node_modules'))).toBe(true);
    });

    it('should report failure when source does not exist', async () => {
      const pathsToSymlink: IgnoredPath[] = [
        { relativePath: 'nonexistent', isDirectory: true },
      ];

      const results = await createSymlinksForIgnored(
        sourceDir,
        targetDir,
        pathsToSymlink
      );

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBeDefined();
    });

    it('should report failure when target already exists', async () => {
      const sourceFile = join(sourceDir, 'existing');
      const targetFile = join(targetDir, 'existing');

      mkdirSync(sourceFile);
      mkdirSync(targetFile);

      const pathsToSymlink: IgnoredPath[] = [
        { relativePath: 'existing', isDirectory: true },
      ];

      const results = await createSymlinksForIgnored(
        sourceDir,
        targetDir,
        pathsToSymlink
      );

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('already exists');
    });

    it('should handle empty paths array', async () => {
      const results = await createSymlinksForIgnored(sourceDir, targetDir, []);

      expect(results).toHaveLength(0);
    });

    it('should handle multiple directory paths', async () => {
      // Create source directories
      const dir1 = join(sourceDir, 'node_modules');
      const dir2 = join(sourceDir, 'dist');
      mkdirSync(dir1);
      mkdirSync(dir2);

      const pathsToSymlink: IgnoredPath[] = [
        { relativePath: 'node_modules', isDirectory: true },
        { relativePath: 'dist', isDirectory: true },
      ];

      const results = await createSymlinksForIgnored(
        sourceDir,
        targetDir,
        pathsToSymlink
      );

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.success)).toBe(true);
      expect(existsSync(join(targetDir, 'node_modules'))).toBe(true);
      expect(existsSync(join(targetDir, 'dist'))).toBe(true);
    });
  });

  describe('findSymlinksInDirectory', () => {
    it('should find directory symlinks/junctions', async () => {
      // Create a real directory and a junction/symlink to it
      const realDir = join(sourceDir, 'realdir');
      mkdirSync(realDir);
      writeFileSync(join(realDir, 'file.txt'), 'content');

      const symlink = join(targetDir, 'linked-dir');
      if (platform() === 'win32') {
        symlinkSync(realDir, symlink, 'junction');
      } else {
        symlinkSync(realDir, symlink);
      }

      const symlinks = await findSymlinksInDirectory(targetDir);

      expect(symlinks).toHaveLength(1);
      expect(symlinks[0].path).toBe(symlink);
    });

    it('should return empty array for directory with no symlinks', async () => {
      writeFileSync(join(targetDir, 'regular.txt'), 'content');
      mkdirSync(join(targetDir, 'subdir'));

      const symlinks = await findSymlinksInDirectory(targetDir);

      expect(symlinks).toHaveLength(0);
    });

    it('should return empty array for non-existent directory', async () => {
      const symlinks = await findSymlinksInDirectory('/nonexistent/path');

      expect(symlinks).toHaveLength(0);
    });

    it('should find multiple directory symlinks/junctions', async () => {
      // Create source directories
      const dir1 = join(sourceDir, 'dir1');
      const dir2 = join(sourceDir, 'dir2');
      mkdirSync(dir1);
      mkdirSync(dir2);

      // Create symlinks/junctions in target
      const link1 = join(targetDir, 'link1');
      const link2 = join(targetDir, 'link2');
      if (platform() === 'win32') {
        symlinkSync(dir1, link1, 'junction');
        symlinkSync(dir2, link2, 'junction');
      } else {
        symlinkSync(dir1, link1);
        symlinkSync(dir2, link2);
      }

      // Also add a regular directory
      mkdirSync(join(targetDir, 'regular'));

      const symlinks = await findSymlinksInDirectory(targetDir);

      expect(symlinks).toHaveLength(2);
    });
  });

  describe('removeSymlinksInDirectory', () => {
    it('should remove directory symlinks/junctions without affecting targets', async () => {
      // Create source directory
      const sourceSubDir = join(sourceDir, 'subdir');
      mkdirSync(sourceSubDir);
      writeFileSync(join(sourceSubDir, 'file.txt'), 'content');

      // Create directory symlink/junction
      const targetSymlink = join(targetDir, 'linked-dir');
      if (platform() === 'win32') {
        symlinkSync(sourceSubDir, targetSymlink, 'junction');
      } else {
        symlinkSync(sourceSubDir, targetSymlink);
      }

      expect(existsSync(targetSymlink)).toBe(true);

      // Remove symlinks
      const removed = await removeSymlinksInDirectory(targetDir);

      expect(removed).toHaveLength(1);
      expect(existsSync(targetSymlink)).toBe(false);
      // Source directory should still exist
      expect(existsSync(sourceSubDir)).toBe(true);
      expect(existsSync(join(sourceSubDir, 'file.txt'))).toBe(true);
    });

    it('should not affect regular files', async () => {
      const regularFile = join(targetDir, 'regular.txt');
      writeFileSync(regularFile, 'content');

      const removed = await removeSymlinksInDirectory(targetDir);

      expect(removed).toHaveLength(0);
      expect(existsSync(regularFile)).toBe(true);
    });

    it('should not affect regular directories', async () => {
      const regularDir = join(targetDir, 'regular-dir');
      mkdirSync(regularDir);
      writeFileSync(join(regularDir, 'file.txt'), 'content');

      const removed = await removeSymlinksInDirectory(targetDir);

      expect(removed).toHaveLength(0);
      expect(existsSync(regularDir)).toBe(true);
      expect(existsSync(join(regularDir, 'file.txt'))).toBe(true);
    });

    it('should handle directory with mixed content including junctions', async () => {
      // Create source directory
      const sourceSubDir = join(sourceDir, 'subdir');
      mkdirSync(sourceSubDir);

      // Create regular file in target
      const regularFile = join(targetDir, 'regular.txt');
      writeFileSync(regularFile, 'regular');

      // Create regular subdirectory
      mkdirSync(join(targetDir, 'realsubdir'));

      // Create directory symlink/junction
      const symlink = join(targetDir, 'linked-dir');
      if (platform() === 'win32') {
        symlinkSync(sourceSubDir, symlink, 'junction');
      } else {
        symlinkSync(sourceSubDir, symlink);
      }

      const removed = await removeSymlinksInDirectory(targetDir);

      expect(removed).toHaveLength(1);
      expect(existsSync(symlink)).toBe(false);
      expect(existsSync(regularFile)).toBe(true);
      expect(existsSync(join(targetDir, 'realsubdir'))).toBe(true);
    });

    it('should return empty array for non-existent directory', async () => {
      const removed = await removeSymlinksInDirectory('/nonexistent/path');

      expect(removed).toHaveLength(0);
    });

    it('should remove multiple symlinks/junctions', async () => {
      // Create source directories
      const dir1 = join(sourceDir, 'dir1');
      const dir2 = join(sourceDir, 'dir2');
      mkdirSync(dir1);
      mkdirSync(dir2);
      writeFileSync(join(dir1, 'file.txt'), 'content1');
      writeFileSync(join(dir2, 'file.txt'), 'content2');

      // Create symlinks/junctions
      const link1 = join(targetDir, 'link1');
      const link2 = join(targetDir, 'link2');
      if (platform() === 'win32') {
        symlinkSync(dir1, link1, 'junction');
        symlinkSync(dir2, link2, 'junction');
      } else {
        symlinkSync(dir1, link1);
        symlinkSync(dir2, link2);
      }

      const removed = await removeSymlinksInDirectory(targetDir);

      expect(removed).toHaveLength(2);
      expect(existsSync(link1)).toBe(false);
      expect(existsSync(link2)).toBe(false);
      // Source directories should still exist
      expect(existsSync(dir1)).toBe(true);
      expect(existsSync(dir2)).toBe(true);
    });
  });
});
