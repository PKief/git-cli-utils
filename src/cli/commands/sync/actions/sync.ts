import { gitExecutor } from '../../../../core/git/executor.js';
import { green, yellow } from '../../../ui/ansi.js';
import { writeLine } from '../../../utils/terminal.js';

/**
 * Sync (pull) from a remote branch into the current branch
 */
export async function syncFromRemoteBranch(
  remoteName: string,
  branchName: string
): Promise<void> {
  try {
    writeLine(yellow(`Syncing from ${remoteName}/${branchName}...`));

    // Get current branch name first
    const currentBranchResult = await gitExecutor.executeCommand(
      'git branch --show-current'
    );
    const currentBranch = currentBranchResult.stdout.trim();

    if (!currentBranch) {
      throw new Error('Could not determine current branch');
    }

    writeLine(`Current branch: ${currentBranch}`);
    writeLine(`Pulling from: ${remoteName}/${branchName}`);

    // Perform the pull operation
    const pullResult = await gitExecutor.executeCommand(
      `git pull ${remoteName} ${branchName}`
    );

    // Display the result
    if (pullResult.stdout) {
      writeLine(pullResult.stdout);
    }

    if (pullResult.stderr) {
      writeLine(pullResult.stderr);
    }

    writeLine(
      green(
        `Successfully pulled changes from ${remoteName}/${branchName} into ${currentBranch}`
      )
    );
  } catch (error) {
    throw new Error(
      `Failed to sync from ${remoteName}/${branchName}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
