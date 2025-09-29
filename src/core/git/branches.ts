import { gitExecutor } from './executor.js';

export interface GitBranch {
  name: string;
  date: string | undefined;
}

export async function getGitBranches(): Promise<GitBranch[]> {
  try {
    const command =
      'git branch --sort=-committerdate --format="%(refname:short)|%(committerdate:relative)" --list';
    const result = await gitExecutor.executeCommand(command);

    const branches = result.stdout
      .split('\n')
      .filter((branch) => branch.trim() !== '')
      .map((branch) => {
        const [name, date] = branch.trim().split('|');
        return { name, date };
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
