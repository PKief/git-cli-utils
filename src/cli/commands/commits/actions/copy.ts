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
    writeLine(green(`✓ Copied '${commit.hash}'`));
    return actionSuccess(`Hash copied`);
  } catch (error) {
    const errorMessage = `Copy failed: ${error instanceof Error ? error.message : String(error)}`;
    writeErrorLine(red(`✗ ${errorMessage}`));
    return actionFailure(errorMessage);
  }
}
