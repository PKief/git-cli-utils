import { gitExecutor } from './executor.js';

/**
 * Represents a Git remote repository
 */
export interface GitRemote {
  name: string;
  url: string;
  type: 'fetch' | 'push';
}

/**
 * Represents a branch from a remote repository
 */
export interface GitRemoteBranch {
  name: string;
  fullName: string; // e.g., "origin/main"
  lastCommit: string;
  lastCommitDate: string;
}

/**
 * Get all configured git remotes
 */
export async function getGitRemotes(): Promise<GitRemote[]> {
  try {
    const result = await gitExecutor.executeCommand('git remote -v');

    if (!result.stdout) {
      return [];
    }

    const lines = result.stdout.split('\n').filter((line) => line.trim());
    const remotesMap = new Map<string, GitRemote>();

    for (const line of lines) {
      const match = line.match(/^(\S+)\s+(\S+)\s+\((fetch|push)\)$/);
      if (match) {
        const [, name, url, type] = match;

        // We'll prefer fetch URLs, but include push URLs if no fetch URL is available
        if (type === 'fetch' || !remotesMap.has(name)) {
          remotesMap.set(name, {
            name,
            url,
            type: type as 'fetch' | 'push',
          });
        }
      }
    }

    return Array.from(remotesMap.values());
  } catch (error) {
    throw new Error(
      `Failed to fetch git remotes: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get branches from a specific remote
 */
export async function getRemoteBranches(
  remoteName: string
): Promise<GitRemoteBranch[]> {
  try {
    // First, fetch the latest refs from the remote
    await gitExecutor.executeCommand(`git fetch ${remoteName}`);

    // Get remote branches with their commit info
    const result = await gitExecutor.executeCommand(
      `git for-each-ref --format='%(refname:short)|%(objectname:short)|%(committerdate:iso)' refs/remotes/${remoteName}`
    );

    if (!result.stdout) {
      return [];
    }

    const lines = result.stdout.split('\n').filter((line) => line.trim());
    const branches: GitRemoteBranch[] = [];

    for (const line of lines) {
      const parts = line.split('|');
      if (parts.length === 3) {
        const [fullName, commitHash, commitDate] = parts;
        const name = fullName.replace(`${remoteName}/`, '');

        // Skip HEAD reference
        if (name === 'HEAD') {
          continue;
        }

        branches.push({
          name,
          fullName,
          lastCommit: commitHash,
          lastCommitDate: commitDate,
        });
      }
    }

    return branches;
  } catch (error) {
    throw new Error(
      `Failed to fetch branches from remote '${remoteName}': ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
