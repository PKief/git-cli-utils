import { gitExecutor } from '../../../../core/git/executor.js';
import { green } from '../../../ui/ansi.js';
import { createSpinner } from '../../../utils/spinner.js';
import { writeLine } from '../../../utils/terminal.js';

/**
 * Sync (pull) from a remote branch into the current branch
 */
export async function syncFromRemoteBranch(
  remoteName: string,
  branchName: string
): Promise<void> {
  const spinner = createSpinner();

  try {
    // Get current branch name first
    const currentBranchResult = await gitExecutor.executeCommand(
      'git branch --show-current'
    );
    const currentBranch = currentBranchResult.stdout.trim();

    if (!currentBranch) {
      throw new Error('Could not determine current branch');
    }

    // Perform the pull operation with spinner
    spinner.start(`Pulling from ${remoteName}/${branchName}...`);

    const pullResult = await gitExecutor.executeCommand(
      `git pull ${remoteName} ${branchName}`
    );

    spinner.stop(
      green(
        `Successfully pulled changes from ${remoteName}/${branchName} into ${currentBranch}`
      )
    );

    // Display the result details after spinner stops
    if (pullResult.stdout) {
      writeLine(pullResult.stdout);
    }

    if (pullResult.stderr) {
      writeLine(pullResult.stderr);
    }
  } catch (error) {
    spinner.fail(`Failed to sync from ${remoteName}/${branchName}`);
    throw new Error(
      `Failed to sync from ${remoteName}/${branchName}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
