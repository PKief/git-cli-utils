import { gitExecutor } from './executor.js';

export interface GitBranch {
  name: string;
  date: string | undefined;
  current: boolean;
  upstream?: string; // e.g., "origin/main" or undefined if not tracking
}

export async function getGitBranches(): Promise<GitBranch[]> {
  try {
    // Get current branch name
    const currentBranchResult = await gitExecutor.executeCommand(
      'git rev-parse --abbrev-ref HEAD'
    );
    const currentBranchName = currentBranchResult.stdout.trim();

    const command =
      'git branch --sort=-committerdate --format=%(refname:short)|%(committerdate:relative)|%(upstream:short) --list';
    const result = await gitExecutor.executeStreamingCommand(command);

    const branches = result.data
      .filter((branch) => branch.trim() !== '')
      .map((branch) => {
        const parts = branch.trim().split('|');
        const [name, date] = parts;
        const upstream = parts[2] || undefined; // Empty string becomes undefined
        return {
          name,
          date,
          current: name === currentBranchName,
          upstream: upstream || undefined, // Ensure empty strings become undefined
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
    throw new Error(
      `Error executing git command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export function filterBranches(
  branches: GitBranch[],
  searchTerm: string
): GitBranch[] {
  const normalizedSearchTerm = searchTerm.toLowerCase();
  return branches.filter((branch) =>
    branch.name.toLowerCase().includes(normalizedSearchTerm)
  );
}
