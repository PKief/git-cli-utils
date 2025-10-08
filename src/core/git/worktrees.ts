import path from 'node:path';
import { GitExecutor } from './executor.js';

export interface GitWorktree {
  path: string;
  branch: string;
  commit: string;
  isMain: boolean;
}

/**
 * Get list of existing git worktrees
 */
export async function getGitWorktrees(): Promise<GitWorktree[]> {
  const executor = GitExecutor.getInstance();

  try {
    const result = await executor.executeCommand(
      'git worktree list --porcelain'
    );
    return parseWorktreeList(result.stdout);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('not a git repository')
    ) {
      throw new Error('Not in a git repository');
    }
    throw new Error(
      `Failed to list worktrees: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Parse git worktree list output
 */
function parseWorktreeList(output: string): GitWorktree[] {
  const worktrees: GitWorktree[] = [];
  const lines = output
    .trim()
    .split('\n')
    .filter((line) => line.trim().length > 0);

  let currentWorktree: Partial<GitWorktree> = {};

  for (const line of lines) {
    if (line.startsWith('worktree ')) {
      // Start of new worktree entry
      if (currentWorktree.path) {
        // Save previous worktree if it exists
        worktrees.push(currentWorktree as GitWorktree);
      }
      currentWorktree = {
        path: line.substring('worktree '.length),
        isMain: false,
      };
    } else if (line.startsWith('HEAD ')) {
      currentWorktree.commit = line.substring('HEAD '.length);
    } else if (line.startsWith('branch ')) {
      currentWorktree.branch = line.substring('branch refs/heads/'.length);
    } else if (line === 'bare') {
      // Bare repository, skip
      continue;
    } else if (line === 'detached') {
      currentWorktree.branch = 'HEAD (detached)';
    }
  }

  // Add the last worktree
  if (currentWorktree.path) {
    worktrees.push(currentWorktree as GitWorktree);
  }

  // Mark the main worktree
  if (worktrees.length > 0) {
    worktrees[0].isMain = true;
  }

  return worktrees;
}

/**
 * Create a new git worktree for a branch
 */
export async function createWorktree(
  branch: string,
  targetPath?: string
): Promise<string> {
  const executor = GitExecutor.getInstance();

  // Generate a path if not provided
  if (!targetPath) {
    const repoRoot = await getRepositoryRoot();
    const sanitizedBranch = branch.replace(/[^a-zA-Z0-9-_]/g, '-');
    targetPath = path.join(
      repoRoot,
      '..',
      `${path.basename(repoRoot)}-${sanitizedBranch}`
    );
  }

  try {
    // Check if worktree already exists for this branch
    const existingWorktrees = await getGitWorktrees();
    const existingWorktree = existingWorktrees.find(
      (wt) => wt.branch === branch
    );

    if (existingWorktree) {
      throw new Error(
        `Worktree already exists for branch '${branch}' at: ${existingWorktree.path}`
      );
    }

    // Create the worktree
    await executor.executeCommand(
      `git worktree add "${targetPath}" "${branch}"`
    );

    return targetPath;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        throw new Error(`Directory '${targetPath}' already exists`);
      }
      if (error.message.includes('is not a valid reference')) {
        throw new Error(`Branch '${branch}' does not exist`);
      }
    }
    throw new Error(
      `Failed to create worktree: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Create a new git worktree for a commit (detached HEAD)
 */
export async function createWorktreeFromCommit(
  commitHash: string,
  targetPath?: string
): Promise<string> {
  const executor = GitExecutor.getInstance();

  // Generate a path if not provided
  if (!targetPath) {
    const repoRoot = await getRepositoryRoot();
    const shortHash = commitHash.substring(0, 8);
    targetPath = path.join(
      repoRoot,
      '..',
      `${path.basename(repoRoot)}-${shortHash}`
    );
  }

  try {
    // Create the worktree with detached HEAD
    await executor.executeCommand(
      `git worktree add --detach "${targetPath}" "${commitHash}"`
    );

    return targetPath;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        throw new Error(`Directory '${targetPath}' already exists`);
      }
      if (error.message.includes('is not a valid reference')) {
        throw new Error(`Commit '${commitHash}' does not exist`);
      }
    }
    throw new Error(
      `Failed to create worktree: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get the root directory of the current git repository
 */
async function getRepositoryRoot(): Promise<string> {
  const executor = GitExecutor.getInstance();

  try {
    const result = await executor.executeCommand(
      'git rev-parse --show-toplevel'
    );
    return result.stdout.trim();
  } catch (error) {
    throw new Error(
      `Failed to get repository root: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Check if a worktree path is valid and doesn't conflict with existing worktrees
 */
export async function validateWorktreePath(
  targetPath: string
): Promise<boolean> {
  try {
    // Check if path already exists using Node.js fs
    const fs = await import('node:fs/promises');
    await fs.access(targetPath);
    return false; // Path exists
  } catch {
    return true; // Path doesn't exist, so it's valid
  }
}
