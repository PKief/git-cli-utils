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
    const result = await GitOperations.checkoutBranch(branch.name);
    // Output the git command result
    const output = result.stdout?.trim() || result.stderr?.trim() || '';
    if (output) {
      writeLine(output);
    }
    writeLine(green(`✓ Switched to '${branch.name}'`));
    return actionSuccess(`Switched to '${branch.name}'`);
  } catch (error) {
    const errorMessage = `Failed to switch branch: ${error instanceof Error ? error.message : String(error)}`;
    writeErrorLine(red(`✗ ${errorMessage}`));
    return actionFailure(errorMessage);
  }
}
