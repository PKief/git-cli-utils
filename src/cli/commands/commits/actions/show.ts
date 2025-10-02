import { GitCommit } from '../../../../core/git/commits.js';
import { GitExecutor } from '../../../../core/git/executor.js';
import { red } from '../../../ui/ansi.js';
import {
  ActionResult,
  actionFailure,
  actionSuccess,
} from '../../../utils/action-helpers.js';
import { writeErrorLine, writeLine } from '../../../utils/terminal.js';

/**
 * Show commit details action
 */
export async function showCommitDetails(
  commit: GitCommit
): Promise<ActionResult<GitCommit>> {
  try {
    const executor = GitExecutor.getInstance();
    const result = await executor.executeCommand(`git show ${commit.hash}`);
    writeLine(result.stdout);
    return actionSuccess(`Showed commit details`);
  } catch (error) {
    const errorMessage = `Show failed: ${error instanceof Error ? error.message : String(error)}`;
    writeErrorLine(red(`✗ ${errorMessage}`));
    return actionFailure(errorMessage);
  }
}
