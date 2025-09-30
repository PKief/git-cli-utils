import { GitBranch, getGitBranches } from '../../core/git/branches.js';
import { GitOperations } from '../../core/git/operations.js';
import { green, red, yellow } from '../ui/ansi.js';
import { interactiveList } from '../ui/interactive-list.js';

export const searchBranches = async () => {
  try {
    const branches = await getGitBranches();

    if (branches.length === 0) {
      console.log(yellow('No branches found!'));
      process.exit(0);
    }

    const selectedBranch = await interactiveList<GitBranch>(
      branches,
      (branch: GitBranch) => `${branch.date} - ${branch.name}`,
      (branch: GitBranch) => branch.name // Only search branch names, not dates
    );

    if (selectedBranch) {
      console.log(`\nSelected branch: ${selectedBranch.name}`);

      try {
        await GitOperations.checkoutBranch(selectedBranch.name);
        console.log(
          green(`Successfully checked out branch '${selectedBranch.name}'`)
        );
        process.exit(0);
      } catch (error) {
        console.error(
          red(
            `Error checking out branch: ${error instanceof Error ? error.message : String(error)}`
          )
        );
        process.exit(1);
      }
    } else {
      console.log(yellow('No branch selected.'));
      process.exit(0);
    }
  } catch (error) {
    console.error(
      red(
        `Error fetching branches: ${error instanceof Error ? error.message : String(error)}`
      )
    );
    process.exit(1);
  }
};
