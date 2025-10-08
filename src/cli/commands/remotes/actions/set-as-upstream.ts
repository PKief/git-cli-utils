import { GitRemoteBranch, gitExecutor } from '../../../../core/git/index.js';
import { green } from '../../../ui/ansi.js';
import { writeLine } from '../../../utils/terminal.js';

/**
 * Set a remote branch as upstream for the current local branch
 */
export async function setAsUpstream(branch: GitRemoteBranch): Promise<boolean> {
  try {
    // Get current branch name
    const currentBranchResult = await gitExecutor.executeCommand(
      'git branch --show-current'
    );
    const currentBranch = currentBranchResult.stdout.trim();

    if (!currentBranch) {
      throw new Error('Could not determine current branch');
    }

    // Execute git branch --set-upstream-to command
    await gitExecutor.executeCommand(
      `git branch --set-upstream-to=${branch.fullName} ${currentBranch}`
    );

    writeLine(
      green(
        `Successfully set '${branch.fullName}' as upstream for '${currentBranch}'`
      )
    );
    return true;
  } catch (error) {
    throw new Error(
      `Failed to set '${branch.fullName}' as upstream: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
