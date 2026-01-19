import { existsSync } from 'node:fs';
import {
  lstat,
  mkdir,
  readdir,
  rmdir,
  symlink,
  unlink,
} from 'node:fs/promises';
import { platform } from 'node:os';
import { dirname, join } from 'node:path';
import { GitExecutor } from './executor.js';

export interface IgnoredPath {
  relativePath: string;
  isDirectory: boolean;
}

/**
 * Get list of git-ignored files and directories in the repository
 */
export async function getIgnoredPaths(
  repoRoot: string
): Promise<IgnoredPath[]> {
  const executor = GitExecutor.getInstance();

  try {
    // Use --directory to get directories as single entries instead of their contents
    // --others shows untracked files, --ignored shows only ignored ones
    const result = await executor.executeCommand(
      'git ls-files --others --ignored --exclude-standard --directory',
      { cwd: repoRoot }
    );

    if (!result.stdout.trim()) {
      return [];
    }

    const paths = result.stdout
      .split('\n')
      .filter((line) => line.trim().length > 0);

    const ignoredPaths: IgnoredPath[] = [];

    for (const p of paths) {
      const isDir = p.endsWith('/');
      const cleanPath = p.replace(/\/$/, ''); // Remove trailing slash

      // Skip nested paths - we only want top-level ignored items
      // e.g., if we have node_modules/, we don't need node_modules/express/
      if (cleanPath.includes('/')) {
        continue;
      }

      ignoredPaths.push({
        relativePath: cleanPath,
        isDirectory: isDir,
      });
    }

    return ignoredPaths;
  } catch {
    // If command fails, return empty array
    return [];
  }
}

/**
 * Filter ignored paths by patterns (supports wildcards like .env.*)
 */
export function filterByPatterns(
  paths: IgnoredPath[],
  patterns: string[]
): IgnoredPath[] {
  return paths.filter((item) => {
    return patterns.some((pattern) =>
      matchesPattern(item.relativePath, pattern)
    );
  });
}

/**
 * Check if a path matches a pattern (supports * wildcard)
 */
function matchesPattern(path: string, pattern: string): boolean {
  if (!pattern.includes('*')) {
    return path === pattern;
  }

  // Convert glob pattern to regex
  const regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special regex chars except *
    .replace(/\*/g, '.*'); // Convert * to .*

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(path);
}

export interface SymlinkResult {
  path: string;
  success: boolean;
  error?: string;
}

/**
 * Create a symlink with cross-platform compatibility
 * On Windows: uses 'junction' for directories (no admin required), 'file' for files
 * On Unix: uses regular symlinks
 */
export async function createCrossplatformSymlink(
  source: string,
  target: string,
  isDirectory: boolean
): Promise<void> {
  const isWindows = platform() === 'win32';

  // Ensure parent directory exists
  const parentDir = dirname(target);
  if (!existsSync(parentDir)) {
    await mkdir(parentDir, { recursive: true });
  }

  if (isWindows && isDirectory) {
    // Use junction for directories on Windows - doesn't require admin privileges
    await symlink(source, target, 'junction');
  } else if (isWindows) {
    // Use file symlink for files on Windows
    await symlink(source, target, 'file');
  } else {
    // Unix-like systems - use regular symlink
    await symlink(source, target);
  }
}

/**
 * Create symlinks for specified ignored paths from source repo to worktree
 */
export async function createSymlinksForIgnored(
  sourceRepo: string,
  worktreePath: string,
  pathsToSymlink: IgnoredPath[]
): Promise<SymlinkResult[]> {
  const results: SymlinkResult[] = [];

  for (const item of pathsToSymlink) {
    const sourcePath = join(sourceRepo, item.relativePath);
    const targetPath = join(worktreePath, item.relativePath);

    try {
      // Verify source exists
      const stat = await lstat(sourcePath);
      const isDir = stat.isDirectory();

      // Check if target already exists
      if (existsSync(targetPath)) {
        results.push({
          path: item.relativePath,
          success: false,
          error: 'Target already exists',
        });
        continue;
      }

      await createCrossplatformSymlink(sourcePath, targetPath, isDir);

      results.push({
        path: item.relativePath,
        success: true,
      });
    } catch (error) {
      results.push({
        path: item.relativePath,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}

export interface FoundSymlink {
  path: string;
  target: string;
  isDirectory: boolean;
}

/**
 * Find all symlinks in the root of a directory (non-recursive, top-level only)
 */
export async function findSymlinksInDirectory(
  directoryPath: string
): Promise<FoundSymlink[]> {
  const symlinks: FoundSymlink[] = [];

  if (!existsSync(directoryPath)) {
    return symlinks;
  }

  try {
    const entries = await readdir(directoryPath);

    for (const entry of entries) {
      const fullPath = join(directoryPath, entry);

      try {
        const stat = await lstat(fullPath);

        if (stat.isSymbolicLink()) {
          // For junctions on Windows, isSymbolicLink() returns true
          // We need to check what the symlink points to
          const { readlink } = await import('node:fs/promises');
          const target = await readlink(fullPath);

          symlinks.push({
            path: fullPath,
            target,
            isDirectory: stat.isDirectory(),
          });
        }
      } catch {
        // Skip entries we can't stat
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }

  return symlinks;
}

/**
 * Remove all symlinks in a directory without affecting their targets.
 * This should be called before removing a worktree to protect symlinked files.
 * Returns the list of removed symlink paths.
 */
export async function removeSymlinksInDirectory(
  directoryPath: string
): Promise<string[]> {
  const removed: string[] = [];
  const symlinks = await findSymlinksInDirectory(directoryPath);

  for (const symlink of symlinks) {
    try {
      const isWindows = platform() === 'win32';

      if (isWindows) {
        // On Windows, junctions need special handling
        // For junctions (directory symlinks), we use rmdir
        // For file symlinks, we use unlink
        const stat = await lstat(symlink.path);

        if (stat.isDirectory()) {
          // Junction - use rmdir (doesn't follow the junction)
          await rmdir(symlink.path);
        } else {
          // File symlink
          await unlink(symlink.path);
        }
      } else {
        // On Unix, unlink works for both file and directory symlinks
        await unlink(symlink.path);
      }

      removed.push(symlink.path);
    } catch {
      // Failed to remove symlink - continue with others
    }
  }

  return removed;
}
