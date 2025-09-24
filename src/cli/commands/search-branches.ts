import { GitBranch, getGitBranches } from '@core/git/branches.js';
import { GitOperations } from '@core/git/operations.js';
import ANSI from '../ui/ansi.js';
import { interactiveList } from '../ui/interactive-list.js';

export const searchBranches = async () => {
  try {
    const branches = await getGitBranches();

    if (branches.length === 0) {
      console.log(`${ANSI.yellow}No branches found!${ANSI.reset}`);
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
          `${ANSI.green}Successfully checked out branch '${selectedBranch.name}'${ANSI.reset}`
        );
        process.exit(0);
      } catch (error) {
        console.error(
          `${ANSI.red}Error checking out branch: ${error instanceof Error ? error.message : String(error)}${ANSI.reset}`
        );
        process.exit(1);
      }
    } else {
      console.log(`${ANSI.yellow}No branch selected.${ANSI.reset}`);
      process.exit(0);
    }
  } catch (error) {
    console.error(
      `${ANSI.red}Error fetching branches: ${error instanceof Error ? error.message : String(error)}${ANSI.reset}`
    );
    process.exit(1);
  }
};
