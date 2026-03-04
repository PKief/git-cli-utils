import { getErrorMessage, simpleFilter } from '../utils.js';
import { gitExecutor } from './executor.js';

export interface GitBranch {
  name: string;
  date: string | undefined;
  current: boolean;
}

export async function getGitBranches(): Promise<GitBranch[]> {
  try {
    // Get current branch name
    const currentBranchResult = await gitExecutor.executeCommand(
      'git rev-parse --abbrev-ref HEAD'
    );
    const currentBranchName = currentBranchResult.stdout.trim();

    const command =
      'git branch --sort=-committerdate --format=%(refname:short)|%(committerdate:relative) --list';
    const result = await gitExecutor.executeStreamingCommand(command);

    const branches = result.data
      .filter((branch) => branch.trim() !== '')
      .map((branch) => {
        const [name, date] = branch.trim().split('|');
        return {
          name,
          date,
          current: name === currentBranchName,
        };
      })
      .filter((branch) => {
        // Filter out detached HEAD states which are not valid branch names
        return (
          !branch.name.startsWith('(HEAD detached at ') &&
          !branch.name.startsWith('(HEAD detached from ') &&
          !branch.name.includes('detached HEAD')
        );
      });

    return branches;
  } catch (error) {
    throw new Error(`Error executing git command: ${getErrorMessage(error)}`);
  }
}

export function filterBranches(
  branches: GitBranch[],
  searchTerm: string
): GitBranch[] {
  return simpleFilter(branches, searchTerm, (branch) => branch.name);
}

/**
 * Get the default branch for a remote (e.g., main or master)
 * @param remoteName - The remote name (default: 'origin')
 * @returns The full remote branch reference (e.g., 'origin/main')
 */
export async function getDefaultBranch(
  remoteName: string = 'origin'
): Promise<string> {
  try {
    // Try to get the default branch from the remote's HEAD reference
    const result = await gitExecutor.executeCommand(
      `git symbolic-ref refs/remotes/${remoteName}/HEAD`
    );
    // Returns something like "refs/remotes/origin/main"
    const ref = result.stdout.trim();
    // Extract just "origin/main" from the full ref
    const match = ref.match(/refs\/remotes\/(.+)/);
    if (match) {
      return match[1];
    }
  } catch {
    // symbolic-ref failed, try fallback detection
  }

  // Fallback: check if origin/main or origin/master exists
  try {
    await gitExecutor.executeCommand(
      `git rev-parse --verify ${remoteName}/main`
    );
    return `${remoteName}/main`;
  } catch {
    // main doesn't exist
  }

  try {
    await gitExecutor.executeCommand(
      `git rev-parse --verify ${remoteName}/master`
    );
    return `${remoteName}/master`;
  } catch {
    // master doesn't exist either
  }

  throw new Error(
    `Could not determine default branch for remote '${remoteName}'`
  );
}
