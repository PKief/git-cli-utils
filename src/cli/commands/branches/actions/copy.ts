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
 * Copy branch name to clipboard action
 */
export async function copyBranchName(
  branch: GitBranch
): Promise<ActionResult<GitBranch>> {
  try {
    await GitOperations.copyToClipboard(branch.name);
    writeLine(green(`✓ Copied '${branch.name}'`));
    return actionSuccess(`Branch name copied`);
  } catch (error) {
    const errorMessage = `Copy failed: ${error instanceof Error ? error.message : String(error)}`;
    writeErrorLine(red(`✗ ${errorMessage}`));
    return actionFailure(errorMessage);
  }
}
