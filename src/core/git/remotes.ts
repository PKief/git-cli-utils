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
  lastCommitDate: string; // Relative date format (e.g., "2 days ago")
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

    // Get all remote branches with commit info in a single command
    // Format: refname:short|objectname:short|committerdate:relative
    // Use executeStreamingCommand to avoid shell interpretation issues on Windows
    const result = await gitExecutor.executeStreamingCommand(
      `git for-each-ref --sort=-committerdate --format=%(refname:short)|%(objectname:short)|%(committerdate:relative) refs/remotes/${remoteName}`
    );

    if (!result.data || result.data.length === 0) {
      return [];
    }

    const branches: GitRemoteBranch[] = [];

    for (const line of result.data) {
      const parts = line.split('|');
      if (parts.length === 3) {
        const [fullRefName, commitHash, relativeDate] = parts;

        // Extract branch name from refs/remotes/origin/branch-name
        const name = fullRefName.replace(`${remoteName}/`, '');

        // Skip HEAD pointer and the remote itself (when it appears without a branch name)
        if (name === 'HEAD' || name === remoteName) continue;

        branches.push({
          name,
          fullName: fullRefName,
          lastCommit: commitHash,
          lastCommitDate: relativeDate,
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
