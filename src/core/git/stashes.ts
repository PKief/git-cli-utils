import { getErrorMessage, simpleFilter } from '../utils.js';
import { gitExecutor } from './executor.js';

export interface GitStash {
  index: number;
  branch: string;
  message: string;
  hash: string;
  date: string;
}

/**
 * Get all git stashes
 */
export const getGitStashes = async (): Promise<GitStash[]> => {
  try {
    const result = await gitExecutor.executeCommand(
      'git stash list --pretty=format:"%gD|%gd|%H|%cr|%s"'
    );

    if (!result.stdout.trim()) {
      return [];
    }

    const stashes: GitStash[] = [];
    const lines = result.stdout.split('\n').filter((line) => line.trim());

    lines.forEach((line) => {
      const parts = line.split('|');
      if (parts.length >= 5) {
        const [indexRef, description, hash, date, message] = parts;

        // Extract index number from "stash@{0}"
        const indexMatch = indexRef.match(/stash@\{(\d+)\}/);
        const index = indexMatch ? parseInt(indexMatch[1]) : 0;

        // Extract branch from "WIP on branch-name:" or "On branch-name:" in message or description
        const messageBranchMatch = message.match(/(?:WIP )?on ([^:]+):/i);
        const descriptionBranchMatch =
          description.match(/(?:WIP )?on ([^:]+):/i);
        const branch = messageBranchMatch
          ? messageBranchMatch[1]
          : descriptionBranchMatch
            ? descriptionBranchMatch[1]
            : 'unknown';

        stashes.push({
          index,
          branch,
          message: message || description,
          hash: hash.substring(0, 7), // Short hash
          date,
        });
      }
    });

    return stashes;
  } catch (error) {
    throw new Error(`Failed to get git stashes: ${getErrorMessage(error)}`);
  }
};

/**
 * Filter stashes by search term
 */
export const filterStashes = (
  stashes: GitStash[],
  searchTerm: string
): GitStash[] => {
  return simpleFilter(
    stashes,
    searchTerm,
    (stash) => `${stash.message} ${stash.branch} ${stash.hash}`
  );
};
