import { getGitBranches, GitBranch } from '../../core/git/branches.js';
import { interactiveList } from '../../core/ui/interactive-list.js';
import { GitOperations } from '../../core/git/operations.js';
import ANSI from '../../core/ui/ansi.js';

export const searchBranches = async () => {
  try {
    const branches = await getGitBranches();
    
    if (branches.length === 0) {
      console.log(`${ANSI.YELLOW}No branches found!${ANSI.RESET}`);
      process.exit(0);
    }

    const selectedBranch = await interactiveList<GitBranch>(
      branches, 
      (branch: GitBranch) => `${branch.date} - ${branch.name}`,
      (branch: GitBranch) => branch.name  // Only search branch names, not dates
    );
    
    if (selectedBranch) {
      console.log(`\nSelected branch: ${selectedBranch.name}`);
      
      try {
        await GitOperations.checkoutBranch(selectedBranch.name);
        console.log(`${ANSI.GREEN}Successfully checked out branch '${selectedBranch.name}'${ANSI.RESET}`);
        process.exit(0);
      } catch (error) {
        console.error(`${ANSI.RED}Error checking out branch: ${error instanceof Error ? error.message : String(error)}${ANSI.RESET}`);
        process.exit(1);
      }
    } else {
      console.log(`${ANSI.YELLOW}No branch selected.${ANSI.RESET}`);
      process.exit(0);
    }
  } catch (error) {
    console.error(`${ANSI.RED}Error fetching branches: ${error instanceof Error ? error.message : String(error)}${ANSI.RESET}`);
    process.exit(1);
  }
};