import { GitCommit } from '../../../../core/git/commits.js';
import { GitOperations } from '../../../../core/git/operations.js';
import { green, red } from '../../../ui/ansi.js';
import {
  ActionResult,
  actionFailure,
  actionSuccess,
} from '../../../utils/action-helpers.js';
import { writeErrorLine, writeLine } from '../../../utils/terminal.js';

/**
 * Copy commit hash to clipboard action
 */
export async function copyCommitHash(
  commit: GitCommit
): Promise<ActionResult<GitCommit>> {
  try {
    await GitOperations.copyToClipboard(commit.hash);
    writeLine(green(`✓ Commit hash '${commit.hash}' copied to clipboard`));
    return actionSuccess(`Commit hash copied to clipboard`);
  } catch (error) {
    const errorMessage = `Error copying to clipboard: ${error instanceof Error ? error.message : String(error)}`;
    writeErrorLine(red(`✗ ${errorMessage}`));
    return actionFailure(errorMessage);
  }
}
