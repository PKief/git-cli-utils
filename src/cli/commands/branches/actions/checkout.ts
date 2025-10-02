import { GitBranch } from '../../../../core/git/branches.js';
import { GitOperations } from '../../../../core/git/operations.js';
import { green, red } from '../../../ui/ansi.js';
import {
  ActionResult,
  actionFailure,
  actionSuccess,
} from '../../../utils/action-helpers.js';
import { writeErrorLine, writeLine } from '../../../utils/terminal.js';

/**
 * Checkout branch action
 */
export async function checkoutBranch(
  branch: GitBranch
): Promise<ActionResult<GitBranch>> {
  try {
    await GitOperations.checkoutBranch(branch.name);
    writeLine(green(`✓ Successfully checked out branch '${branch.name}'`));
    return actionSuccess(`Successfully checked out branch '${branch.name}'`);
  } catch (error) {
    const errorMessage = `Error checking out branch: ${error instanceof Error ? error.message : String(error)}`;
    writeErrorLine(red(`✗ ${errorMessage}`));
    return actionFailure(errorMessage);
  }
}
