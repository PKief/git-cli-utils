import { GitCommit } from '../../../../core/git/commits.js';
import { GitExecutor } from '../../../../core/git/executor.js';
import { green, red } from '../../../ui/ansi.js';
import {
  ActionResult,
  actionFailure,
  actionSuccess,
} from '../../../utils/action-helpers.js';
import { writeErrorLine, writeLine } from '../../../utils/terminal.js';

/**
 * Checkout commit action
 */
export async function checkoutCommit(
  commit: GitCommit
): Promise<ActionResult<GitCommit>> {
  try {
    const executor = GitExecutor.getInstance();
    await executor.executeCommand(`git checkout ${commit.hash}`);
    writeLine(green(`✓ Checked out '${commit.hash}'`));
    return actionSuccess(`Checked out commit`);
  } catch (error) {
    const errorMessage = `Checkout failed: ${error instanceof Error ? error.message : String(error)}`;
    writeErrorLine(red(`✗ ${errorMessage}`));
    return actionFailure(errorMessage);
  }
}
