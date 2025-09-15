import { getGitBranches, GitBranch } from '../core/git/branches.js';
import { interactiveList } from '../core/ui/interactive-list.js';

export const selectBranch = async (): Promise<GitBranch | null> => {
  const branches = await getGitBranches();
  if (branches.length === 0) {
    console.log('No branches found!');
    return null;
  }

  const selectedBranch = await interactiveList<GitBranch>(
    branches,
    (branch: GitBranch) => `${branch.date} - ${branch.name}`
  );
  return selectedBranch;
};
